import "server-only";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { ReportContentRepository } from "../contracts.ts";
import { createSupabaseReportContentRepository } from "../supabase/report-content.ts";
export const getServerReportContentRepository = async (): Promise<ReportContentRepository> => createSupabaseReportContentRepository(await createSupabaseServerClient());
