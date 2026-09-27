-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0002_core_read_rls.sql, 0004_service_reports_rls.sql, and a
-- reviewed duplicate/content/sequence audit against the target database.

begin;

do $audit$
begin
  if exists (
    select 1
    from public.service_reports
    group by service_id, department_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate service/department reports must be resolved before migration 0007.';
  end if;

  if exists (
    select 1
    from public.service_reports
    where btrim(title) = ''
      or btrim(report_content) = ''
      or coalesce(department_attendance, 0) < 0
      or coalesce(volunteers_count, 0) < 0
  ) then
    raise exception 'Invalid service report content or counts must be resolved before migration 0007.';
  end if;
end
$audit$;

do $sequences$
declare
  services_sequence text := pg_get_serial_sequence('public.services', 'id');
  reports_sequence text := pg_get_serial_sequence('public.service_reports', 'id');
begin
  if services_sequence is null or reports_sequence is null then
    raise exception 'Services and service reports IDs must be sequence-backed before migration 0007.';
  end if;
  perform setval(services_sequence::regclass,
    greatest(coalesce((select max(id) from public.services), 0), 1),
    exists (select 1 from public.services));
  perform setval(reports_sequence::regclass,
    greatest(coalesce((select max(id) from public.service_reports), 0), 1),
    exists (select 1 from public.service_reports));
  execute format('grant usage, select on sequence %s to authenticated', reports_sequence);
end
$sequences$;

create unique index if not exists service_reports_service_department_unique
  on public.service_reports (service_id, department_id);

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'service_reports_nonnegative_counts'
      and conrelid = 'public.service_reports'::regclass
  ) then
    alter table public.service_reports
      add constraint service_reports_nonnegative_counts
      check (
        coalesce(department_attendance, 0) >= 0
        and coalesce(volunteers_count, 0) >= 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'service_reports_nonempty_content'
      and conrelid = 'public.service_reports'::regclass
  ) then
    alter table public.service_reports
      add constraint service_reports_nonempty_content
      check (btrim(title) <> '' and btrim(report_content) <> '');
  end if;
end
$constraints$;

commit;
