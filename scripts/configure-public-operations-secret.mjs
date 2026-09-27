import pg from "pg";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

if (!process.argv.includes("--apply")) {
  throw new Error("Refusing to configure the public-operation secret without --apply.");
}
const secret = process.env.PUBLIC_OPERATIONS_SECRET?.trim();
if (!process.env.DATABASE_URL || !secret || secret.length < 32) {
  throw new Error("DATABASE_URL and a PUBLIC_OPERATIONS_SECRET of at least 32 characters are required.");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

try {
  await pool.query(`
    insert into private.public_operation_secrets (name, secret_hash, is_active, updated_at)
    values ('public-operations', extensions.crypt($1, extensions.gen_salt('bf')), true, now())
    on conflict (name) do update set
      secret_hash = excluded.secret_hash,
      is_active = true,
      updated_at = now()
  `, [secret]);
  console.log("Configured the public-operation secret hash without exposing the secret.");
} finally {
  await pool.end();
}
