import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types.ts";
import { readSupabasePublicEnvironment } from "./environment.ts";

export const refreshSupabaseAuth = async (
  request: NextRequest,
  forwardedHeaders: Headers,
) => {
  const environment = readSupabasePublicEnvironment(process.env);
  let response = NextResponse.next({
    request: { headers: forwardedHeaders },
  });
  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));

  // A first-time visitor has no session to refresh. Avoid an unnecessary Auth
  // round trip on public pages and login forms.
  if (!hasSupabaseSessionCookie) return response;

  const client = createServerClient<Database>(
    environment.url,
    environment.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          const refreshedHeaders = new Headers(forwardedHeaders);
          const cookieHeader = request.headers.get("cookie");
          if (cookieHeader) refreshedHeaders.set("cookie", cookieHeader);
          response = NextResponse.next({
            request: { headers: refreshedHeaders },
          });

          for (const { name, options, value } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [name, value] of Object.entries(cacheHeaders)) {
            response.headers.set(name, value);
          }
        },
      },
    },
  );

  // getUser verifies the JWT with Supabase Auth and refreshes expired cookies.
  await client.auth.getUser();
  return response;
};
