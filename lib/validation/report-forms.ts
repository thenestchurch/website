import {
  SERVICE_TYPES,
  type ServiceCreateInput,
  type ServiceReportCreateInput,
} from "../domain/types.ts";

const takeString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const positiveInteger = (value: string) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 2147483647 ? parsed : null;
};

const nonnegativeInteger = (value: string) => {
  const parsed = Number(value || "0");
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 2147483647 ? parsed : null;
};

const optionalHttpUrl = (value: string) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

export const parseServiceReportForm = (
  formData: FormData,
  fixedDepartmentId?: number,
): ServiceReportCreateInput | null => {
  const serviceId = positiveInteger(takeString(formData, "service"));
  const departmentId = fixedDepartmentId
    ?? positiveInteger(takeString(formData, "department"));
  const reportContent = takeString(formData, "reportContent");
  const attachmentUrl = optionalHttpUrl(takeString(formData, "attachmentUrl"));
  const departmentAttendance = nonnegativeInteger(takeString(formData, "departmentAttendance"));
  const volunteersCount = nonnegativeInteger(takeString(formData, "volunteersCount"));

  if (
    serviceId === null
    || departmentId === null
    || !reportContent
    || attachmentUrl === undefined
    || departmentAttendance === null
    || volunteersCount === null
  ) {
    return null;
  }

  return {
    attachmentUrl,
    departmentAttendance,
    departmentId,
    reportContent,
    serviceId,
    title: takeString(formData, "title") || "Department service report",
    volunteersCount,
  };
};

export const parseServiceCreateForm = (formData: FormData): ServiceCreateInput | null => {
  const name = takeString(formData, "name");
  const serviceType = takeString(formData, "serviceType");
  const date = takeString(formData, "date");

  if (
    !name
    || !SERVICE_TYPES.includes(serviceType as (typeof SERVICE_TYPES)[number])
    || !date
    || Number.isNaN(Date.parse(date))
  ) {
    return null;
  }

  return {
    date,
    endTime: takeString(formData, "endTime") || null,
    isActive: takeString(formData, "isActive") === "on",
    name,
    notes: takeString(formData, "notes") || null,
    serviceType: serviceType as ServiceCreateInput["serviceType"],
    startTime: takeString(formData, "startTime") || null,
  };
};
