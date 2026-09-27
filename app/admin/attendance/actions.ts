"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import type { AttendanceRegisterEntry } from "@/lib/domain/types";
import { getServerAttendanceWriteRepository } from "@/lib/repositories/server/attendance-writes";
import { isHoneypotTriggered } from "@/lib/security/honeypot";

const buildRedirectURL = ({
  date,
  department,
  page,
  query,
  saved,
  service,
}: {
  date?: string;
  department?: string;
  page?: string;
  query?: string;
  saved: string;
  service?: string;
}) => {
  const params = new URLSearchParams();

  if (service) params.set("service", service);
  if (date) params.set("date", date);
  if (department) params.set("department", department);
  if (query) params.set("query", query);
  if (page) params.set("page", page);
  params.set("saved", saved);

  return `/admin/attendance?${params.toString()}`;
};

const takeString = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value : "";

const positiveInteger = (value: FormDataEntryValue | null) => {
  const parsed = Number(takeString(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const registerContext = (formData: FormData) => {
  const date = takeString(formData.get("date")).trim();
  const serviceValue = takeString(formData.get("service")).trim();
  const serviceId = serviceValue ? positiveInteger(serviceValue) : null;

  return {
    date,
    department: takeString(formData.get("department")),
    page: takeString(formData.get("page")),
    query: takeString(formData.get("query")),
    serviceId,
    serviceValue,
  };
};

const invalidRegister = ({
  date,
  department,
  page,
  query,
  serviceValue,
}: ReturnType<typeof registerContext>) =>
  buildRedirectURL({
    date,
    department,
    page,
    query,
    saved: "invalid",
    service: serviceValue || undefined,
  });

const isValidDate = (value: string) =>
  value.length > 0 && !Number.isNaN(Date.parse(value));

export const saveAttendanceRecords = async (formData: FormData) => {
  if (isHoneypotTriggered(formData)) {
    redirect(buildRedirectURL({ saved: "invalid" }));
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  const context = registerContext(formData);
  const bulkStatusValue = formData.get("bulkStatus");
  const bulkStatus =
    bulkStatusValue === "present" || bulkStatusValue === "absent"
      ? bulkStatusValue
      : undefined;
  const memberIds = [
    ...new Set(
      formData
        .getAll("memberIds")
        .map(positiveInteger)
        .filter((value): value is number => value !== null),
    ),
  ];

  if (
    !isValidDate(context.date)
    || (context.serviceValue.length > 0 && context.serviceId === null)
    || memberIds.length === 0
    || memberIds.length > 100
  ) {
    redirect(
      buildRedirectURL({
        date: context.date,
        department: context.department,
        page: context.page,
        query: context.query,
        saved: context.date ? "invalid" : "missing-date",
        service: context.serviceValue || undefined,
      }),
    );
  }

  const entries: AttendanceRegisterEntry[] = memberIds.map((memberId) => {
    const notes = takeString(formData.get(`notes_${memberId}`)).trim();
    return {
      memberId,
      notes: notes ? notes.slice(0, 5000) : null,
      present: bulkStatus
        ? bulkStatus === "present"
        : formData.get(`present_${memberId}`) === "on",
    };
  });

  try {
    const repository = await getServerAttendanceWriteRepository(actor);
    await repository.saveRegister({
      date: context.date,
      entries,
      serviceId: context.serviceId,
    });
  } catch {
    redirect(invalidRegister(context));
  }

  revalidatePath("/admin/attendance");
  redirect(
    buildRedirectURL({
      date: context.date,
      department: context.department,
      page: context.page,
      query: context.query,
      saved: bulkStatus === "present"
        ? "bulk-present"
        : bulkStatus === "absent"
          ? "bulk-absent"
          : "1",
      service: context.serviceValue || undefined,
    }),
  );
};

export const quickMarkAttendance = async (formData: FormData) => {
  if (isHoneypotTriggered(formData)) {
    redirect(buildRedirectURL({ saved: "invalid" }));
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  const context = registerContext(formData);
  const memberId = positiveInteger(formData.get("member"));

  if (
    memberId === null
    || !isValidDate(context.date)
    || (context.serviceValue.length > 0 && context.serviceId === null)
  ) {
    redirect(invalidRegister(context));
  }

  try {
    const repository = await getServerAttendanceWriteRepository(actor);
    await repository.saveRegister({
      date: context.date,
      entries: [{ memberId, notes: null, present: true }],
      serviceId: context.serviceId,
    });
  } catch {
    redirect(invalidRegister(context));
  }

  revalidatePath("/admin/attendance");
  redirect(
    buildRedirectURL({
      date: context.date,
      department: context.department,
      page: context.page,
      query: context.query,
      saved: "quick",
      service: context.serviceValue || undefined,
    }),
  );
};
