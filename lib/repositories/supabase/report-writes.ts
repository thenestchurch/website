import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { ReportWriteRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapServiceReportRow } from "./mappers.ts";

export const createSupabaseReportWriteRepository = (
  client: SupabaseClient<Database>,
): ReportWriteRepository => ({
  async create(input) {
    const { data, error } = await client
      .from("service_reports")
      .insert({
        approved_at: null,
        approved_by_id: null,
        attachment_url: input.attachmentUrl,
        department_attendance: input.departmentAttendance,
        department_id: input.departmentId,
        is_approved: false,
        report_content: input.reportContent,
        service_id: input.serviceId,
        submitted_by_id: null,
        title: input.title,
        volunteers_count: input.volunteersCount,
      })
      .select("*")
      .single();

    if (error) {
      throw new RepositoryError("The service report could not be submitted.", error.code);
    }

    return mapServiceReportRow(data);
  },
  async delete(id) {
    const { data, error } = await client
      .from("service_reports")
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new RepositoryError("The service report could not be deleted.", error.code);
    }

    return mapServiceReportRow(data);
  },
  async setApproval(input) {
    const { data, error } = await client
      .from("service_reports")
      .update({ is_approved: input.isApproved })
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) {
      throw new RepositoryError("The service report approval could not be updated.", error.code);
    }

    return mapServiceReportRow(data);
  },
});
