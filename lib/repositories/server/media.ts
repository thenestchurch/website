import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { MediaRepository } from "../contracts.ts";
import { createSupabaseMediaRepository } from "../supabase/media.ts";
export const getServerMediaRepository = async (actor: AuthenticatedActor): Promise<MediaRepository> => { requireAnyRole(actor, ["admin", "staff", "absentee-viewer"]); return createSupabaseMediaRepository(await createSupabaseServerClient()); };
