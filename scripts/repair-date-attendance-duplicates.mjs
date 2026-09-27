import pg from "pg";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const apply = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

const duplicateGroups = `
  select member_id, (date at time zone 'UTC')::date as attendance_date,
    count(*)::integer as records
  from public.attendance_records
  where service_id is null
  group by member_id, (date at time zone 'UTC')::date
  having count(*) > 1
  order by member_id, attendance_date
`;

const rankedDuplicates = `
  with ranked as (
    select id, member_id, date,
      row_number() over (
        partition by member_id, (date at time zone 'UTC')::date
        order by updated_at desc nulls last, created_at desc nulls last, id desc
      ) as row_number
    from public.attendance_records
    where service_id is null
  )
`;

try {
  const before = await pool.query(duplicateGroups);
  const redundant = await pool.query(`${rankedDuplicates} select id from ranked where row_number > 1 order by id`);
  console.log(`Duplicate date-only attendance groups: ${before.rowCount}`);
  console.log(`Redundant attendance rows: ${redundant.rowCount}`);

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to keep the newest row in each group and delete only redundant rows.");
    process.exitCode = before.rowCount > 0 ? 2 : 0;
  } else if (redundant.rowCount > 0) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(208479, 2)");
      const deleted = await client.query(`${rankedDuplicates}
        delete from public.attendance_records record
        using ranked
        where record.id = ranked.id and ranked.row_number > 1
        returning record.id`);
      const remaining = await client.query(duplicateGroups);
      if (remaining.rowCount !== 0) {
        throw new Error("Duplicate attendance groups remain after cleanup; rolling back.");
      }
      await client.query("commit");
      console.log(`Deleted redundant attendance rows: ${deleted.rowCount}`);
      console.log("Date-only attendance duplicates remaining: 0");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } else {
    console.log("No cleanup was required.");
  }
} finally {
  await pool.end();
}
