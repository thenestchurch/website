"use server";

import { redirect } from "next/navigation";
import { logoutServerActor } from "@/lib/auth/server-login.ts";

export async function logoutAdmin() {
  await logoutServerActor();
  redirect("/admin/login");
}
