import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types.ts";
import { readSupabasePublicEnvironment } from "./environment.ts";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  const environment = readSupabasePublicEnvironment(process.env);

  return createServerClient<Database>(environment.url, environment.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, options, value } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. The auth proxy will own
          // refresh-cookie persistence.
        }
      },
    },
  });
};
