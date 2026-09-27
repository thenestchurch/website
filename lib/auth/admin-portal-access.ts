import type { AdminRole } from "../domain/types.ts";
import {
  hasAnyRole,
  isDepartmentLeadOnly,
  type AuthenticatedActor,
} from "./authorization.ts";

export const getAdminPortalRedirect = (
  actor: AuthenticatedActor | null,
  allowedRoles: readonly AdminRole[] = [],
) => {
  if (!actor) return "/admin/login";
  if (isDepartmentLeadOnly(actor)) return "/department-head/reports/submit";
  if (allowedRoles.length > 0 && !hasAnyRole(actor, allowedRoles)) {
    return "/admin?error=forbidden";
  }
  return null;
};
