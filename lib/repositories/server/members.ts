import "server-only";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { MemberRepository } from "../contracts.ts";
import { createSupabaseMemberRepository } from "../supabase/members.ts";
import { getServerDepartmentRepository } from "./departments.ts";
export const getServerMemberRepository = async (): Promise<MemberRepository> => createSupabaseMemberRepository(await createSupabaseServerClient(), await getServerDepartmentRepository());
