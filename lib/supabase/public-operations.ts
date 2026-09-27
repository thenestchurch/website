import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";
import { readSupabasePublicEnvironment } from "./environment.ts";

export const createSupabasePublicOperationsClient = () => {
  const environment = readSupabasePublicEnvironment(process.env);
  return createClient<Database>(environment.url, environment.publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
};
