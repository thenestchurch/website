-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0005_report_content_rls.sql and a duplicate instruction audit.
begin;

do $$
begin
  if exists (
    select 1 from public.report_instructions
    group by department_id having count(*) > 1
  ) then
    raise exception 'Duplicate report instructions must be resolved before migration 0011.';
  end if;
end $$;

create unique index if not exists report_instructions_department_unique
  on public.report_instructions (department_id);
do $sequences$
declare
  instructions_sequence text := pg_get_serial_sequence('public.report_instructions', 'id');
  templates_sequence text := pg_get_serial_sequence('public.report_templates', 'id');
  relations_sequence text := pg_get_serial_sequence('public.report_templates_rels', 'id');
begin
  if instructions_sequence is null or templates_sequence is null or relations_sequence is null then
    raise exception 'Report content IDs must be sequence-backed before migration 0011.';
  end if;
  perform setval(instructions_sequence::regclass,
    greatest(coalesce((select max(id) from public.report_instructions), 1), 1),
    exists(select 1 from public.report_instructions));
  perform setval(templates_sequence::regclass,
    greatest(coalesce((select max(id) from public.report_templates), 1), 1),
    exists(select 1 from public.report_templates));
  perform setval(relations_sequence::regclass,
    greatest(coalesce((select max(id) from public.report_templates_rels), 1), 1),
    exists(select 1 from public.report_templates_rels));
  execute format('grant usage, select on sequence %s to authenticated', instructions_sequence);
  execute format('grant usage, select on sequence %s to authenticated', templates_sequence);
  execute format('grant usage, select on sequence %s to authenticated', relations_sequence);
end
$sequences$;

create or replace function public.save_report_instruction(
  p_id integer,
  p_title text,
  p_content text,
  p_department_id integer,
  p_is_active boolean
)
returns public.report_instructions
language plpgsql
security invoker
set search_path = ''
as $$
declare result public.report_instructions%rowtype;
begin
  if not (private.current_admin_has_role('admin') or private.current_admin_has_role('staff')) then
    raise insufficient_privilege using message = 'Admin or staff access is required.';
  end if;
  if nullif(btrim(p_title), '') is null or nullif(btrim(p_content), '') is null then
    raise exception 'Instruction title and content are required.';
  end if;
  if p_is_active is null then raise exception 'Instruction active status is required.'; end if;
  if not exists (select 1 from public.departments where id = p_department_id) then
    raise exception 'The selected department does not exist.';
  end if;

  if p_id is null then
    insert into public.report_instructions (title, content, department_id, is_active)
    values (btrim(p_title), btrim(p_content), p_department_id, p_is_active)
    returning * into result;
  else
    update public.report_instructions set
      title = btrim(p_title), content = btrim(p_content),
      department_id = p_department_id, is_active = p_is_active, updated_at = now()
    where id = p_id returning * into result;
    if not found then raise exception 'Report instruction not found.'; end if;
  end if;
  return result;
end;
$$;

create or replace function public.save_report_template(
  p_id integer,
  p_title text,
  p_content text,
  p_department_ids integer[],
  p_is_active boolean
)
returns public.report_templates
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.report_templates%rowtype;
  template_id integer;
begin
  if not (private.current_admin_has_role('admin') or private.current_admin_has_role('staff')) then
    raise insufficient_privilege using message = 'Admin or staff access is required.';
  end if;
  if nullif(btrim(p_title), '') is null or nullif(btrim(p_content), '') is null then
    raise exception 'Template title and content are required.';
  end if;
  if p_is_active is null then raise exception 'Template active status is required.'; end if;
  if cardinality(coalesce(p_department_ids, array[]::integer[])) <>
    (select count(distinct department_id) from unnest(coalesce(p_department_ids, array[]::integer[])) department_id)
  then raise exception 'Template departments must not contain duplicates.'; end if;
  if exists (
    select 1 from unnest(coalesce(p_department_ids, array[]::integer[])) department_id
    where not exists (select 1 from public.departments where id = department_id)
  ) then raise exception 'A selected department does not exist.'; end if;

  if p_id is null then
    insert into public.report_templates (title, content, is_active)
    values (btrim(p_title), btrim(p_content), p_is_active)
    returning * into result;
  else
    update public.report_templates set
      title = btrim(p_title), content = btrim(p_content),
      is_active = p_is_active, updated_at = now()
    where id = p_id returning * into result;
    if not found then raise exception 'Report template not found.'; end if;
  end if;

  template_id := result.id;
  delete from public.report_templates_rels
  where parent_id = template_id and path = 'applicableDepartments';
  insert into public.report_templates_rels (parent_id, path, "order", departments_id)
  select template_id, 'applicableDepartments', ordinal - 1, department_id
  from unnest(coalesce(p_department_ids, array[]::integer[])) with ordinality values_with_order(department_id, ordinal);
  return result;
end;
$$;

revoke all on function public.save_report_instruction(integer, text, text, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.save_report_template(integer, text, text, integer[], boolean)
  from public, anon, authenticated;
grant execute on function public.save_report_instruction(integer, text, text, integer, boolean)
  to authenticated;
grant execute on function public.save_report_template(integer, text, text, integer[], boolean)
  to authenticated;

commit;
