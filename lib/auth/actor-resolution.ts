import { ADMIN_ROLES, type AdminRole, type EntityId } from "../domain/types.ts";
import type { AuthenticatedActor } from "./authorization.ts";

export type AuthIdentity = {
  email: string | null;
  id: string;
};

export type AdminProfile = {
  adminId: EntityId;
  authUserId: string;
  departmentId: EntityId | null;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  name: string;
  roles: readonly string[];
};

export interface ActorDataSource {
  findAdminProfile(authUserId: string): Promise<AdminProfile | null>;
  getCurrentIdentity(): Promise<AuthIdentity | null>;
}

const ADMIN_ROLE_SET = new Set<string>(ADMIN_ROLES);

export const normalizeAdminRoles = (roles: readonly string[]): AdminRole[] => {
  const normalizedRoles = new Set<AdminRole>();

  for (const role of roles) {
    if (ADMIN_ROLE_SET.has(role)) {
      normalizedRoles.add(role as AdminRole);
    }
  }

  return [...normalizedRoles];
};

export const resolveAuthenticatedActor = async (
  source: ActorDataSource,
): Promise<AuthenticatedActor | null> => {
  const identity = await source.getCurrentIdentity();

  if (!identity) {
    return null;
  }

  const profile = await source.findAdminProfile(identity.id);

  if (!profile || !profile.isActive || profile.authUserId !== identity.id) {
    return null;
  }

  return {
    adminId: profile.adminId,
    authUserId: identity.id,
    departmentId: profile.departmentId,
    email: identity.email ?? profile.email,
    isActive: true,
    isSuperAdmin: profile.isSuperAdmin,
    name: profile.name,
    roles: normalizeAdminRoles(profile.roles),
  };
};
