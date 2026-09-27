"use server";

import { redirect } from "next/navigation";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerReportContentWriteRepository } from "@/lib/repositories/server/report-content-writes";
import { isHoneypotTriggered } from "@/lib/security/honeypot";

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};
const positiveId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function saveReportInstruction(formData: FormData) {
  if (isHoneypotTriggered(formData)) redirect("/admin/report-content?saved=invalid");
  const id = positiveId(text(formData, "id"));
  const departmentId = positiveId(text(formData, "departmentId"));
  const title = text(formData, "title");
  const content = text(formData, "content");
  if (!departmentId || !title || !content) redirect("/admin/report-content?saved=invalid");

  const actor = await requireServerAdminActor(["admin", "staff"]);
  await (await getServerReportContentWriteRepository(actor)).saveInstruction({
    content,
    departmentId,
    ...(id ? { id } : {}),
    isActive: formData.get("isActive") === "on",
    title,
  });
  redirect("/admin/report-content?saved=instruction");
}

export async function saveReportTemplate(formData: FormData) {
  if (isHoneypotTriggered(formData)) redirect("/admin/report-content?saved=invalid");
  const id = positiveId(text(formData, "id"));
  const title = text(formData, "title");
  const content = text(formData, "content");
  const applicableDepartmentIds = [...new Set(formData.getAll("departmentIds")
    .map((value) => positiveId(typeof value === "string" ? value : ""))
    .filter((value): value is number => value !== null))];
  if (!title || !content) redirect("/admin/report-content?saved=invalid");

  const actor = await requireServerAdminActor(["admin", "staff"]);
  await (await getServerReportContentWriteRepository(actor)).saveTemplate({
    applicableDepartmentIds,
    content,
    ...(id ? { id } : {}),
    isActive: formData.get("isActive") === "on",
    title,
  });
  redirect("/admin/report-content?saved=template");
}
