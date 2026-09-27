import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
const secret = process.env.PUBLIC_OPERATIONS_SECRET?.trim();
if (!url || !key || !secret) {
  throw new Error("SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and PUBLIC_OPERATIONS_SECRET are required.");
}

const today = new Date().toISOString().slice(0, 10);
const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/search_public_attendance_members`, {
  body: JSON.stringify({ p_date: today, p_query: "zzzzzz", p_secret: secret }),
  headers: { apikey: key, "Content-Type": "application/json" },
  method: "POST",
});

if (!response.ok) throw new Error(`Public attendance search RPC failed with HTTP ${response.status}.`);
console.log("Public attendance search credential and bounded RPC verified without returning member data.");
