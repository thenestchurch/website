-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-11-02; register public members and attendance atomically.
-- Depends on 0006 and 0009.
begin;

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
  -- Store the Lagos calendar day at UTC midnight, matching date-only registers.
  -- Both writes commit together; attendance failures also roll back registration.
  insert into public.attendance_records (member_id, service_id, date, present)
  values (
    result.id,
    null,
    ((now() at time zone 'Africa/Lagos')::date::timestamp at time zone 'UTC'),
    true
  );
  return result;
end;
$$;

commit;
