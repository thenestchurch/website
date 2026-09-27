"use server";

import { redirect } from "next/navigation";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerAdminAccountRepository } from "@/lib/repositories/server/admin-accounts";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import { parseAdminAccountForm } from "@/lib/validation/admin-account-forms";

export async function saveAdminAccount(formData: FormData) {
  const input = isHoneypotTriggered(formData) ? null : parseAdminAccountForm(formData);
  const fallbackId = Number(formData.get("id"));
  const fallback = Number.isInteger(fallbackId) && fallbackId > 0
    ? `/admin/accounts/${fallbackId}/edit?saved=invalid`
    : "/admin/accounts/new?saved=invalid";
  if (!input) redirect(fallback);
  const actor = await requireServerAdminActor(["admin"]);
  let accountId: number;
  try {
    const account = await (await getServerAdminAccountRepository(actor)).save(input);
    accountId = account.id;
  } catch {
    redirect(fallback);
  }
  redirect(`/admin/accounts?updated=${accountId}`);
}
