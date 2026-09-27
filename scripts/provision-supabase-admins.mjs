import pg from "pg";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

const shouldApply = process.argv.includes("--apply");
const temporaryPassword = process.env.SUPABASE_MIGRATION_TEMP_PASSWORD?.trim();

if (!process.env.DATABASE_URL || !process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error("DATABASE_URL, SUPABASE_URL, and SUPABASE_SECRET_KEY are required.");
}
if (shouldApply && (!temporaryPassword || temporaryPassword.length < 12)) {
  throw new Error("SUPABASE_MIGRATION_TEMP_PASSWORD must be at least 12 characters when using --apply.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 10_000,
  max: 1,
});
const authUrl = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users`;
const authHeaders = {
  apikey: process.env.SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};

const authRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  });
  if (!response.ok) throw new Error(`Supabase Auth request failed with HTTP ${response.status}.`);
  return response.status === 204 ? null : response.json();
};

const listAllAuthUsers = async () => {
  const users = [];
  for (let page = 1; ; page += 1) {
    const data = await authRequest(`${authUrl}?page=${page}&per_page=1000`);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
};

try {
  const { rows: unlinkedAdmins } = await pool.query(`
    select id, name, email
    from public.admins
    where is_active = true and auth_user_id is null
    order by id
  `);
  const existingUsers = await listAllAuthUsers();
  const usersByEmail = new Map(existingUsers
    .filter((user) => user.email)
    .map((user) => [user.email.trim().toLowerCase(), user]));
  const existingMatches = unlinkedAdmins.filter((admin) => usersByEmail.has(admin.email.trim().toLowerCase()));
  const newAccounts = unlinkedAdmins.length - existingMatches.length;

  console.log(`Active admin profiles awaiting links: ${unlinkedAdmins.length}`);
  console.log(`Existing Auth identities to link: ${existingMatches.length}`);
  console.log(`New Auth identities to create: ${newAccounts}`);

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply after setting SUPABASE_MIGRATION_TEMP_PASSWORD in .env.local.");
  } else {
    let created = 0;
    let linked = 0;
    for (const admin of unlinkedAdmins) {
      const normalizedEmail = admin.email.trim().toLowerCase();
      const existing = usersByEmail.get(normalizedEmail);
      let authUser = existing;
      let createdThisRun = false;

      if (!authUser) {
        const data = await authRequest(authUrl, {
          body: JSON.stringify({
          email: normalizedEmail,
          email_confirm: true,
          password: temporaryPassword,
          user_metadata: { name: admin.name },
          }),
          method: "POST",
        });
        if (!data) throw new Error(`Could not create Auth identity for admin profile ${admin.id}.`);
        authUser = data;
        createdThisRun = true;
      }

      try {
        const result = await pool.query(
          "update public.admins set auth_user_id = $1, updated_at = now() where id = $2 and auth_user_id is null",
          [authUser.id, admin.id],
        );
        if (result.rowCount !== 1) throw new Error(`Admin profile ${admin.id} was changed concurrently.`);
        created += Number(createdThisRun);
        linked += 1;
      } catch (error) {
        if (createdThisRun) await authRequest(`${authUrl}/${authUser.id}`, { method: "DELETE" }).catch(() => undefined);
        throw error;
      }
    }
    console.log(`Provisioned ${created} Auth identities and linked ${linked} active admin profiles.`);
  }
} finally {
  await pool.end();
}
