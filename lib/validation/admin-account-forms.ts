import { ADMIN_ROLES, type AdminAccountSaveInput, type AdminRole } from "../domain/types.ts";

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const parseAdminAccountForm = (data: FormData): AdminAccountSaveInput | null => {
  const idValue = Number(text(data, "id"));
  const name = text(data, "name");
  const email = text(data, "email").toLowerCase();
  const password = text(data, "password");
  const departmentValue = Number(text(data, "departmentId"));
  const roles = [...new Set(data.getAll("roles")
    .filter((role): role is string => typeof role === "string")
    .filter((role): role is AdminRole => ADMIN_ROLES.includes(role as AdminRole)))];
  const id = Number.isInteger(idValue) && idValue > 0 ? idValue : undefined;
  const departmentId = Number.isInteger(departmentValue) && departmentValue > 0 ? departmentValue : null;

  if (!name || !email.includes("@") || roles.length === 0) return null;
  if (id === undefined && password.length < 12) return null;
  if (password && password.length < 12) return null;
  if (roles.includes("department-lead") && departmentId === null) return null;

  return {
    departmentId,
    email,
    ...(id === undefined ? {} : { id }),
    isActive: data.get("isActive") === "on",
    isSuperAdmin: data.get("isSuperAdmin") === "on",
    name,
    ...(password ? { password } : {}),
    roles,
  };
};
