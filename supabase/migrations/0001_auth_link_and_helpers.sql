-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Review against an audited live schema before execution.

begin;

alter table public.admins
  add column if not exists auth_user_id uuid,
  add column if not exists is_active boolean not null default true;

-- The legacy application modeled authUserId as text. If prior schema setup created that column before
-- this migration, validate every nonblank value before converting it to UUID.
do $auth_type$
declare
  auth_user_id_type text;
begin
  select data_type into auth_user_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'admins' and column_name = 'auth_user_id';

  if auth_user_id_type in ('text', 'character varying') then
    if exists (
      select 1 from public.admins
      where nullif(btrim(auth_user_id::text), '') is not null
        and btrim(auth_user_id::text) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) then
      raise exception 'Invalid admins.auth_user_id values must be resolved before migration 0001.';
    end if;

    alter table public.admins
      alter column auth_user_id type uuid
      using nullif(btrim(auth_user_id::text), '')::uuid;
  elsif auth_user_id_type <> 'uuid' then
    raise exception 'Unsupported admins.auth_user_id type: %', auth_user_id_type;
  end if;
end
$auth_type$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admins_auth_user_id_fkey'
      and conrelid = 'public.admins'::regclass
  ) then
    alter table public.admins
      add constraint admins_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end
$$;

create unique index if not exists admins_auth_user_id_unique
  on public.admins (auth_user_id)
  where auth_user_id is not null;

create index if not exists admins_department_id_idx
  on public.admins (department_id);

create index if not exists admins_roles_parent_id_idx
  on public.admins_roles (parent_id);

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.current_admin_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select admin.id::bigint
  from public.admins as admin
  where admin.auth_user_id = auth.uid()
    and admin.is_active = true
  limit 1
$$;

create or replace function private.current_admin_department_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select admin.department_id::bigint
  from public.admins as admin
  where admin.auth_user_id = auth.uid()
    and admin.is_active = true
  limit 1
$$;

create or replace function private.current_admin_has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.admins as admin
      where admin.auth_user_id = auth.uid()
        and admin.is_active = true
        and (
          admin.is_super_admin = true
          or exists (
            select 1
            from public.admins_roles as role
            where role.parent_id = admin.id
              and role.value::text = required_role
          )
        )
    ),
    false
  )
$$;

create or replace function private.current_admin_is_department_lead_only()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.current_admin_has_role('department-lead'))
    and not (select private.current_admin_has_role('admin'))
    and not (select private.current_admin_has_role('staff'))
$$;

revoke all on function private.current_admin_id() from public;
revoke all on function private.current_admin_department_id() from public;
revoke all on function private.current_admin_has_role(text) from public;
revoke all on function private.current_admin_is_department_lead_only() from public;

grant usage on schema private to authenticated;
grant execute on function private.current_admin_id() to authenticated;
grant execute on function private.current_admin_department_id() to authenticated;
grant execute on function private.current_admin_has_role(text) to authenticated;
grant execute on function private.current_admin_is_department_lead_only() to authenticated;

commit;
