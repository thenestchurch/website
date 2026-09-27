import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { BirthdayLogRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";

export const createSupabaseBirthdayLogRepository = (
  client: SupabaseClient<Database>,
): BirthdayLogRepository => ({
  async list(limit) {
    const { data, error } = await client.from("birthday_notification_logs").select("*")
      .order("run_date", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
    if (error) throw new RepositoryError("Birthday logs could not be loaded.", error.code);
    return data.map((row) => ({
      createdAt: row.created_at, dryRun: row.dry_run ?? false, id: row.id,
      memberId: row.member_id, message: row.message, recipientEmail: row.recipient_email,
      runDate: row.run_date, status: row.status, updatedAt: row.updated_at,
    }));
  },
});
