"use server";

import { redirect } from "next/navigation";
import { getPostLoginPath } from "@/lib/auth/login-flow.ts";
import {
  authenticateServerCredentials,
  logoutServerActor,
} from "@/lib/auth/server-login.ts";
import { isHoneypotTriggered } from "@/lib/security/honeypot";

export const loginDepartmentHead = async (formData: FormData) => {
  if (isHoneypotTriggered(formData)) {
    redirect("/department-head/login?error=invalid");
  }

  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect("/department-head/login?error=missing");
  }

  let nextPath: string | null = null;
  try {
    const actor = await authenticateServerCredentials({
      email,
      password,
    });
    nextPath = getPostLoginPath("department-head", actor);
  } catch {
    nextPath = null;
  }

  if (!nextPath) {
    try {
      await logoutServerActor();
    } catch {
      // Preserve the generic login error even if stale-session cleanup fails.
    }
    redirect("/department-head/login?error=invalid");
  }
  redirect(nextPath);
};
