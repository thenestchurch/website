import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminAccount, AdminAccountSaveInput, AdminRole } from "../../domain/types.ts";
import type { AdminAccountRpcRow, Database } from "../../supabase/database.types.ts";
import type { AdminAccountRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";

const mapAccount = (row: AdminAccountRpcRow): AdminAccount => ({
  authUserId: row.auth_user_id,
  createdAt: row.created_at,
  departmentId: row.department_id,
  email: row.email,
  id: row.id,
  isActive: row.is_active,
  isSuperAdmin: row.is_super_admin,
  name: row.name,
  roles: row.roles as AdminRole[],
  updatedAt: row.updated_at,
});

export const createSupabaseAdminAccountRepository = (
  client: SupabaseClient<Database>,
  privilegedClient: SupabaseClient<Database>,
): AdminAccountRepository => {
  const saveProfile = async (input: AdminAccountSaveInput, authUserId: string) => {
    const { data, error } = await client.rpc("save_admin_account", {
      p_auth_user_id: authUserId,
      p_department_id: input.departmentId,
      p_email: input.email,
      p_id: input.id ?? null,
      p_is_active: input.isActive,
      p_is_super_admin: input.isSuperAdmin,
      p_name: input.name,
      p_roles: input.roles,
    });
    const row = data?.[0];
    if (error || !row) throw new RepositoryError("The account profile could not be saved.", error?.code ?? "NOT_FOUND");
    return mapAccount(row);
  };

  const repository: AdminAccountRepository = {
    async findById(id) {
      return (await repository.list()).find((account) => account.id === id) ?? null;
    },
    async list() {
      const { data, error } = await client.rpc("list_admin_accounts");
      if (error) throw new RepositoryError("Accounts could not be loaded.", error.code);
      return data.map(mapAccount);
    },
    async save(input) {
      const current = input.id === undefined ? null : await repository.findById(input.id);
      if (input.id !== undefined && !current) throw new RepositoryError("The account does not exist.", "NOT_FOUND");

      if (!current?.authUserId) {
        if (!input.password) throw new RepositoryError("A temporary password is required.", "INVALID_INPUT");
        const created = await privilegedClient.auth.admin.createUser({
          email: input.email,
          email_confirm: true,
          password: input.password,
          user_metadata: { name: input.name },
        });
        if (created.error || !created.data.user) {
          throw new RepositoryError("The authentication account could not be created.", created.error?.code ?? null);
        }
        try {
          return await saveProfile(input, created.data.user.id);
        } catch (error) {
          await privilegedClient.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
          throw error;
        }
      }

      const saved = await saveProfile(input, current.authUserId);
      const authUpdate = await privilegedClient.auth.admin.updateUserById(current.authUserId, {
        email: input.email,
        ...(input.password ? { password: input.password } : {}),
        user_metadata: { name: input.name },
      });
      if (authUpdate.error) {
        await saveProfile({
          departmentId: current.departmentId,
          email: current.email,
          id: current.id,
          isActive: current.isActive,
          isSuperAdmin: current.isSuperAdmin,
          name: current.name,
          roles: [...current.roles],
        }, current.authUserId).catch(() => undefined);
        throw new RepositoryError("The authentication account could not be updated.", authUpdate.error.code ?? null);
      }
      return saved;
    },
  };
  return repository;
};
