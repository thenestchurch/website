"use server";

import { redirect } from "next/navigation";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerDepartmentWriteRepository } from "@/lib/repositories/server/department-writes";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import { parseDepartmentForm } from "@/lib/validation/department-forms";

export async function saveDepartment(formData: FormData) {
  const fallback = "/admin/departments/new?saved=invalid";
  if (isHoneypotTriggered(formData)) redirect(fallback);
  const input = parseDepartmentForm(formData);
  if (!input) redirect(fallback);
  const actor = await requireServerAdminActor(["admin", "staff"]);
  let departmentId: number;
  try {
    const department = await (await getServerDepartmentWriteRepository(actor)).save(input);
    departmentId = department.id;
  } catch {
    redirect(input.id ? `/admin/departments/${input.id}/edit?saved=invalid` : fallback);
  }
  redirect(`/admin/departments/${departmentId}?saved=1`);
}
