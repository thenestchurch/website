import { hasAnyRole, isDepartmentLeadOnly, type AuthenticatedActor } from "./authorization.ts";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginPortal = "admin" | "department-head";

export const getPostLoginPath = (
  portal: LoginPortal,
  actor: AuthenticatedActor | null,
): string | null => {
  if (!actor) return null;

  if (portal === "department-head") {
    return isDepartmentLeadOnly(actor) && actor.departmentId !== null
      ? "/department-head/reports/submit"
      : null;
  }

  if (isDepartmentLeadOnly(actor)) return "/department-head/reports/submit";
  return hasAnyRole(actor, ["admin", "staff", "absentee-viewer"]) ? "/admin" : null;
};
