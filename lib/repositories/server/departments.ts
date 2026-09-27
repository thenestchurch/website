import "server-only";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { DepartmentRepository } from "../contracts.ts";
import { createSupabaseDepartmentRepository } from "../supabase/departments.ts";
export const getServerDepartmentRepository = async (): Promise<DepartmentRepository> => createSupabaseDepartmentRepository(await createSupabaseServerClient());
