"use server";

import { redirect } from "next/navigation";
import { reportSubmissionErrorCode } from "@/lib/validation/report-submission-error";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import { getPublicReportWriteRepository } from "@/lib/repositories/server/public-operations";
import { parseServiceReportForm } from "@/lib/validation/report-forms";

export async function submitPublicServiceReport(formData: FormData) {
  if (isHoneypotTriggered(formData)) {
    redirect("/reports/submit?saved=invalid");
  }

  const input = parseServiceReportForm(formData);
  if (!input) {
    redirect("/reports/submit?saved=invalid");
  }

  try {
    await (await getPublicReportWriteRepository()).create(input);
  } catch (error) {
    redirect(`/reports/submit?service=${input.serviceId}&saved=${reportSubmissionErrorCode(error)}`);
  }

  redirect("/reports/submit?saved=1");
}
