-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Confirms existing uniqueness assumptions and enables sequence-backed inserts.
begin;

do $$
begin
  if exists (select 1 from public.departments group by lower(btrim(name)) having count(*) > 1) then
    raise exception 'Duplicate normalized department names must be resolved before migration 0012.';
  end if;
  if exists (
    select 1 from public.departments where slug is not null
    group by lower(btrim(slug)) having count(*) > 1
  ) then
    raise exception 'Duplicate normalized department slugs must be resolved before migration 0012.';
  end if;
end $$;

do $sequences$
declare
  departments_sequence text := pg_get_serial_sequence('public.departments', 'id');
  services_sequence text := pg_get_serial_sequence('public.services', 'id');
begin
  if departments_sequence is null or services_sequence is null then
    raise exception 'Department and service IDs must be sequence-backed before migration 0012.';
  end if;
  perform setval(departments_sequence::regclass,
    greatest(coalesce((select max(id) from public.departments), 1), 1),
    exists(select 1 from public.departments));
  perform setval(services_sequence::regclass,
    greatest(coalesce((select max(id) from public.services), 1), 1),
    exists(select 1 from public.services));
  execute format('grant usage, select on sequence %s to authenticated', departments_sequence);
  execute format('grant usage, select on sequence %s to authenticated', services_sequence);
end
$sequences$;

create unique index if not exists departments_name_normalized_unique
  on public.departments (lower(btrim(name)));
create unique index if not exists departments_slug_normalized_unique
  on public.departments (lower(btrim(slug))) where slug is not null;

commit;
