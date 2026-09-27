import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { AdminSummaryRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";

export const createSupabaseAdminSummaryRepository = (
  client: SupabaseClient<Database>,
): AdminSummaryRepository => ({
  async findByIds(ids) {
    if (ids.length === 0) return [];

    const { data, error } = await client.rpc("get_admin_summaries", {
      p_ids: [...new Set(ids)].slice(0, 500),
    });
    if (error) throw new RepositoryError("Admin summaries could not be loaded.", error.code);
    return data;
  },
});
