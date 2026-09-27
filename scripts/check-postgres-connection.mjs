import pg from "pg";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 10000,
  max: 1,
});

try {
  const result = await pool.query("select now() as now");
  console.log(`Postgres reachable: ${result.rows[0].now.toISOString()}`);

  const tables = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name in ('members', 'birthday_notification_logs', 'birthday_notification_settings') order by table_name",
  );
  console.log(`Known birthday tables: ${tables.rows.map((row) => row.table_name).join(", ") || "none"}`);

  const columns = await pool.query(
    "select table_name, column_name from information_schema.columns where table_schema = 'public' and table_name in ('members', 'birthday_notification_logs', 'birthday_notification_settings') order by table_name, ordinal_position",
  );
  for (const tableName of ["members", "birthday_notification_logs", "birthday_notification_settings"]) {
    const tableColumns = columns.rows
      .filter((row) => row.table_name === tableName)
      .map((row) => row.column_name)
      .join(", ");
    console.log(`${tableName} columns: ${tableColumns || "missing"}`);
  }

  const birthdayTables = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name like '%birthday%' order by table_name",
  );
  console.log(`All birthday tables: ${birthdayTables.rows.map((row) => row.table_name).join(", ") || "none"}`);
} finally {
  await pool.end();
}
