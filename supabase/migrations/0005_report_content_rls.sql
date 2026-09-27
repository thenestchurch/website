-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- The report_templates_rels shape must be confirmed by the live-schema audit.

begin;

create index if not exists report_instructions_department_id_idx
  on public.report_instructions (department_id);
create index if not exists report_templates_rels_parent_id_idx
  on public.report_templates_rels (parent_id);
create index if not exists report_templates_rels_departments_id_idx
  on public.report_templates_rels (departments_id);
create index if not exists report_templates_rels_parent_path_order_idx
  on public.report_templates_rels (parent_id, path, "order");

alter table public.report_instructions enable row level security;
alter table public.report_templates enable row level security;
alter table public.report_templates_rels enable row level security;

revoke all on public.report_instructions from anon, authenticated;
revoke all on public.report_templates from anon, authenticated;
revoke all on public.report_templates_rels from anon, authenticated;

grant select, insert, update, delete on public.report_instructions to authenticated;
grant select, insert, update, delete on public.report_templates to authenticated;
grant select, insert, update, delete on public.report_templates_rels to authenticated;

drop policy if exists report_instructions_read_authenticated on public.report_instructions;
create policy report_instructions_read_authenticated
on public.report_instructions
for select
to authenticated
using ((select private.current_admin_id()) is not null);

drop policy if exists report_instructions_manage_admin_staff on public.report_instructions;
create policy report_instructions_manage_admin_staff
on public.report_instructions
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

drop policy if exists report_templates_read_authenticated on public.report_templates;
create policy report_templates_read_authenticated
on public.report_templates
for select
to authenticated
using ((select private.current_admin_id()) is not null);

drop policy if exists report_templates_manage_admin_staff on public.report_templates;
create policy report_templates_manage_admin_staff
on public.report_templates
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

drop policy if exists report_template_rels_read_authenticated on public.report_templates_rels;
create policy report_template_rels_read_authenticated
on public.report_templates_rels
for select
to authenticated
using ((select private.current_admin_id()) is not null);

drop policy if exists report_template_rels_manage_admin_staff on public.report_templates_rels;
create policy report_template_rels_manage_admin_staff
on public.report_templates_rels
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
