import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";
import { readSupabasePrivilegedEnvironment } from "./environment.ts";

export const createSupabasePrivilegedClient = () => {
  const environment = readSupabasePrivilegedEnvironment(process.env);
  return createClient<Database>(environment.url, environment.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
};
