"use server";

import { redirect } from "next/navigation";
import { getPostLoginPath } from "@/lib/auth/login-flow.ts";
import {
  authenticateServerCredentials,
  logoutServerActor,
} from "@/lib/auth/server-login.ts";
import { isHoneypotTriggered } from "@/lib/security/honeypot";

export const loginAdmin = async (formData: FormData) => {
  if (isHoneypotTriggered(formData)) {
    redirect("/admin/login?error=invalid");
  }

  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect("/admin/login?error=missing");
  }

  let nextPath: string | null = null;
  try {
    const actor = await authenticateServerCredentials({
      email,
      password,
    });
    nextPath = getPostLoginPath("admin", actor);
  } catch {
    nextPath = null;
  }

  if (!nextPath) {
    try {
      await logoutServerActor();
    } catch {
      // Preserve the generic login error even if stale-session cleanup fails.
    }
    redirect("/admin/login?error=invalid");
  }
  redirect(nextPath);
};
