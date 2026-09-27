import {
  isDepartmentLeadOnly,
  type AuthenticatedActor,
} from "./authorization.ts";

export const getDepartmentHeadPortalRedirect = (
  actor: AuthenticatedActor | null,
) => {
  if (!actor) return "/department-head/login";
  if (!isDepartmentLeadOnly(actor)) {
    return "/department-head/login?error=wrongPortal";
  }
  if (actor.departmentId === null) {
    return "/department-head/login?error=noDepartment";
  }
  return null;
};
