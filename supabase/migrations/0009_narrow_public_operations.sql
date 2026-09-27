-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Requires an operator to insert a bcrypt hash for PUBLIC_OPERATIONS_SECRET into
-- private.public_operation_secrets after review; this file contains no secret.
begin;

create table if not exists private.public_operation_secrets (
  name text primary key,
  secret_hash text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
revoke all on private.public_operation_secrets from public, anon, authenticated;

do $crypto$
begin
  if to_regprocedure('extensions.crypt(text,text)') is null then
    raise exception 'pgcrypto must be installed in the extensions schema before migration 0009.';
  end if;
end
$crypto$;

create or replace function private.assert_public_operation_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_hash text;
begin
  select secret_hash into stored_hash
  from private.public_operation_secrets
  where name = 'public-operations' and is_active;

  if stored_hash is null
    or p_secret is null
    or stored_hash is distinct from extensions.crypt(p_secret, stored_hash) then
    raise insufficient_privilege using message = 'Invalid public operation credential.';
  end if;
end;
$$;
revoke all on function private.assert_public_operation_secret(text) from public, anon, authenticated;

create or replace function public.register_public_member(p_input jsonb, p_secret text)
returns public.members
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.members%rowtype;
  first_name text := nullif(btrim(p_input ->> 'firstName'), '');
  last_name text := nullif(btrim(p_input ->> 'lastName'), '');
  department_id integer := nullif(p_input ->> 'departmentId', '')::integer;
  preferred_department_id integer := nullif(p_input ->> 'preferredDepartmentId', '')::integer;
  profile_picture_id integer := nullif(p_input ->> 'profilePictureId', '')::integer;
begin
  perform private.assert_public_operation_secret(p_secret);
  if first_name is null or last_name is null or length(first_name) > 100 or length(last_name) > 100 then
    raise exception 'Valid first and last names are required.';
  end if;
  if department_id is not null and not exists (
    select 1 from public.departments where id = department_id and coalesce(is_active, true)
  ) then raise exception 'Invalid department.'; end if;
  if preferred_department_id is not null and not exists (
    select 1 from public.departments where id = preferred_department_id and coalesce(is_active, true)
  ) then raise exception 'Invalid preferred department.'; end if;
  if profile_picture_id is not null and not exists (
    select 1 from public.media where id = profile_picture_id
  ) then raise exception 'Invalid profile picture.'; end if;

  insert into public.members (
    first_name, middle_name, last_name, email, phone_number, whatsapp_number,
    date_of_birth, date_joined, department_id, preferred_department_id,
    profile_picture_id, is_new_comer
  ) values (
    first_name, nullif(btrim(p_input ->> 'middleName'), ''), last_name,
    nullif(lower(btrim(p_input ->> 'email')), ''), nullif(btrim(p_input ->> 'phoneNumber'), ''),
    nullif(btrim(p_input ->> 'whatsappNumber'), ''), nullif(p_input ->> 'dateOfBirth', '')::timestamptz,
    nullif(p_input ->> 'dateJoined', '')::timestamptz, department_id, preferred_department_id,
    profile_picture_id, true
  ) returning * into result;
  return result;
end;
$$;

create or replace function public.submit_public_service_report(p_input jsonb, p_secret text)
returns public.service_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.service_reports%rowtype;
  service_id integer := (p_input ->> 'serviceId')::integer;
  department_id integer := (p_input ->> 'departmentId')::integer;
  report_content text := nullif(btrim(p_input ->> 'reportContent'), '');
  department_attendance integer := greatest(coalesce((p_input ->> 'departmentAttendance')::integer, 0), 0);
  volunteers_count integer := greatest(coalesce((p_input ->> 'volunteersCount')::integer, 0), 0);
begin
  perform private.assert_public_operation_secret(p_secret);
  if report_content is null then raise exception 'Report content is required.'; end if;
  if not exists (select 1 from public.services where id = service_id and coalesce(is_active, true)) then
    raise exception 'Invalid active service.';
  end if;
  if not exists (select 1 from public.departments where id = department_id and coalesce(is_active, true)) then
    raise exception 'Invalid active department.';
  end if;
  perform set_config('app.public_operation_verified', 'true', true);
  insert into public.service_reports (
    service_id, department_id, title, report_content, attachment_url,
    department_attendance, volunteers_count, is_approved,
    submitted_by_id, approved_by_id, approved_at
  ) values (
    service_id, department_id, coalesce(nullif(btrim(p_input ->> 'title'), ''), 'Department service report'),
    report_content, nullif(btrim(p_input ->> 'attachmentUrl'), ''), department_attendance,
    volunteers_count, false, null, null, null
  ) returning * into result;
  return result;
end;
$$;

create or replace function public.save_public_attendance_register(
  p_date timestamptz,
  p_entries jsonb,
  p_secret text
)
returns setof public.attendance_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry jsonb;
  member_id integer;
  saved public.attendance_records%rowtype;
begin
  perform private.assert_public_operation_secret(p_secret);
  if p_date is null or jsonb_typeof(p_entries) <> 'array'
    or jsonb_array_length(p_entries) < 1 or jsonb_array_length(p_entries) > 40 then
    raise exception 'Attendance requires a date and between 1 and 40 entries.';
  end if;
  for entry in select value from jsonb_array_elements(p_entries)
  loop
    member_id := (entry ->> 'memberId')::integer;
    if not exists (select 1 from public.members where id = member_id) then
      raise exception 'Invalid member.';
    end if;
    insert into public.attendance_records (member_id, service_id, date, present, notes, updated_at)
    values (member_id, null, date_trunc('day', p_date at time zone 'UTC') at time zone 'UTC', coalesce((entry ->> 'present')::boolean, false), null, now())
    on conflict (member_id, ((date at time zone 'UTC')::date)) where service_id is null
    do update set present = excluded.present, notes = null, updated_at = now()
    returning * into saved;
    return next saved;
  end loop;
end;
$$;

revoke all on function public.register_public_member(jsonb, text) from public, anon, authenticated;
revoke all on function public.submit_public_service_report(jsonb, text) from public, anon, authenticated;
revoke all on function public.save_public_attendance_register(timestamptz, jsonb, text) from public, anon, authenticated;
grant execute on function public.register_public_member(jsonb, text) to anon;
grant execute on function public.submit_public_service_report(jsonb, text) to anon;
grant execute on function public.save_public_attendance_register(timestamptz, jsonb, text) to anon;

commit;
