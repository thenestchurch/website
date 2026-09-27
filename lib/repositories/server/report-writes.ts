import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole, requireDepartmentAccess } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { ReportWriteRepository } from "../contracts.ts";
import { createSupabaseReportWriteRepository } from "../supabase/report-writes.ts";
export const getServerReportWriteRepository = async (actor: AuthenticatedActor): Promise<ReportWriteRepository> => {
  const repository = createSupabaseReportWriteRepository(await createSupabaseServerClient());
  return { create: async (input) => { requireDepartmentAccess(actor, input.departmentId); return repository.create(input); }, delete: async (id) => { requireAnyRole(actor, ["admin"]); return repository.delete(id); }, setApproval: async (input) => { requireAnyRole(actor, ["admin", "staff"]); return repository.setApproval(input); } };
};
