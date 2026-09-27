import type { AdminRole, EntityId } from "../domain/types.ts";

export type AuthenticatedActor = {
  adminId: EntityId;
  authUserId: string | null;
  departmentId: EntityId | null;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  name: string;
  roles: readonly AdminRole[];
};

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const hasAnyRole = (
  actor: AuthenticatedActor | null | undefined,
  allowedRoles: readonly AdminRole[],
) => {
  if (!actor?.isActive) {
    return false;
  }

  if (actor.isSuperAdmin) {
    return true;
  }

  return allowedRoles.some((role) => actor.roles.includes(role));
};

export const isDepartmentLeadOnly = (actor: AuthenticatedActor | null | undefined) => {
  if (!actor?.isActive || actor.isSuperAdmin) {
    return false;
  }

  return (
    actor.roles.includes("department-lead") &&
    !actor.roles.includes("admin") &&
    !actor.roles.includes("staff")
  );
};

export const isAbsenteeViewerOnly = (actor: AuthenticatedActor | null | undefined) => {
  if (!actor?.isActive || actor.isSuperAdmin) {
    return false;
  }

  return (
    actor.roles.includes("absentee-viewer") &&
    !actor.roles.includes("admin") &&
    !actor.roles.includes("staff")
  );
};

export const requireAnyRole = (
  actor: AuthenticatedActor | null | undefined,
  allowedRoles: readonly AdminRole[],
): AuthenticatedActor => {
  if (!actor || !hasAnyRole(actor, allowedRoles)) {
    throw new AuthorizationError();
  }

  return actor;
};

export const requireDepartmentLead = (actor: AuthenticatedActor | null | undefined) => {
  if (!actor || !isDepartmentLeadOnly(actor) || !actor.departmentId) {
    throw new AuthorizationError("A department-head account with an assigned department is required.");
  }

  return actor as AuthenticatedActor & { departmentId: EntityId };
};

export const requireDepartmentAccess = (
  actor: AuthenticatedActor | null | undefined,
  requestedDepartmentId: EntityId,
): AuthenticatedActor => {
  if (actor && hasAnyRole(actor, ["admin", "staff"])) {
    return actor;
  }

  const departmentLead = requireDepartmentLead(actor);

  if (departmentLead.departmentId !== requestedDepartmentId) {
    throw new AuthorizationError("Department heads can access only their assigned department.");
  }

  return departmentLead;
};
