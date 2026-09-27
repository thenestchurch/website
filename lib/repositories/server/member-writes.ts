import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { MemberWriteRepository } from "../contracts.ts";
import { createSupabaseMemberWriteRepository } from "../supabase/member-writes.ts";
export const getServerMemberWriteRepository = async (actor: AuthenticatedActor): Promise<MemberWriteRepository> => { requireAnyRole(actor, ["admin", "staff"]); return createSupabaseMemberWriteRepository(await createSupabaseServerClient()); };
