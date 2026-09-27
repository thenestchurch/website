import "server-only";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { AdminSummaryRepository } from "../contracts.ts";
import { createSupabaseAdminSummaryRepository } from "../supabase/admin-summaries.ts";
export const getServerAdminSummaryRepository = async (): Promise<AdminSummaryRepository> => createSupabaseAdminSummaryRepository(await createSupabaseServerClient());
