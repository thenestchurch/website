"use server";

import { redirect } from "next/navigation";
import { reportSubmissionErrorCode } from "@/lib/validation/report-submission-error";
import { requireServerDepartmentLeadActor } from "@/lib/auth/server-department-lead-context";
import { getServerReportWriteRepository } from "@/lib/repositories/server/report-writes";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import { parseServiceReportForm } from "@/lib/validation/report-forms";

export async function submitDepartmentHeadReport(formData: FormData) {
  if (isHoneypotTriggered(formData)) {
    redirect("/department-head/reports/submit?saved=invalid");
  }

  const actor = await requireServerDepartmentLeadActor();
  const input = parseServiceReportForm(formData, actor.departmentId);

  if (!input) {
    redirect("/department-head/reports/submit?saved=invalid");
  }

  try {
    const repository = await getServerReportWriteRepository(actor);
    await repository.create(input);
  } catch (error) {
    redirect(
      `/department-head/reports/submit?service=${input.serviceId}&saved=${reportSubmissionErrorCode(error)}`,
    );
  }

  redirect(`/department-head/reports/submit?service=${input.serviceId}&saved=1`);
}
