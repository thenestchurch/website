import "server-only";
import type { AuthenticatedActor } from "../../auth/authorization.ts";
import { requireAnyRole } from "../../auth/authorization.ts";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { AttendanceWriteRepository } from "../contracts.ts";
import { createSupabaseAttendanceWriteRepository } from "../supabase/attendance-writes.ts";
export const getServerAttendanceWriteRepository = async (actor: AuthenticatedActor): Promise<AttendanceWriteRepository> => { requireAnyRole(actor, ["admin", "staff"]); return createSupabaseAttendanceWriteRepository(await createSupabaseServerClient()); };
