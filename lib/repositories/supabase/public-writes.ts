import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../supabase/database.types.ts";
import type {
  AttendanceWriteRepository,
  MemberWriteRepository,
  ReportCreateRepository,
} from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapAttendanceRecordRow, mapMemberRow, mapServiceReportRow } from "./mappers.ts";

export const createSupabasePublicAttendanceWriteRepository = (
  client: SupabaseClient<Database>,
  secret: string,
): AttendanceWriteRepository => ({
  async saveRegister(input) {
    if (input.entries.length === 0) return [];
    const { data, error } = await client.rpc("save_public_attendance_register", {
      p_date: input.date,
      p_entries: input.entries as unknown as Json,
      p_secret: secret,
    });
    if (error) throw new RepositoryError("Attendance could not be saved.", error.code);
    return data.map(mapAttendanceRecordRow);
  },
});

export const createSupabasePublicMemberWriteRepository = (
  client: SupabaseClient<Database>,
  secret: string,
): MemberWriteRepository => ({
  async create(input) {
    const { data, error } = await client.rpc("register_public_member", {
      p_input: input as unknown as Json,
      p_secret: secret,
    });
    if (error) throw new RepositoryError("The member could not be registered.", error.code);
    return mapMemberRow(data);
  },
  async markAsRegular() {
    throw new RepositoryError("This public operation is not permitted.", "FORBIDDEN");
  },
  async update() {
    throw new RepositoryError("This public operation is not permitted.", "FORBIDDEN");
  },
});

export const createSupabasePublicReportWriteRepository = (
  client: SupabaseClient<Database>,
  secret: string,
): ReportCreateRepository => ({
  async create(input) {
    const { data, error } = await client.rpc("submit_public_service_report", {
      p_input: input as unknown as Json,
      p_secret: secret,
    });
    if (error) throw new RepositoryError("The service report could not be submitted.", error.code);
    return mapServiceReportRow(data);
  },
});
