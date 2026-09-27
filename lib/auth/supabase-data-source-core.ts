import type { SupabaseClient } from "@supabase/supabase-js";
import { RepositoryError } from "../repositories/errors.ts";
import type { Database } from "../supabase/database.types.ts";
import type { ActorDataSource, AdminProfile } from "./actor-resolution.ts";

type AdminProfileQueryRow = {
  admins_roles: { value: string | null }[];
  auth_user_id: string | null;
  department_id: number | null;
  email: string;
  id: number;
  is_active: boolean;
  is_super_admin: boolean | null;
  name: string;
};

const isAdminProfileQueryRow = (value: unknown): value is AdminProfileQueryRow => {
  if (!value || typeof value !== "object") return false;

  const row = value as Partial<AdminProfileQueryRow>;
  return (
    typeof row.id === "number" &&
    typeof row.email === "string" &&
    typeof row.name === "string" &&
    typeof row.is_active === "boolean" &&
    (typeof row.auth_user_id === "string" || row.auth_user_id === null) &&
    (typeof row.department_id === "number" || row.department_id === null) &&
    Array.isArray(row.admins_roles)
  );
};

const mapAdminProfile = (value: unknown): AdminProfile | null => {
  if (!isAdminProfileQueryRow(value) || !value.auth_user_id) return null;

  return {
    adminId: value.id,
    authUserId: value.auth_user_id,
    departmentId: value.department_id,
    email: value.email,
    isActive: value.is_active,
    isSuperAdmin: value.is_super_admin ?? false,
    name: value.name,
    roles: value.admins_roles
      .map(({ value: role }) => role)
      .filter((role): role is string => typeof role === "string"),
  };
};

export const createSupabaseActorDataSource = (
  client: SupabaseClient<Database>,
): ActorDataSource => ({
  async getCurrentIdentity() {
    const { data, error } = await client.auth.getUser();

    if (error) {
      if (error.status === 401 || error.status === 403) return null;

      throw new RepositoryError(
        "The authenticated session could not be verified.",
        error.code ?? null,
      );
    }

    return data.user ? { email: data.user.email ?? null, id: data.user.id } : null;
  },

  async findAdminProfile(authUserId) {
    const { data, error } = await client
      .from("admins")
      .select(
        "id, name, email, auth_user_id, department_id, is_active, is_super_admin, admins_roles(value)",
      )
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) {
      throw new RepositoryError(
        "The authenticated account profile could not be loaded.",
        error.code,
      );
    }

    return mapAdminProfile(data);
  },
});
