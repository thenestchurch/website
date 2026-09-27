import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../supabase/database.types.ts";
import type { AttendanceWriteRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapAttendanceRecordRow } from "./mappers.ts";

export const createSupabaseAttendanceWriteRepository = (
  client: SupabaseClient<Database>,
): AttendanceWriteRepository => ({
  async saveRegister(input) {
    if (input.entries.length === 0) return [];

    const entries = input.entries.map((entry) => ({
      memberId: entry.memberId,
      notes: entry.notes,
      present: entry.present,
    })) satisfies Json[];
    const { data, error } = await client.rpc("save_attendance_register", {
      p_date: input.date,
      p_entries: entries,
      p_service_id: input.serviceId,
    });

    if (error) {
      throw new RepositoryError("Attendance could not be saved.", error.code);
    }

    return data.map(mapAttendanceRecordRow);
  },
});
