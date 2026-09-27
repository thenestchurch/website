import "server-only";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { ReportRepository } from "../contracts.ts";
import { createSupabaseReportRepository } from "../supabase/reports.ts";
export const getServerReportRepository = async (): Promise<ReportRepository> => createSupabaseReportRepository(await createSupabaseServerClient());
