import pg from "pg";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

const temporaryPassword = process.env.SUPABASE_MIGRATION_TEMP_PASSWORD?.trim();
if (!process.env.DATABASE_URL || !process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("DATABASE_URL, SUPABASE_URL, and SUPABASE_PUBLISHABLE_KEY are required.");
}
if (!temporaryPassword) {
  throw new Error("SUPABASE_MIGRATION_TEMP_PASSWORD is required for this login verification.");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const tokenUrl = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=password`;
const restUrl = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;

const roleQueries = {
  admin: `
    select a.email, a.auth_user_id, a.department_id from public.admins a
    where a.is_active and a.auth_user_id is not null and (
      coalesce(a.is_super_admin, false) or exists (
        select 1 from public.admins_roles r where r.parent_id = a.id and r.value = 'admin'
      )
    ) order by a.id limit 1`,
  staff: `
    select a.email, a.auth_user_id, a.department_id from public.admins a
    where a.is_active and a.auth_user_id is not null and exists (
      select 1 from public.admins_roles r where r.parent_id = a.id and r.value = 'staff'
    ) order by a.id limit 1`,
  department_lead: `
    select a.email, a.auth_user_id, a.department_id from public.admins a
    where a.is_active and a.auth_user_id is not null and a.department_id is not null
      and exists (select 1 from public.admins_roles r where r.parent_id = a.id and r.value = 'department-lead')
      and not exists (select 1 from public.admins_roles r where r.parent_id = a.id and r.value in ('admin', 'staff'))
      and not coalesce(a.is_super_admin, false)
    order by a.id limit 1`,
  absentee_viewer: `
    select a.email, a.auth_user_id, a.department_id from public.admins a
    where a.is_active and a.auth_user_id is not null
      and exists (select 1 from public.admins_roles r where r.parent_id = a.id and r.value = 'absentee-viewer')
    order by a.id limit 1`,
};

try {
  let verifiedCount = 0;
  for (const [role, query] of Object.entries(roleQueries)) {
    const { rows } = await pool.query(query);
    if (rows.length === 0) {
      console.log(`${role}: no eligible active account exists; skipped`);
      continue;
    }
    if (rows.length !== 1) throw new Error(`Multiple ${role} verification accounts were returned unexpectedly.`);
    const account = rows[0];
    const response = await fetch(tokenUrl, {
      body: JSON.stringify({ email: account.email, password: temporaryPassword }),
      headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) throw new Error(`Supabase password login failed for the ${role} verification account.`);
    const session = await response.json();
    if (!session.user?.id || session.user.id !== account.auth_user_id) {
      throw new Error(`Supabase identity did not match the ${role} admin profile.`);
    }
    console.log(`${role}: password login and profile link verified`);
    if (role === "admin") {
      for (const table of ["departments", "services", "service_reports", "members", "attendance_records", "media", "birthday_notification_settings", "birthday_notification_logs"]) {
        const protectedRead = await fetch(`${restUrl}/${table}?select=id&limit=1`, {
          headers: {
            apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!protectedRead.ok) throw new Error(`Authenticated ${table} read failed for the admin verification account.`);
      }
      console.log("admin: protected Departments, Services, Reports, Members, Attendance, Media, and Birthday reads verified");
    }
    if (role === "department_lead") {
      const protectedRead = await fetch(`${restUrl}/service_reports?select=department_id&limit=100`, {
        headers: {
          apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!protectedRead.ok) throw new Error("Authenticated report read failed for the department-lead verification account.");
      const reports = await protectedRead.json();
      if (!reports.every((report) => report.department_id === account.department_id)) {
        throw new Error("Department-lead report scope returned a different department.");
      }
      console.log("department_lead: report scope verified");
    }
    verifiedCount += 1;
  }
  if (verifiedCount === 0) throw new Error("No active linked accounts were available for Supabase verification.");
  console.log("Supabase password login verification completed without database writes.");
} finally {
  await pool.end();
}
