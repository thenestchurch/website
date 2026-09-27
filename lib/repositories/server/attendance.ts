import "server-only";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { AttendanceRepository } from "../contracts.ts";
import { createSupabaseAttendanceRepository } from "../supabase/attendance.ts";
export const getServerAttendanceRepository = async (): Promise<AttendanceRepository> => createSupabaseAttendanceRepository(await createSupabaseServerClient());
