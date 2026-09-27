import "server-only";
import { createSupabaseServerClient } from "../../supabase/server.ts";
import type { ServiceRepository } from "../contracts.ts";
import { createSupabaseServiceRepository } from "../supabase/services.ts";
export const getServerServiceRepository = async (): Promise<ServiceRepository> => createSupabaseServiceRepository(await createSupabaseServerClient());
