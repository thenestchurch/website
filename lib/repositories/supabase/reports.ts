import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { ReportRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapServiceReportRow } from "./mappers.ts";

export const createSupabaseReportRepository = (
  client: SupabaseClient<Database>,
): ReportRepository => ({
  async findById(id) {
    const { data, error } = await client
      .from("service_reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new RepositoryError("The service report could not be loaded.", error.code);
    return data ? mapServiceReportRow(data) : null;
  },

  async list(filters) {
    const start = (filters.page - 1) * filters.limit;
    let query = client.from("service_reports").select("*", { count: "exact" });
    if (filters.departmentId !== undefined) query = query.eq("department_id", filters.departmentId);
    if (filters.isApproved !== undefined) query = query.eq("is_approved", filters.isApproved);
    if (filters.serviceId !== undefined) query = query.eq("service_id", filters.serviceId);
    const { count, data, error } = await query
      .order("created_at", { ascending: false })
      .range(start, start + filters.limit - 1);
    if (error) throw new RepositoryError("Service reports could not be loaded.", error.code);

    const totalDocs = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalDocs / filters.limit));
    return {
      docs: data.map(mapServiceReportRow),
      hasNextPage: filters.page < totalPages,
      hasPrevPage: filters.page > 1,
      limit: filters.limit,
      page: filters.page,
      totalDocs,
      totalPages,
    };
  },
});
