-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0001_auth_link_and_helpers.sql and a reviewed duplicate/null audit.

begin;

create index if not exists service_reports_service_id_idx
  on public.service_reports (service_id);
create index if not exists service_reports_department_id_idx
  on public.service_reports (department_id);
create index if not exists service_reports_service_department_idx
  on public.service_reports (service_id, department_id);
create index if not exists service_reports_submitted_by_id_idx
  on public.service_reports (submitted_by_id);
create index if not exists service_reports_approved_by_id_idx
  on public.service_reports (approved_by_id);

alter table public.service_reports enable row level security;
revoke all on public.service_reports from anon, authenticated;
grant select, insert, update, delete on public.service_reports to authenticated;

drop policy if exists service_reports_read_authorized on public.service_reports;
create policy service_reports_read_authorized
on public.service_reports
for select
to authenticated
using (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
  or (
    (select private.current_admin_is_department_lead_only())
    and department_id = (select private.current_admin_department_id())
  )
);

drop policy if exists service_reports_insert_authorized on public.service_reports;
create policy service_reports_insert_authorized
on public.service_reports
for insert
to authenticated
with check (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
  or (
    (select private.current_admin_is_department_lead_only())
    and department_id = (select private.current_admin_department_id())
  )
);

drop policy if exists service_reports_update_authorized on public.service_reports;
create policy service_reports_update_authorized
on public.service_reports
for update
to authenticated
using (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
  or (
    (select private.current_admin_is_department_lead_only())
    and department_id = (select private.current_admin_department_id())
  )
)
with check (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
  or (
    (select private.current_admin_is_department_lead_only())
    and department_id = (select private.current_admin_department_id())
  )
);

drop policy if exists service_reports_delete_admin_only on public.service_reports;
create policy service_reports_delete_admin_only
on public.service_reports
for delete
to authenticated
using ((select private.current_admin_has_role('admin')));

create or replace function private.enforce_service_report_actor_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id bigint := (select private.current_admin_id());
  actor_department_id bigint := (select private.current_admin_department_id());
begin
  if actor_id is null then
    if tg_op = 'INSERT'
      and current_setting('app.public_operation_verified', true) = 'true' then
      new.submitted_by_id := null;
      new.is_approved := false;
      new.approved_by_id := null;
      new.approved_at := null;
      return new;
    end if;
    raise exception 'An active admin profile is required.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.submitted_by_id := actor_id;
  end if;

  if (select private.current_admin_is_department_lead_only()) then
    if actor_department_id is null or new.department_id is distinct from actor_department_id then
      raise exception 'Department leads can modify only their department reports.' using errcode = '42501';
    end if;

    if tg_op = 'INSERT' then
      new.is_approved := false;
      new.approved_by_id := null;
      new.approved_at := null;
    elsif
      new.is_approved is distinct from old.is_approved
      or new.approved_by_id is distinct from old.approved_by_id
      or new.approved_at is distinct from old.approved_at
    then
      raise exception 'Department leads cannot change report approval fields.' using errcode = '42501';
    end if;
  elsif new.is_approved = true then
    new.approved_by_id := coalesce(new.approved_by_id, actor_id);
    new.approved_at := coalesce(new.approved_at, now());
  else
    new.approved_by_id := null;
    new.approved_at := null;
  end if;

  return new;
end
$$;

revoke all on function private.enforce_service_report_actor_fields() from public;

drop trigger if exists service_reports_enforce_actor_fields on public.service_reports;
create trigger service_reports_enforce_actor_fields
before insert or update on public.service_reports
for each row execute function private.enforce_service_report_actor_fields();

-- Migration 0007 adds the unique (service_id, department_id) index only after
-- its preflight duplicate/content audit reports zero conflicts.

commit;
