import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { ServiceWriteRepository } from "../contracts.ts";
import { createSupabaseServiceWriteRepository } from "../supabase/service-writes.ts";
export const getServerServiceWriteRepository = async (actor: AuthenticatedActor): Promise<ServiceWriteRepository> => { requireAnyRole(actor, ["admin", "staff"]); return createSupabaseServiceWriteRepository(await createSupabaseServerClient()); };
