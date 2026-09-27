import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttendanceRecordRow,
  Database,
  MemberRow,
} from "../../supabase/database.types.ts";
import type { AttendanceFilters, AttendanceRepository, PageResult } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import {
  mapAttendanceRecordRow,
  mapAttendanceRecordWithMemberRow,
} from "./mappers.ts";

type AttendanceWithMemberRow = AttendanceRecordRow & { member: MemberRow };

const emptyPage = <T>(filters: AttendanceFilters): PageResult<T> => ({
  docs: [],
  hasNextPage: false,
  hasPrevPage: filters.page > 1,
  limit: filters.limit,
  page: filters.page,
  totalDocs: 0,
  totalPages: 1,
});

const applyFilters = <TQuery extends {
  eq(column: string, value: unknown): TQuery;
  in(column: string, values: readonly number[]): TQuery;
  is(column: string, value: null): TQuery;
}>(query: TQuery, filters: AttendanceFilters, memberAlias?: string) => {
  if (filters.date !== undefined) query = query.eq("date", filters.date);
  if (filters.memberId !== undefined) query = query.eq("member_id", filters.memberId);
  if (filters.memberIds !== undefined) query = query.in("member_id", filters.memberIds);
  if (filters.present !== undefined) query = query.eq("present", filters.present);
  if (filters.serviceId === null) query = query.is("service_id", null);
  if (filters.serviceId !== undefined && filters.serviceId !== null) {
    query = query.eq("service_id", filters.serviceId);
  }
  if (filters.departmentId !== undefined && memberAlias) {
    query = query.eq(`${memberAlias}.department_id`, filters.departmentId);
  }
  return query;
};

const pageResult = <T>(filters: AttendanceFilters, count: number | null, docs: T[]) => {
  const totalDocs = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalDocs / filters.limit));
  return {
    docs,
    hasNextPage: filters.page < totalPages,
    hasPrevPage: filters.page > 1,
    limit: filters.limit,
    page: filters.page,
    totalDocs,
    totalPages,
  };
};

export const createSupabaseAttendanceRepository = (
  client: SupabaseClient<Database>,
): AttendanceRepository => ({
  async list(filters) {
    if (filters.memberIds?.length === 0) return emptyPage(filters);

    const start = (filters.page - 1) * filters.limit;
    const selection = filters.departmentId === undefined
      ? "*"
      : "*, member:members!inner(id)";
    let query = client.from("attendance_records").select(selection, { count: "exact" });
    query = applyFilters(query, filters, "member");

    const { count, data, error } = await query
      .order("date", { ascending: false })
      .range(start, start + filters.limit - 1);

    if (error) {
      throw new RepositoryError("Attendance records could not be loaded.", error.code);
    }

    return pageResult(
      filters,
      count,
      (data as unknown as AttendanceRecordRow[]).map(mapAttendanceRecordRow),
    );
  },

  async listWithMembers(filters) {
    if (filters.memberIds?.length === 0) return emptyPage(filters);

    const start = (filters.page - 1) * filters.limit;
    let query = client
      .from("attendance_records")
      .select("*, member:members!inner(*)", { count: "exact" });
    query = applyFilters(query, filters, "member");
    const { count, data, error } = await query
      .order("date", { ascending: false })
      .range(start, start + filters.limit - 1);

    if (error) {
      throw new RepositoryError("Attendance records could not be loaded.", error.code);
    }

    return pageResult(
      filters,
      count,
      (data as unknown as AttendanceWithMemberRow[]).map(mapAttendanceRecordWithMemberRow),
    );
  },
});
