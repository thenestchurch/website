"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerBirthdaySettingsRepository } from "@/lib/repositories/server/birthday-settings";
import { runBirthdayEmails } from "@/scripts/birthday-email-runner.mjs";

const takeString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export async function saveBirthdayEmailSettings(formData: FormData) {
  const sendTime = takeString(formData, "sendTime") || "08:00";

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(sendTime)) {
    redirect("/admin/members/birthdays/settings?saved=invalid");
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  await (await getServerBirthdaySettingsRepository(actor)).update({
      adminNotificationEmails: takeString(formData, "adminNotificationEmails"),
      adminSummaryBody: takeString(formData, "adminSummaryBody"),
      adminSummarySubject: takeString(formData, "adminSummarySubject"),
      enabled: formData.get("enabled") === "on",
      memberEmailBody: takeString(formData, "memberEmailBody"),
      memberEmailSubject: takeString(formData, "memberEmailSubject"),
      sendTime,
  });

  redirect("/admin/members/birthdays/settings?saved=1");
}

const resultRedirect = (type: "daily" | "weekly", result: Awaited<ReturnType<typeof runBirthdayEmails>>) => {
  const params = new URLSearchParams({
    failed: String(result.failed + (result.weeklySummaryFailed ?? 0)),
    recipients: String(result.weeklySummaryRecipients ?? 0),
    run: result.status,
    sent: String(result.sent),
    type,
    weekly: String(result.weeklyBirthdays ?? 0),
  });

  redirect(`/admin/members/birthdays/settings?${params.toString()}`);
};

export async function sendDailyBirthdayEmailsNow() {
  await requireServerAdminActor(["admin", "staff"]);
  const result = await runBirthdayEmails();
  resultRedirect("daily", result);
}

export async function sendWeeklyBirthdayDigestNow() {
  await requireServerAdminActor(["admin", "staff"]);
  const result = await runBirthdayEmails({
    idempotencySuffix: randomUUID(),
    weeklySummaryOnly: true,
  });
  resultRedirect("weekly", result);
}
