import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { ServiceType } from "../../domain/types.ts";
import type {
  DepartmentRepository,
  PublicAttendanceSearchRepository,
  ReportContentRepository,
  ServiceRepository,
} from "../contracts.ts";
import { RepositoryError } from "../errors.ts";

const emptyTimestamp = "";

export const createSupabasePublicDepartmentRepository = (
  client: SupabaseClient<Database>,
): DepartmentRepository => {
  const list = async () => {
    const { data, error } = await client.rpc("list_public_departments");
    if (error) throw new RepositoryError("Departments could not be loaded.", error.code);
    return data.map((row) => ({
      createdAt: emptyTimestamp,
      description: null,
      id: row.id,
      isActive: true,
      name: row.name,
      reportingChannel: null,
      slug: null,
      updatedAt: emptyTimestamp,
    }));
  };
  return {
    findActive: list,
    findAll: list,
    async findById(id) { return (await list()).find((department) => department.id === id) ?? null; },
  };
};

export const createSupabasePublicServiceRepository = (
  client: SupabaseClient<Database>,
): ServiceRepository => {
  const list = async () => {
    const { data, error } = await client.rpc("list_public_services");
    if (error) throw new RepositoryError("Services could not be loaded.", error.code);
    return data.map((row) => ({
      createdAt: emptyTimestamp,
      date: row.date,
      endTime: null,
      id: row.id,
      isActive: true,
      name: row.name,
      notes: null,
      serviceType: row.service_type as ServiceType,
      startTime: null,
      updatedAt: emptyTimestamp,
    }));
  };
  return {
    findActive: list,
    findAll: list,
    async findById(id) { return (await list()).find((service) => service.id === id) ?? null; },
  };
};

export const createSupabasePublicReportContentRepository = (
  client: SupabaseClient<Database>,
): ReportContentRepository => {
  const instructions = async () => {
    const { data, error } = await client.rpc("list_public_report_instructions");
    if (error) throw new RepositoryError("Report instructions could not be loaded.", error.code);
    return data.map((row) => ({
      content: row.content,
      createdAt: emptyTimestamp,
      departmentId: row.department_id,
      id: row.id,
      isActive: true,
      title: row.title,
      updatedAt: emptyTimestamp,
    }));
  };
  const templates = async () => {
    const { data, error } = await client.rpc("list_public_report_templates");
    if (error) throw new RepositoryError("Report templates could not be loaded.", error.code);
    return data.map((row) => ({
      applicableDepartmentIds: row.applicable_department_ids,
      content: row.content,
      createdAt: emptyTimestamp,
      id: row.id,
      isActive: true,
      title: row.title,
      updatedAt: emptyTimestamp,
    }));
  };
  return {
    findActiveInstructions: instructions,
    findActiveTemplates: templates,
    findAllInstructions: instructions,
    findAllTemplates: templates,
    async findInstructionForDepartment(departmentId) {
      return (await instructions()).find((item) => item.departmentId === departmentId) ?? null;
    },
    async findTemplatesForDepartment(departmentId) {
      return (await templates()).filter((item) => item.applicableDepartmentIds.length === 0 || item.applicableDepartmentIds.includes(departmentId));
    },
  };
};

export const createSupabasePublicAttendanceSearchRepository = (
  client: SupabaseClient<Database>,
  secret: string,
): PublicAttendanceSearchRepository => ({
  async search(query, date) {
    const { data, error } = await client.rpc("search_public_attendance_members", {
      p_date: date,
      p_query: query,
      p_secret: secret,
    });
    if (error) throw new RepositoryError("Members could not be searched.", error.code);
    return data.map((row) => ({
      departmentName: row.department_name,
      firstName: row.first_name,
      fullName: row.full_name,
      id: row.id,
      record: row.record_id === null ? null : { id: row.record_id, present: row.record_present ?? false },
    }));
  },
});
