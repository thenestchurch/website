import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = (pathname === "/admin" || pathname.startsWith("/admin/")) && pathname !== "/admin/login";

  requestHeaders.set("x-app-section", isAdminRoute ? "admin" : "site");
  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
  if (!hasSupabaseSessionCookie) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const { refreshSupabaseAuth } = await import("@/lib/supabase/proxy.ts");
  return refreshSupabaseAuth(request, requestHeaders);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
