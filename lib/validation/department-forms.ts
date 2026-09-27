import type { DepartmentSaveInput } from "../domain/types.ts";

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const departmentSlug = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

export const parseDepartmentForm = (data: FormData): DepartmentSaveInput | null => {
  const name = text(data, "name");
  const slug = departmentSlug(text(data, "slug") || name);
  const idValue = Number(text(data, "id"));
  if (!name || !slug || name.length > 200) return null;
  return {
    description: text(data, "description") || null,
    ...(Number.isInteger(idValue) && idValue > 0 ? { id: idValue } : {}),
    isActive: data.get("isActive") === "on",
    name,
    reportingChannel: text(data, "reportingChannel") || null,
    slug,
  };
};
