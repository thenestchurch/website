import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { ReportContentWriteRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapReportInstructionRow, mapReportTemplateRow } from "./mappers.ts";

export const createSupabaseReportContentWriteRepository = (
  client: SupabaseClient<Database>,
): ReportContentWriteRepository => ({
  async saveInstruction(input) {
    const { data, error } = await client.rpc("save_report_instruction", {
      p_content: input.content,
      p_department_id: input.departmentId,
      p_id: input.id ?? null,
      p_is_active: input.isActive,
      p_title: input.title,
    });
    if (error) throw new RepositoryError("The report instruction could not be saved.", error.code);
    return mapReportInstructionRow(data);
  },
  async saveTemplate(input) {
    const { data, error } = await client.rpc("save_report_template", {
      p_content: input.content,
      p_department_ids: input.applicableDepartmentIds,
      p_id: input.id ?? null,
      p_is_active: input.isActive,
      p_title: input.title,
    });
    if (error) throw new RepositoryError("The report template could not be saved.", error.code);
    return {
      ...mapReportTemplateRow(data, []),
      applicableDepartmentIds: input.applicableDepartmentIds,
    };
  },
});
