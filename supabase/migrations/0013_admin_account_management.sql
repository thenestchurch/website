-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0001_auth_link_and_helpers.sql and 0002_core_read_rls.sql.
begin;

do $$
begin
  if exists (select 1 from public.admins group by lower(btrim(email)) having count(*) > 1) then
    raise exception 'Duplicate normalized admin emails must be resolved before migration 0013.';
  end if;
end $$;

create unique index if not exists admins_email_normalized_unique
  on public.admins (lower(btrim(email)));
do $sequences$
declare
  admins_sequence text := pg_get_serial_sequence('public.admins', 'id');
  roles_sequence text := pg_get_serial_sequence('public.admins_roles', 'id');
begin
  if admins_sequence is null or roles_sequence is null then
    raise exception 'Admin profile IDs must be sequence-backed before migration 0013.';
  end if;
  perform setval(admins_sequence::regclass,
    greatest(coalesce((select max(id) from public.admins), 1), 1),
    exists(select 1 from public.admins));
  perform setval(roles_sequence::regclass,
    greatest(coalesce((select max(id) from public.admins_roles), 1), 1),
    exists(select 1 from public.admins_roles));
end
$sequences$;

create or replace function public.list_admin_accounts()
returns table (
  id integer, name text, email text, auth_user_id uuid, department_id integer,
  is_active boolean, is_super_admin boolean, roles public.enum_admins_roles[],
  created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.current_admin_has_role('admin') then
    raise insufficient_privilege using message = 'Admin access is required.';
  end if;
  return query
  select a.id, a.name::text, a.email::text, a.auth_user_id, a.department_id,
    a.is_active, coalesce(a.is_super_admin, false),
    coalesce(array_agg(r.value order by r."order") filter (where r.value is not null), array[]::public.enum_admins_roles[]),
    a.created_at, a.updated_at
  from public.admins a
  left join public.admins_roles r on r.parent_id = a.id
  group by a.id
  order by a.name;
end;
$$;

create or replace function public.save_admin_account(
  p_id integer,
  p_name text,
  p_email text,
  p_auth_user_id uuid,
  p_department_id integer,
  p_is_active boolean,
  p_is_super_admin boolean,
  p_roles public.enum_admins_roles[]
)
returns table (
  id integer, name text, email text, auth_user_id uuid, department_id integer,
  is_active boolean, is_super_admin boolean, roles public.enum_admins_roles[],
  created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id integer;
  actor_id integer := private.current_admin_id();
  role_value public.enum_admins_roles;
  role_order integer := 0;
begin
  if not private.current_admin_has_role('admin') then
    raise insufficient_privilege using message = 'Admin access is required.';
  end if;
  perform pg_advisory_xact_lock(208479, 1);
  if nullif(btrim(p_name), '') is null or p_email !~* '^[^@[:space:]]+@[^@[:space:]]+$'
    or p_auth_user_id is null or p_is_active is null or p_is_super_admin is null
    or p_roles is null or cardinality(p_roles) < 1 then
    raise exception 'Name, email, Auth user, and at least one role are required.';
  end if;
  if cardinality(p_roles) <> (select count(distinct candidate) from unnest(p_roles) candidate) then
    raise exception 'Account roles must not contain duplicates.';
  end if;
  if 'department-lead' = any(p_roles) and p_department_id is null then
    raise exception 'Department leads require an assigned department.';
  end if;
  if p_department_id is not null and not exists (select 1 from public.departments where departments.id = p_department_id) then
    raise exception 'The selected department does not exist.';
  end if;
  if p_id = actor_id and (
    not p_is_active or (not p_is_super_admin and not ('admin' = any(p_roles)))
  ) then
    raise exception 'You cannot remove your own administrator access.';
  end if;
  if p_id is not null
    and (not p_is_active or (not p_is_super_admin and not ('admin' = any(p_roles))))
    and exists (
      select 1 from public.admins target
      where target.id = p_id and target.is_active
        and (coalesce(target.is_super_admin, false) or exists (
          select 1 from public.admins_roles target_role
          where target_role.parent_id = target.id and target_role.value = 'admin'
        ))
    )
    and not exists (
      select 1 from public.admins other
      where other.id <> p_id and other.is_active
        and (coalesce(other.is_super_admin, false) or exists (
          select 1 from public.admins_roles other_role
          where other_role.parent_id = other.id and other_role.value = 'admin'
        ))
    )
  then
    raise exception 'At least one active administrator account must remain.';
  end if;

  if p_id is null then
    insert into public.admins (name, email, auth_user_id, department_id, is_active, is_super_admin)
    values (btrim(p_name), lower(btrim(p_email)), p_auth_user_id, p_department_id, p_is_active, p_is_super_admin)
    returning admins.id into saved_id;
  else
    update public.admins set
      name = btrim(p_name), email = lower(btrim(p_email)), auth_user_id = p_auth_user_id,
      department_id = p_department_id, is_active = p_is_active,
      is_super_admin = p_is_super_admin, updated_at = now()
    where admins.id = p_id returning admins.id into saved_id;
    if not found then raise exception 'Account not found.'; end if;
  end if;

  delete from public.admins_roles where parent_id = saved_id;
  foreach role_value in array p_roles loop
    insert into public.admins_roles (parent_id, "order", value)
    values (saved_id, role_order, role_value);
    role_order := role_order + 1;
  end loop;

  return query select * from public.list_admin_accounts() account where account.id = saved_id;
end;
$$;

create or replace function public.get_admin_summaries(p_ids integer[])
returns table (id integer, name text, email text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (
    private.current_admin_has_role('admin')
    or private.current_admin_has_role('staff')
  ) then
    raise insufficient_privilege using message = 'Admin or staff access is required.';
  end if;
  if p_ids is null or cardinality(p_ids) > 500 then
    raise exception 'Between 0 and 500 admin IDs are allowed.';
  end if;
  return query
  select account.id, account.name::text, account.email::text
  from public.admins account
  where account.id = any(p_ids)
  order by account.name;
end;
$$;

revoke all on function public.list_admin_accounts() from public, anon, authenticated;
revoke all on function public.get_admin_summaries(integer[]) from public, anon, authenticated;
revoke all on function public.save_admin_account(integer, text, text, uuid, integer, boolean, boolean, public.enum_admins_roles[])
  from public, anon, authenticated;
grant execute on function public.list_admin_accounts() to authenticated;
grant execute on function public.get_admin_summaries(integer[]) to authenticated;
grant execute on function public.save_admin_account(integer, text, text, uuid, integer, boolean, boolean, public.enum_admins_roles[])
  to authenticated;

commit;
