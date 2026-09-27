-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0001_auth_link_and_helpers.sql and a reviewed live-schema audit.

begin;

create index if not exists members_department_id_idx
  on public.members (department_id);
create index if not exists members_preferred_department_id_idx
  on public.members (preferred_department_id);
create index if not exists attendance_records_member_id_idx
  on public.attendance_records (member_id);
create index if not exists attendance_records_service_id_idx
  on public.attendance_records (service_id);
create index if not exists attendance_records_date_present_idx
  on public.attendance_records (date, present);
create index if not exists attendance_records_service_member_idx
  on public.attendance_records (service_id, member_id);

alter table public.members enable row level security;
alter table public.attendance_records enable row level security;

revoke all on public.members from anon, authenticated;
grant select, insert, update, delete on public.members to authenticated;

revoke all on public.attendance_records from anon, authenticated;
grant select, insert, update, delete on public.attendance_records to authenticated;

drop policy if exists members_read_authorized_staff on public.members;
create policy members_read_authorized_staff
on public.members
for select
to authenticated
using (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
  or (select private.current_admin_has_role('absentee-viewer'))
);

drop policy if exists members_manage_admin_staff on public.members;
create policy members_manage_admin_staff
on public.members
for all
to authenticated
using (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
)
with check (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
);

drop policy if exists attendance_read_authorized_staff on public.attendance_records;
create policy attendance_read_authorized_staff
on public.attendance_records
for select
to authenticated
using (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
  or (select private.current_admin_has_role('absentee-viewer'))
);

drop policy if exists attendance_manage_admin_staff on public.attendance_records;
create policy attendance_manage_admin_staff
on public.attendance_records
for all
to authenticated
using (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
)
with check (
  (select private.current_admin_has_role('admin'))
  or (select private.current_admin_has_role('staff'))
);

commit;
