"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportSubmissionErrorCode } from "@/lib/validation/report-submission-error";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerReportWriteRepository } from "@/lib/repositories/server/report-writes";
import { getServerServiceWriteRepository } from "@/lib/repositories/server/service-writes";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import {
  parseServiceCreateForm,
  parseServiceReportForm,
} from "@/lib/validation/report-forms";

export async function submitServiceReport(formData: FormData) {
  if (isHoneypotTriggered(formData)) {
    redirect("/admin/reports/submit?saved=invalid");
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  const input = parseServiceReportForm(formData);

  if (!input) {
    redirect("/admin/reports/submit?saved=invalid");
  }

  try {
    const repository = await getServerReportWriteRepository(actor);
    await repository.create(input);
  } catch (error) {
    redirect(`/admin/reports/submit?service=${input.serviceId}&saved=${reportSubmissionErrorCode(error)}`);
  }

  redirect(`/admin/reports/${input.serviceId}?saved=1`);
}

export async function createService(formData: FormData) {
  if (isHoneypotTriggered(formData)) {
    redirect("/admin/reports/services/new?saved=invalid");
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  const input = parseServiceCreateForm(formData);

  if (!input) {
    redirect("/admin/reports/services/new?saved=invalid");
  }

  let serviceId: number;
  try {
    const repository = await getServerServiceWriteRepository(actor);
    const service = await repository.create(input);
    serviceId = service.id;
  } catch {
    redirect("/admin/reports/services/new?saved=invalid");
  }

  redirect(`/admin/reports/${serviceId}?created=service`);
}

export async function updateService(formData: FormData) {
  const serviceId = Number(formData.get("serviceId"));
  if (!Number.isInteger(serviceId) || serviceId < 1 || isHoneypotTriggered(formData)) {
    redirect("/admin/reports?saved=invalid");
  }
  const actor = await requireServerAdminActor(["admin", "staff"]);
  const input = parseServiceCreateForm(formData);
  if (!input) redirect(`/admin/reports/services/${serviceId}/edit?saved=invalid`);
  try {
    await (await getServerServiceWriteRepository(actor)).update(serviceId, input);
  } catch {
    redirect(`/admin/reports/services/${serviceId}/edit?saved=invalid`);
  }
  redirect(`/admin/reports/${serviceId}?updated=service`);
}

export async function setServiceReportApproval(formData: FormData) {
  const reportId = Number(formData.get("reportId"));
  const approval = formData.get("approval");

  if (
    !Number.isInteger(reportId)
    || reportId < 1
    || (approval !== "approved" && approval !== "pending")
    || isHoneypotTriggered(formData)
  ) {
    redirect("/admin/reports?saved=invalid");
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  const report = await (await getServerReportWriteRepository(actor)).setApproval({
    id: reportId,
    isApproved: approval === "approved",
  });

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${report.serviceId}`);
  redirect(`/admin/reports/${report.serviceId}?updated=${approval}`);
}

export async function deleteServiceReport(formData: FormData) {
  const reportId = Number(formData.get("reportId"));
  const confirmed = formData.get("confirmDelete") === "confirmed";

  if (!Number.isInteger(reportId) || reportId < 1 || !confirmed || isHoneypotTriggered(formData)) {
    redirect("/admin/reports?saved=invalid");
  }

  const actor = await requireServerAdminActor(["admin"]);
  const report = await (await getServerReportWriteRepository(actor)).delete(reportId);

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${report.serviceId}`);
  redirect(`/admin/reports/${report.serviceId}?updated=deleted`);
}
