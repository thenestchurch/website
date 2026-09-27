import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

if (!process.argv.includes("--apply")) {
  throw new Error("Refusing to apply migrations without --apply.");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const migrationDirectory = path.resolve("supabase", "migrations");
const migrationNames = (await readdir(migrationDirectory))
  .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
  .sort();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 10_000,
  max: 1,
});

try {
  for (const name of migrationNames) {
    const sql = await readFile(path.join(migrationDirectory, name), "utf8");
    if (!sql.startsWith("-- VERSIONED MIGRATION: ")) {
      throw new Error(`${name} is missing its reviewed migration marker.`);
    }

    console.log(`Applying ${name}...`);
    await pool.query(sql);
    console.log(`Applied ${name}.`);
  }
  console.log(`Applied ${migrationNames.length} migrations successfully.`);
} finally {
  await pool.end();
}
