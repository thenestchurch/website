-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0001_auth_link_and_helpers.sql, 0003_members_attendance_rls.sql,
-- and a reviewed duplicate/sequence audit against the target database.

begin;

do $audit$
begin
  if exists (
    select 1
    from public.attendance_records
    where service_id is not null
    group by member_id, service_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate member/service attendance rows must be resolved before migration 0006.';
  end if;

  if exists (
    select 1
    from public.attendance_records
    where service_id is null
    group by member_id, ((date at time zone 'UTC')::date)
    having count(*) > 1
  ) then
    raise exception 'Duplicate date-only attendance rows must be resolved before migration 0006.';
  end if;
end
$audit$;

do $sequence$
declare sequence_name text := pg_get_serial_sequence('public.attendance_records', 'id');
begin
  if sequence_name is null then
    raise exception 'public.attendance_records.id must be sequence-backed before migration 0006.';
  end if;
  perform setval(sequence_name::regclass,
    greatest(coalesce((select max(id) from public.attendance_records), 0), 1),
    exists (select 1 from public.attendance_records));
  execute format('grant usage, select on sequence %s to authenticated', sequence_name);
end
$sequence$;

create unique index if not exists attendance_records_member_service_unique
  on public.attendance_records (member_id, service_id)
  where service_id is not null;

create unique index if not exists attendance_records_member_date_without_service_unique
  on public.attendance_records (member_id, ((date at time zone 'UTC')::date))
  where service_id is null;

create or replace function public.save_attendance_register(
  p_date timestamptz,
  p_entries jsonb,
  p_service_id integer default null
)
returns setof public.attendance_records
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  entry jsonb;
  entry_member_id integer;
  entry_notes text;
  entry_present boolean;
  effective_date timestamptz;
  saved_record public.attendance_records%rowtype;
begin
  if not (
    (select private.current_admin_has_role('admin'))
    or (select private.current_admin_has_role('staff'))
  ) then
    raise insufficient_privilege using message = 'Admin or staff attendance access is required.';
  end if;

  if jsonb_typeof(p_entries) <> 'array'
    or jsonb_array_length(p_entries) < 1
    or jsonb_array_length(p_entries) > 100 then
    raise exception 'Attendance entries must be a JSON array containing between 1 and 100 rows.';
  end if;

  if p_service_id is null then
    effective_date := date_trunc('day', p_date at time zone 'UTC') at time zone 'UTC';
  else
    select services.date
      into effective_date
      from public.services
      where services.id = p_service_id
        and coalesce(services.is_active, true);

    if not found then
      raise exception 'The selected active service does not exist.';
    end if;
  end if;

  if effective_date is null then
    raise exception 'An attendance date is required.';
  end if;

  for entry in select value from jsonb_array_elements(p_entries)
  loop
    entry_member_id := (entry ->> 'memberId')::integer;
    entry_present := coalesce((entry ->> 'present')::boolean, false);
    entry_notes := nullif(btrim(entry ->> 'notes'), '');

    if entry_member_id is null
      or not exists (select 1 from public.members where id = entry_member_id) then
      raise exception 'Every attendance entry must reference an existing member.';
    end if;

    if p_service_id is null then
      insert into public.attendance_records (
        member_id,
        service_id,
        date,
        present,
        notes,
        updated_at
      ) values (
        entry_member_id,
        null,
        effective_date,
        entry_present,
        entry_notes,
        now()
      )
      on conflict (member_id, ((date at time zone 'UTC')::date)) where service_id is null
      do update set
        present = excluded.present,
        notes = excluded.notes,
        updated_at = now()
      returning * into saved_record;
    else
      insert into public.attendance_records (
        member_id,
        service_id,
        date,
        present,
        notes,
        updated_at
      ) values (
        entry_member_id,
        p_service_id,
        effective_date,
        entry_present,
        entry_notes,
        now()
      )
      on conflict (member_id, service_id) where service_id is not null
      do update set
        date = excluded.date,
        present = excluded.present,
        notes = excluded.notes,
        updated_at = now()
      returning * into saved_record;
    end if;

    return next saved_record;
  end loop;
end
$function$;

revoke all on function public.save_attendance_register(timestamptz, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.save_attendance_register(timestamptz, jsonb, integer)
  to authenticated;

commit;
