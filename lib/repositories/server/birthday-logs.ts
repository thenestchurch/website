import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { BirthdayLogRepository } from "../contracts.ts";
import { createSupabaseBirthdayLogRepository } from "../supabase/birthday-logs.ts";
export const getServerBirthdayLogRepository = async (actor: AuthenticatedActor): Promise<BirthdayLogRepository> => { requireAnyRole(actor, ["admin", "staff"]); return createSupabaseBirthdayLogRepository(await createSupabaseServerClient()); };
