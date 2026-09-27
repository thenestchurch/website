import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ReportTemplateRelationRow,
  ReportTemplateRow,
} from "../../supabase/database.types.ts";
import type { ReportContentRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import {
  mapReportInstructionRow,
  mapReportTemplateRow,
} from "./mappers.ts";

const mapTemplates = (
  rows: ReportTemplateRow[],
  relations: ReportTemplateRelationRow[],
) => {
  const departmentsByTemplate = new Map<number, number[]>();
  for (const relation of relations) {
    if (relation.departments_id === null) continue;
    const ids = departmentsByTemplate.get(relation.parent_id) ?? [];
    ids.push(relation.departments_id);
    departmentsByTemplate.set(relation.parent_id, ids);
  }
  return rows.map((row) => mapReportTemplateRow(row, departmentsByTemplate.get(row.id) ?? []));
};

export const createSupabaseReportContentRepository = (
  client: SupabaseClient<Database>,
): ReportContentRepository => ({
  async findAllInstructions() {
    const { data, error } = await client.from("report_instructions").select("*").order("title", { ascending: true });
    if (error) throw new RepositoryError("Report instructions could not be loaded.", error.code);
    return data.map(mapReportInstructionRow);
  },
  async findAllTemplates() {
    const { data, error } = await client.from("report_templates").select("*").order("title", { ascending: true });
    if (error) throw new RepositoryError("Report templates could not be loaded.", error.code);
    const templates = data.map((row) => mapReportTemplateRow(row, []));
    if (templates.length === 0) return templates;
    const { data: relations, error: relationError } = await client.from("report_templates_rels")
      .select("*").in("parent_id", templates.map((template) => template.id)).eq("path", "applicableDepartments");
    if (relationError) throw new RepositoryError("Report template departments could not be loaded.", relationError.code);
    const ids = new Map<number, number[]>();
    for (const relation of relations) {
      if (relation.departments_id === null) continue;
      ids.set(relation.parent_id, [...(ids.get(relation.parent_id) ?? []), relation.departments_id]);
    }
    return templates.map((template) => ({ ...template, applicableDepartmentIds: ids.get(template.id) ?? [] }));
  },
  async findActiveInstructions() {
    const { data, error } = await client
      .from("report_instructions")
      .select("*")
      .eq("is_active", true)
      .order("title", { ascending: true });
    if (error) throw new RepositoryError("Report instructions could not be loaded.", error.code);
    return data.map(mapReportInstructionRow);
  },

  async findActiveTemplates() {
    const { data, error } = await client
      .from("report_templates")
      .select("*")
      .eq("is_active", true)
      .order("title", { ascending: true });
    if (error) throw new RepositoryError("Report templates could not be loaded.", error.code);
    if (data.length === 0) return [];

    const { data: relations, error: relationError } = await client
      .from("report_templates_rels")
      .select("*")
      .eq("path", "applicableDepartments")
      .in("parent_id", data.map(({ id }) => id))
      .order("order", { ascending: true });
    if (relationError) {
      throw new RepositoryError("Report template departments could not be loaded.", relationError.code);
    }
    return mapTemplates(data, relations);
  },

  async findInstructionForDepartment(departmentId) {
    const { data, error } = await client
      .from("report_instructions")
      .select("*")
      .eq("department_id", departmentId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new RepositoryError("The report instruction could not be loaded.", error.code);
    return data ? mapReportInstructionRow(data) : null;
  },

  async findTemplatesForDepartment(departmentId) {
    const templates = await this.findActiveTemplates();
    return templates.filter(
      (template) =>
        template.applicableDepartmentIds.length === 0 ||
        template.applicableDepartmentIds.includes(departmentId),
    );
  },
});
