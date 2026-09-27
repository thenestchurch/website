import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { DepartmentRepository, MemberRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapMemberRow } from "./mappers.ts";

const escapeLikePattern = (value: string) =>
  value.replace(/[\\%_"]/g, (character) => `\\${character}`);

const memberSearchFilter = (value: string) => {
  const pattern = `"%${escapeLikePattern(value)}%"`;
  return ["full_name", "email", "phone_number", "whatsapp_number"]
    .map((column) => `${column}.ilike.${pattern}`)
    .join(",");
};

export const createSupabaseMemberRepository = (
  client: SupabaseClient<Database>,
  departments: DepartmentRepository,
): MemberRepository => ({
  async findById(id) {
    const { data, error } = await client
      .from("members")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new RepositoryError("The member could not be loaded.", error.code);
    }
    if (!data) return null;

    const member = mapMemberRow(data);
    const [department, preferredDepartment] = await Promise.all([
      member.departmentId === null ? null : departments.findById(member.departmentId),
      member.preferredDepartmentId === null
        ? null
        : departments.findById(member.preferredDepartmentId),
    ]);

    return { ...member, department, preferredDepartment };
  },

  async list(filters) {
    const start = (filters.page - 1) * filters.limit;
    let query = client.from("members").select("*", { count: "exact" });

    if (filters.departmentId !== undefined) {
      query = query.eq("department_id", filters.departmentId);
    }
    if (filters.isNewComer !== undefined) {
      query = query.eq("is_new_comer", filters.isNewComer);
    }
    if (filters.query?.trim()) {
      query = query.or(memberSearchFilter(filters.query.trim()));
    }

    const { count, data, error } = await query
      .order("full_name", { ascending: true })
      .range(start, start + filters.limit - 1);

    if (error) {
      throw new RepositoryError("Members could not be loaded.", error.code);
    }

    const totalDocs = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalDocs / filters.limit));
    return {
      docs: data.map(mapMemberRow),
      hasNextPage: filters.page < totalPages,
      hasPrevPage: filters.page > 1,
      limit: filters.limit,
      page: filters.page,
      totalDocs,
      totalPages,
    };
  },
});
