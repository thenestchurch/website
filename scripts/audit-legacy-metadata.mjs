import pg from "pg";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30_000,
  max: 1,
  options: "-c default_transaction_read_only=on",
});

try {
  const [adminColumns, metadataTables, foreignKeys] = await Promise.all([
    pool.query(
      "select column_name, data_type from information_schema.columns where table_schema = $1 and table_name = $2 order by ordinal_position",
      ["public", "admins"],
    ),
    pool.query(
      "select table_name from information_schema.tables where table_schema = $1 and table_name like $2 order by table_name",
      ["public", "payload_%"],
    ),
    pool.query(
      "select conrelid::regclass::text as child, confrelid::regclass::text as parent from pg_constraint where contype = $1 and (conrelid::regclass::text like $2 or confrelid::regclass::text like $2 or conrelid::regclass::text = $3 or confrelid::regclass::text = $3) order by 1",
      ["f", "public.payload_%", "public.admins_sessions"],
    ),
  ]);

  console.log(`Legacy metadata tables: ${metadataTables.rows.map((row) => row.table_name).join(", ") || "none"}`);
  console.log(`Legacy-session/metadata foreign keys: ${foreignKeys.rows.map((row) => `${row.child} -> ${row.parent}`).join(", ") || "none"}`);
  console.log(`Admin columns: ${adminColumns.rows.map((row) => `${row.column_name}:${row.data_type}`).join(", ")}`);
} finally {
  await pool.end();
}
