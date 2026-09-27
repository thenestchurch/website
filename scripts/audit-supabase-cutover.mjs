import pg from "pg";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 10_000,
  max: 1,
  options: "-c default_transaction_read_only=on",
});

const scalar = async (sql) => (await pool.query(sql)).rows[0]?.value ?? null;
const count = async (name, sql) => ({ name, value: Number(await scalar(sql) ?? 0) });

try {
  const [{ rows: databaseRows }, { rows: tables }] = await Promise.all([
    pool.query("select current_database() as name, version() as version"),
    pool.query("select table_name from information_schema.tables where table_schema = 'public' order by table_name"),
  ]);
  const database = databaseRows[0];
  const tableNames = new Set(tables.map((row) => row.table_name));
  console.log(`Read-only cutover audit: ${database.name}`);
  console.log(`PostgreSQL: ${database.version.split(",")[0]}`);
  console.log(`Public tables (${tableNames.size}): ${[...tableNames].join(", ")}`);

  const required = [
    "admins", "admins_roles", "attendance_records", "birthday_notification_logs",
    "birthday_notification_settings", "departments", "media", "members",
    "report_instructions", "report_templates", "report_templates_rels", "service_reports", "services",
  ];
  const missing = required.filter((name) => !tableNames.has(name));
  console.log(`Required business tables missing: ${missing.join(", ") || "none"}`);
  if (missing.length) throw new Error("Required business tables are missing; cutover audit failed.");

  const { rows: authColumn } = await pool.query(
    "select data_type, udt_name from information_schema.columns where table_schema = 'public' and table_name = 'admins' and column_name = 'auth_user_id'",
  );
  const authType = authColumn[0] ? `${authColumn[0].data_type}/${authColumn[0].udt_name}` : "missing";
  console.log(`admins.auth_user_id type: ${authType}`);

  const checks = await Promise.all([
    count("admin_rows", "select count(*) as value from public.admins"),
    count("admin_duplicate_normalized_emails", "select count(*) as value from (select lower(btrim(email)) from public.admins group by 1 having count(*) > 1) duplicates"),
    count("department_duplicate_names", "select count(*) as value from (select lower(btrim(name)) from public.departments group by 1 having count(*) > 1) duplicates"),
    count("department_duplicate_slugs", "select count(*) as value from (select lower(btrim(slug)) from public.departments where slug is not null and btrim(slug) <> '' group by 1 having count(*) > 1) duplicates"),
    count("member_duplicate_normalized_emails", "select count(*) as value from (select lower(btrim(email)) from public.members where email is not null and btrim(email) <> '' group by 1 having count(*) > 1) duplicates"),
    count("report_duplicate_service_departments", "select count(*) as value from (select service_id, department_id from public.service_reports group by 1, 2 having count(*) > 1) duplicates"),
    count("instruction_duplicate_departments", "select count(*) as value from (select department_id from public.report_instructions group by 1 having count(*) > 1) duplicates"),
    count("birthday_settings_rows", "select count(*) as value from public.birthday_notification_settings"),
    count("attendance_duplicate_service_members", "select count(*) as value from (select member_id, service_id from public.attendance_records where service_id is not null group by 1, 2 having count(*) > 1) duplicates"),
    count("attendance_duplicate_utc_dates", "select count(*) as value from (select member_id, (date at time zone 'UTC')::date from public.attendance_records where service_id is null group by 1, 2 having count(*) > 1) duplicates"),
  ]);
  if (authColumn[0]) {
    checks.push(await count(
      "admin_broken_auth_links",
      "select count(*) as value from public.admins a left join auth.users u on u.id = a.auth_user_id where a.auth_user_id is not null and u.id is null",
    ));
    checks.push(await count(
      "active_admins_without_auth_links",
      "select count(*) as value from public.admins where is_active and auth_user_id is null",
    ));
    checks.push(await count(
      "admin_invalid_auth_user_ids",
      "select count(*) as value from public.admins where auth_user_id is not null and auth_user_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'",
    ));
  } else {
    checks.push({ name: "admin_invalid_auth_user_ids", value: "not applicable until migration 0001" });
  }
  for (const check of checks) console.log(`${check.name}: ${check.value}`);

  const { rows: sequences } = await pool.query(`
    select table_name, pg_get_serial_sequence(format('public.%I', table_name), 'id') as sequence_name
    from (values ('admins'), ('attendance_records'), ('departments'), ('media'), ('members'), ('service_reports'), ('services')) tables(table_name)
    order by table_name
  `);
  for (const sequence of sequences) {
    console.log(`${sequence.table_name} ID sequence: ${sequence.sequence_name ?? "missing"}`);
  }

  const { rows: security } = await pool.query(`
    select relname as table_name, relrowsecurity as rls_enabled
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = any($1::text[])
    order by relname
  `, [required]);
  for (const item of security) console.log(`${item.table_name} RLS enabled: ${item.rls_enabled}`);

  const pgcrypto = await scalar("select count(*) as value from pg_extension where extname = 'pgcrypto'");
  console.log(`pgcrypto installed: ${Number(pgcrypto) > 0}`);
  const failures = checks.filter(({ name, value }) =>
    /duplicate|without_auth_links|invalid_auth_user_ids|broken_auth_links/.test(name)
      && value !== 0,
  ).map(({ name }) => name);
  if (authType !== "uuid/uuid") failures.push("admins.auth_user_id must be uuid");
  if (checks.find(({ name }) => name === "birthday_settings_rows")?.value !== 1) {
    failures.push("birthday settings must contain exactly one row");
  }
  for (const item of security) if (!item.rls_enabled) failures.push(`${item.table_name} RLS disabled`);
  for (const item of sequences) if (!item.sequence_name) failures.push(`${item.table_name} sequence missing`);
  if (!Number(pgcrypto)) failures.push("pgcrypto missing");
  if (failures.length) throw new Error(`Cutover audit failed: ${failures.join(", ")}`);
  console.log("Audit completed without database writes.");
} finally {
  await pool.end();
}
