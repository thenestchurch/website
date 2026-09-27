import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabasePrivilegedClient } from "../../supabase/privileged.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { AdminAccountRepository } from "../contracts.ts";
import { createSupabaseAdminAccountRepository } from "../supabase/admin-accounts.ts";
export const getServerAdminAccountRepository = async (actor: AuthenticatedActor): Promise<AdminAccountRepository> => {
  requireAnyRole(actor, ["admin"]);
  const repository = createSupabaseAdminAccountRepository(await createSupabaseServerClient(), createSupabasePrivilegedClient());
  return { findById: repository.findById.bind(repository), list: repository.list.bind(repository), save: async (input) => {
    if (input.id === actor.adminId && (!input.isActive || (!input.isSuperAdmin && !input.roles.includes("admin")))) throw new Error("You cannot remove your own administrator access.");
    return repository.save(input);
  } };
};
