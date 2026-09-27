import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { ReportContentWriteRepository } from "../contracts.ts";
import { createSupabaseReportContentWriteRepository } from "../supabase/report-content-writes.ts";
export const getServerReportContentWriteRepository = async (actor: AuthenticatedActor): Promise<ReportContentWriteRepository> => { requireAnyRole(actor, ["admin", "staff"]); return createSupabaseReportContentWriteRepository(await createSupabaseServerClient()); };
