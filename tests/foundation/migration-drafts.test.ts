import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readDraft = (name: string) =>
  readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");

test("database migration files remain explicitly marked as reviewed versioned migrations", async () => {
  const drafts = await Promise.all([
    readDraft("0001_auth_link_and_helpers.sql"),
    readDraft("0002_core_read_rls.sql"),
    readDraft("0003_members_attendance_rls.sql"),
    readDraft("0004_service_reports_rls.sql"),
    readDraft("0005_report_content_rls.sql"),
    readDraft("0006_attendance_integrity_and_write_rpc.sql"),
    readDraft("0007_report_and_service_write_integrity.sql"),
    readDraft("0008_member_media_write_integrity.sql"),
    readDraft("0009_narrow_public_operations.sql"),
    readDraft("0010_birthday_settings_rls.sql"),
    readDraft("0011_report_content_write_rpcs.sql"),
    readDraft("0012_department_service_write_prerequisites.sql"),
    readDraft("0013_admin_account_management.sql"),
    readDraft("0014_narrow_public_reads.sql"),
    readDraft("0015_narrow_public_media.sql"),
  ]);

  for (const draft of drafts) {
    assert.match(draft, /VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31/);
    assert.match(draft, /\bbegin;/i);
    assert.match(draft, /\bcommit;/i);
  }
});

test("public media draft validates upload metadata without anonymous table grants", async () => {
  const draft = await readDraft("0015_narrow_public_media.sql");

  assert.match(draft, /private\.assert_public_operation_secret\(p_secret\)/i);
  assert.match(draft, /media_filesize > 5242880/i);
  assert.match(draft, /image\/avif[\s\S]+image\/webp/i);
  assert.match(draft, /media_storage_path !~ '\^members\//i);
  assert.match(draft, /if not found then return null/i);
  assert.doesNotMatch(draft, /grant (select|insert|update|delete).*to anon/i);
});

test("public read draft exposes narrow active lists and secret-checked member search", async () => {
  const draft = await readDraft("0014_narrow_public_reads.sql");

  assert.match(draft, /list_public_departments/i);
  assert.match(draft, /returns table \(id integer, name text\)/i);
  assert.match(draft, /returns table \(id integer, name text, date date, service_type text\)/i);
  assert.doesNotMatch(draft, /returns setof public\.(departments|services|report_instructions)/i);
  assert.match(draft, /private\.assert_public_operation_secret\(p_secret\)/i);
  assert.match(draft, /limit 40/i);
  assert.match(draft, /attendance\.service_id is null/i);
  assert.doesNotMatch(draft, /grant (select|insert|update|delete).*to anon/i);
});

test("account management draft exposes safe admin-only profile RPCs", async () => {
  const [rlsDraft, draft] = await Promise.all([
    readDraft("0002_core_read_rls.sql"),
    readDraft("0013_admin_account_management.sql"),
  ]);

  assert.match(draft, /admins_email_normalized_unique/i);
  assert.match(draft, /current_admin_has_role\('admin'\)/i);
  assert.match(draft, /You cannot remove your own administrator access/i);
  assert.match(draft, /At least one active administrator account must remain/i);
  assert.match(draft, /get_admin_summaries\(p_ids integer\[\]\)[\s\S]+returns table \(id integer, name text, email text\)/i);
  assert.match(draft, /get_admin_summaries[\s\S]+current_admin_has_role\('staff'\)/i);
  assert.match(draft, /cardinality\(p_ids\) > 500/i);
  assert.match(draft, /where account\.id = any\(p_ids\)\s+order by account\.name/i);
  assert.match(draft, /revoke all on function public\.get_admin_summaries\(integer\[\]\) from public, anon, authenticated/i);
  assert.match(draft, /grant execute on function public\.get_admin_summaries\(integer\[\]\) to authenticated/i);
  assert.match(draft, /security definer/i);
  assert.match(draft, /pg_advisory_xact_lock\(208479, 1\)/i);
  assert.match(draft, /p_roles is null/i);
  assert.match(draft, /roles must not contain duplicates/i);
  assert.match(draft, /'department-lead' = any\(p_roles\)/i);
  assert.match(draft, /delete from public\.admins_roles where parent_id = saved_id/i);
  assert.doesNotMatch(draft, /\bhash\b|\bsalt\b|reset_password/i);
  assert.doesNotMatch(draft, /grant execute[\s\S]+to anon/i);
  assert.doesNotMatch(rlsDraft, /grant (insert|update|delete)[\s\S]+on public\.admins to authenticated/i);
  assert.doesNotMatch(rlsDraft, /grant (?:select, )?insert[\s\S]+on public\.admins_roles to authenticated/i);
});

test("department and service write draft audits normalized identities and sequences", async () => {
  const draft = await readDraft("0012_department_service_write_prerequisites.sql");

  assert.match(draft, /group by lower\(btrim\(name\)\) having count\(\*\) > 1/i);
  assert.match(draft, /departments_name_normalized_unique/i);
  assert.match(draft, /departments_slug_normalized_unique/i);
  assert.match(draft, /pg_get_serial_sequence\('public\.departments', 'id'\)/i);
  assert.match(draft, /pg_get_serial_sequence\('public\.services', 'id'\)/i);
});

test("report content write draft is role-scoped and atomically replaces relations", async () => {
  const draft = await readDraft("0011_report_content_write_rpcs.sql");

  assert.match(draft, /group by department_id having count\(\*\) > 1/i);
  assert.match(draft, /report_instructions_department_unique/i);
  assert.match(draft, /security invoker/i);
  assert.match(draft, /current_admin_has_role\('admin'\)/i);
  assert.match(draft, /delete from public\.report_templates_rels/i);
  assert.match(draft, /with ordinality/i);
  assert.match(draft, /Template departments must not contain duplicates/i);
  assert.match(draft, /Report content IDs must be sequence-backed/i);
  assert.doesNotMatch(draft, /grant execute[\s\S]+to anon/i);
});

test("birthday settings draft enforces singleton and admin-staff access", async () => {
  const draft = await readDraft("0010_birthday_settings_rls.sql");

  assert.match(draft, /birthday_notification_settings_singleton/i);
  assert.match(draft, /select count\(\*\) from public\.birthday_notification_settings\) > 1/i);
  assert.match(draft, /birthday_settings_update_admin_staff/i);
  assert.match(draft, /birthday_logs_read_admin_staff/i);
  assert.match(draft, /where not exists \(select 1 from public\.birthday_notification_settings\)/i);
  assert.match(draft, /Happy birthday from The Nest Church/i);
  assert.doesNotMatch(draft, /grant[\s\S]+to anon/i);
});

test("public operation draft exposes only secret-checked narrow RPCs", async () => {
  const draft = await readDraft("0009_narrow_public_operations.sql");

  assert.match(draft, /private\.assert_public_operation_secret\(p_secret\)/i);
  assert.match(draft, /jsonb_array_length\(p_entries\) > 40/i);
  assert.match(draft, /profile_picture_id, is_new_comer/i);
  assert.match(draft, /false, null, null, null/i);
  assert.match(draft, /to_regprocedure\('extensions\.crypt\(text,text\)'\)/i);
  assert.match(draft, /date_trunc\('day', p_date at time zone 'UTC'\) at time zone 'UTC'/i);
  assert.match(draft, /on conflict \(member_id, \(\(date at time zone 'UTC'\)::date\)\) where service_id is null/i);
  assert.match(draft, /grant execute on function public\.register_public_member\(jsonb, text\) to anon/i);
  assert.doesNotMatch(draft, /grant (select|insert|update|delete).*to anon/i);
});

test("member and media draft audits identity, derives names, and bounds profile uploads", async () => {
  const draft = await readDraft("0008_member_media_write_integrity.sql");

  assert.match(draft, /group by lower\(btrim\(email\)\) having count\(\*\) > 1/i);
  assert.match(draft, /create trigger members_set_full_name/i);
  assert.match(draft, /pg_get_serial_sequence\('public\.members', 'id'\)/i);
  assert.match(draft, /pg_get_serial_sequence\('public\.media', 'id'\)/i);
  assert.match(draft, /'member-profile-pictures'[\s\S]+5242880/i);
  assert.match(draft, /member_profile_pictures_insert_admin_staff/i);
  assert.doesNotMatch(draft, /grant[\s\S]+on public\.media to anon/i);
});

test("attendance write draft is atomic, role-scoped, and unavailable to anonymous users", async () => {
  const draft = await readDraft("0006_attendance_integrity_and_write_rpc.sql");

  assert.match(draft, /attendance_records_member_service_unique/i);
  assert.match(draft, /attendance_records_member_date_without_service_unique/i);
  assert.match(draft, /group by member_id, \(\(date at time zone 'UTC'\)::date\)/i);
  assert.match(draft, /public\.attendance_records\.id must be sequence-backed/i);
  assert.match(draft, /grant usage, select on sequence %s to authenticated/i);
  assert.match(draft, /create or replace function public\.save_attendance_register/i);
  assert.match(draft, /security invoker/i);
  assert.doesNotMatch(draft, /security definer/i);
  assert.match(draft, /current_admin_has_role\('admin'\)/i);
  assert.match(draft, /current_admin_has_role\('staff'\)/i);
  assert.match(draft, /from public, anon, authenticated/i);
  assert.match(draft, /to authenticated/i);
  assert.doesNotMatch(draft, /grant execute[\s\S]+?to anon/i);
});

test("report and service write draft audits duplicates, sequences, and constraints", async () => {
  const [rlsDraft, integrityDraft] = await Promise.all([
    readDraft("0004_service_reports_rls.sql"),
    readDraft("0007_report_and_service_write_integrity.sql"),
  ]);

  assert.match(rlsDraft, /if tg_op = 'INSERT' then\s+new\.submitted_by_id := actor_id;/i);
  assert.match(integrityDraft, /group by service_id, department_id\s+having count\(\*\) > 1/i);
  assert.match(integrityDraft, /pg_get_serial_sequence\('public\.services', 'id'\)/i);
  assert.match(integrityDraft, /pg_get_serial_sequence\('public\.service_reports', 'id'\)/i);
  assert.match(integrityDraft, /service_reports_service_department_unique/i);
  assert.match(integrityDraft, /service_reports_nonnegative_counts/i);
  assert.match(integrityDraft, /service_reports_nonempty_content/i);
});

test("RLS draft never grants anonymous table access or forces owner RLS", async () => {
  const drafts = await Promise.all([
    readDraft("0002_core_read_rls.sql"),
    readDraft("0003_members_attendance_rls.sql"),
    readDraft("0004_service_reports_rls.sql"),
    readDraft("0005_report_content_rls.sql"),
  ]);
  const draft = drafts.join("\n");

  assert.doesNotMatch(draft, /\bgrant\s+[\s\S]+?\s+to\s+anon\b/i);
  assert.doesNotMatch(draft, /\bforce\s+row\s+level\s+security\b/i);
  assert.match(draft, /revoke all on public\.departments from anon, authenticated;/i);
  assert.match(draft, /revoke all on public\.services from anon, authenticated;/i);
  assert.match(draft, /revoke all on public\.members from anon, authenticated;/i);
  assert.match(draft, /revoke all on public\.attendance_records from anon, authenticated;/i);
});

test("service-report RLS scopes department leads and protects approval fields", async () => {
  const draft = await readDraft("0004_service_reports_rls.sql");

  assert.match(
    draft,
    /department_id = \(select private\.current_admin_department_id\(\)\)/i,
  );
  assert.match(draft, /service_reports_delete_admin_only/i);
  assert.match(draft, /Department leads cannot change report approval fields\./i);
  assert.match(draft, /new\.submitted_by_id := actor_id/i);
  assert.doesNotMatch(draft, /\bgrant\s+[\s\S]+?\s+to\s+anon\b/i);
});

test("report content RLS protects templates and their relation table", async () => {
  const draft = await readDraft("0005_report_content_rls.sql");

  assert.match(draft, /alter table public\.report_templates_rels enable row level security/i);
  assert.match(draft, /report_templates_rels_parent_path_order_idx/i);
  assert.match(draft, /report_template_rels_manage_admin_staff/i);
  assert.doesNotMatch(draft, /\bgrant\s+[\s\S]+?\s+to\s+anon\b/i);
});

test("authenticated admin read grant excludes legacy password columns and all direct writes", async () => {
  const draft = await readDraft("0002_core_read_rls.sql");
  const grants = [
    ...draft.matchAll(
      /grant select \(([\s\S]*?)\) on public\.admins to authenticated;/gi,
    ),
  ];

  assert.equal(grants.length, 1);
  for (const grant of grants) {
    assert.doesNotMatch(
      grant[1],
      /\bhash\b|\bsalt\b|reset_password|login_attempts|lock_until/i,
    );
    assert.match(grant[1], /\bauth_user_id\b/i);
    assert.match(grant[1], /\bis_active\b/i);
  }
  assert.doesNotMatch(draft, /grant (insert|update|delete)[\s\S]+on public\.admins to authenticated/i);
});

test("auth draft validates and converts pre-existing text auth IDs before adding the UUID FK", async () => {
  const draft = await readDraft("0001_auth_link_and_helpers.sql");

  assert.match(draft, /auth_user_id_type in \('text', 'character varying'\)/i);
  assert.match(draft, /Invalid admins\.auth_user_id values must be resolved/i);
  assert.match(draft, /alter column auth_user_id type uuid/i);
  assert.match(draft, /using nullif\(btrim\(auth_user_id::text\), ''\)::uuid/i);
});

test("public attendance search joins records by UTC calendar date", async () => {
  const draft = await readDraft("0014_narrow_public_reads.sql");
  assert.match(draft, /\(attendance\.date at time zone 'UTC'\)::date = p_date/i);
  assert.doesNotMatch(draft, /attendance\.date::date = p_date/i);
});

test("auth helper lookup columns have supporting indexes", async () => {
  const draft = await readDraft("0001_auth_link_and_helpers.sql");

  assert.match(draft, /admins_auth_user_id_unique[\s\S]*\(auth_user_id\)/i);
  assert.match(draft, /admins_roles_parent_id_idx[\s\S]*\(parent_id\)/i);
});
