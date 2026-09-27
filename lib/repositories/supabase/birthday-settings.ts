import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { BirthdaySettingsRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";

const mapSettings = (row: Database["public"]["Tables"]["birthday_notification_settings"]["Row"]) => ({
  adminNotificationEmails: row.admin_notification_emails,
  adminSummaryBody: row.admin_summary_body,
  adminSummarySubject: row.admin_summary_subject,
  enabled: row.enabled ?? false,
  id: row.id,
  lastRun: row.last_run,
  memberEmailBody: row.member_email_body,
  memberEmailSubject: row.member_email_subject,
  sendTime: row.send_time,
  updatedAt: row.updated_at,
});

export const createSupabaseBirthdaySettingsRepository = (
  client: SupabaseClient<Database>,
): BirthdaySettingsRepository => ({
  async get() {
    const { data, error } = await client.from("birthday_notification_settings")
      .select("*").order("id", { ascending: true }).limit(1).maybeSingle();
    if (error) throw new RepositoryError("Birthday settings could not be loaded.", error.code);
    if (!data) throw new RepositoryError("Birthday settings have not been initialized.", "NOT_FOUND");
    return mapSettings(data);
  },
  async update(input) {
    const current = await this.get();
    const { data, error } = await client.from("birthday_notification_settings").update({
      admin_notification_emails: input.adminNotificationEmails,
      admin_summary_body: input.adminSummaryBody,
      admin_summary_subject: input.adminSummarySubject,
      enabled: input.enabled,
      member_email_body: input.memberEmailBody,
      member_email_subject: input.memberEmailSubject,
      send_time: input.sendTime,
      updated_at: new Date().toISOString(),
    }).eq("id", current.id).select("*").single();
    if (error) throw new RepositoryError("Birthday settings could not be saved.", error.code);
    return mapSettings(data);
  },
});
