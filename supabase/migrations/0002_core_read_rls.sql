-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0001_auth_link_and_helpers.sql and a reviewed live-schema audit.

begin;

alter table public.admins enable row level security;
alter table public.admins_roles enable row level security;
alter table public.departments enable row level security;
alter table public.services enable row level security;

-- Supabase roles receive no direct access to legacy password material.
revoke all on public.admins from anon, authenticated;
grant select (
  id,
  name,
  email,
  auth_user_id,
  department_id,
  is_active,
  is_super_admin,
  created_at,
  updated_at
) on public.admins to authenticated;
revoke all on public.admins_roles from anon, authenticated;
grant select on public.admins_roles to authenticated;

revoke all on public.departments from anon, authenticated;
grant select, insert, update, delete on public.departments to authenticated;

revoke all on public.services from anon, authenticated;
grant select, insert, update, delete on public.services to authenticated;

drop policy if exists admins_read_self_or_admin on public.admins;
create policy admins_read_self_or_admin
on public.admins
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or (select private.current_admin_has_role('admin'))
);

drop policy if exists admins_manage_admin_only on public.admins;
create policy admins_manage_admin_only
on public.admins
for all
to authenticated
using ((select private.current_admin_has_role('admin')))
with check ((select private.current_admin_has_role('admin')));

drop policy if exists admins_roles_read_self_or_admin on public.admins_roles;
create policy admins_roles_read_self_or_admin
on public.admins_roles
for select
to authenticated
using (
  parent_id = (select private.current_admin_id())
  or (select private.current_admin_has_role('admin'))
);

drop policy if exists admins_roles_manage_admin_only on public.admins_roles;
create policy admins_roles_manage_admin_only
on public.admins_roles
for all
to authenticated
using ((select private.current_admin_has_role('admin')))
with check ((select private.current_admin_has_role('admin')));

drop policy if exists departments_read_authenticated on public.departments;
create policy departments_read_authenticated
on public.departments
for select
to authenticated
using ((select private.current_admin_id()) is not null);

drop policy if exists departments_manage_admin_staff on public.departments;
create policy departments_manage_admin_staff
on public.departments
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

drop policy if exists services_read_authenticated on public.services;
create policy services_read_authenticated
on public.services
for select
to authenticated
using ((select private.current_admin_id()) is not null);

drop policy if exists services_manage_admin_staff on public.services;
create policy services_manage_admin_staff
on public.services
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
