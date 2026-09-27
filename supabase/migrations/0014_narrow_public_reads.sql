-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Public reads expose only fields already rendered by public application pages.
begin;

create or replace function public.list_public_departments()
returns table (id integer, name text)
language sql stable security definer set search_path = ''
as $$
  select department.id, department.name::text
  from public.departments department
  where coalesce(department.is_active, true)
  order by department.name
$$;

create or replace function public.list_public_services()
returns table (id integer, name text, date date, service_type text)
language sql stable security definer set search_path = ''
as $$
  select service.id, service.name::text, service.date::date, service.service_type::text
  from public.services service
  where coalesce(service.is_active, true)
  order by service.date desc
$$;

create or replace function public.list_public_report_instructions()
returns table (id integer, title text, content text, department_id integer)
language sql stable security definer set search_path = ''
as $$
  select instruction.id, instruction.title::text, instruction.content::text,
    instruction.department_id
  from public.report_instructions instruction
  where coalesce(instruction.is_active, true)
  order by instruction.title
$$;

create or replace function public.list_public_report_templates()
returns table (
  id integer, title text, content text, applicable_department_ids integer[]
)
language sql stable security definer set search_path = ''
as $$
  select template.id, template.title::text, template.content::text,
    coalesce(array_agg(relation.departments_id order by relation."order")
      filter (where relation.departments_id is not null), array[]::integer[])
  from public.report_templates template
  left join public.report_templates_rels relation
    on relation.parent_id = template.id and relation.path = 'applicableDepartments'
  where coalesce(template.is_active, true)
  group by template.id
  order by template.title
$$;

create or replace function public.search_public_attendance_members(
  p_query text, p_date date, p_secret text
)
returns table (
  id integer, first_name text, full_name text, department_name text,
  record_id integer, record_present boolean
)
language plpgsql stable security definer set search_path = ''
as $$
declare pattern text;
begin
  perform private.assert_public_operation_secret(p_secret);
  if length(btrim(p_query)) < 2 then return; end if;
  pattern := '%' || replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  return query
  select member.id, member.first_name::text,
    coalesce(member.full_name, concat_ws(' ', member.first_name, member.last_name))::text,
    coalesce(department.name, 'No department')::text,
    attendance.id, coalesce(attendance.present, false)
  from public.members member
  left join public.departments department on department.id = member.department_id
  left join public.attendance_records attendance
    on attendance.member_id = member.id and attendance.service_id is null
      and (attendance.date at time zone 'UTC')::date = p_date
  where member.full_name ilike pattern escape '\'
    or member.first_name ilike pattern escape '\'
    or member.last_name ilike pattern escape '\'
    or member.phone_number ilike pattern escape '\'
    or member.whatsapp_number ilike pattern escape '\'
    or department.name ilike pattern escape '\'
  order by member.full_name
  limit 40;
end;
$$;

revoke all on function public.list_public_departments() from public, anon, authenticated;
revoke all on function public.list_public_services() from public, anon, authenticated;
revoke all on function public.list_public_report_instructions() from public, anon, authenticated;
revoke all on function public.list_public_report_templates() from public, anon, authenticated;
revoke all on function public.search_public_attendance_members(text, date, text) from public, anon, authenticated;
grant execute on function public.list_public_departments() to anon;
grant execute on function public.list_public_services() to anon;
grant execute on function public.list_public_report_instructions() to anon;
grant execute on function public.list_public_report_templates() to anon;
grant execute on function public.search_public_attendance_members(text, date, text) to anon;

commit;
