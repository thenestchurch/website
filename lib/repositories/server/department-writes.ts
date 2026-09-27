import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { DepartmentWriteRepository } from "../contracts.ts";
import { createSupabaseDepartmentWriteRepository } from "../supabase/department-writes.ts";
export const getServerDepartmentWriteRepository = async (actor: AuthenticatedActor): Promise<DepartmentWriteRepository> => { requireAnyRole(actor, ["admin", "staff"]); return createSupabaseDepartmentWriteRepository(await createSupabaseServerClient()); };
