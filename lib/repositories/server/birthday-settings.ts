import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { BirthdaySettingsRepository } from "../contracts.ts";
import { createSupabaseBirthdaySettingsRepository } from "../supabase/birthday-settings.ts";
export const getServerBirthdaySettingsRepository = async (actor: AuthenticatedActor): Promise<BirthdaySettingsRepository> => { requireAnyRole(actor, ["admin", "staff"]); return createSupabaseBirthdaySettingsRepository(await createSupabaseServerClient()); };
