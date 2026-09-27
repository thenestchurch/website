import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerBirthdaySettingsRepository } from "@/lib/repositories/server/birthday-settings";
import styles from "../../members.module.css";
import {
  saveBirthdayEmailSettings,
  sendDailyBirthdayEmailsNow,
  sendWeeklyBirthdayDigestNow,
} from "./actions";

type SearchParams = Promise<{
  saved?: string | string[];
  failed?: string | string[];
  recipients?: string | string[];
  run?: string | string[];
  sent?: string | string[];
  type?: string | string[];
  weekly?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const formatLastRun = (value: string | null | undefined) => {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
};

export const dynamic = "force-dynamic";

export default async function BirthdayEmailSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const saved = takeString(params.saved);
  const runStatus = takeString(params.run);
  const runType = takeString(params.type);
  const failed = takeString(params.failed) ?? "0";
  const recipients = takeString(params.recipients) ?? "0";
  const sent = takeString(params.sent) ?? "0";
  const weekly = takeString(params.weekly) ?? "0";
  const actor = await requireServerAdminActor(["admin", "staff"]);
  const settings = await (await getServerBirthdaySettingsRepository(actor)).get();

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Birthdays</p>
          <h1 className={styles.title}>Birthday Email Settings</h1>
          <p className={styles.lede}>
            Control member birthday messages and the Gmail addresses that receive the Sunday weekly summary.
          </p>
          <div className={styles.actions}>
            <Link className={styles.secondaryButton} href="/admin/members/birthdays">
              Back To Birthdays
            </Link>
          </div>
        </section>

        {saved === "1" ? (
          <div className={`${styles.banner} ${styles.bannerSuccess}`}>Birthday email settings saved.</div>
        ) : null}
        {saved === "invalid" ? (
          <div className={styles.emptyState}>Enter the send time in HH:mm format, for example 08:00.</div>
        ) : null}
        {runStatus ? (
          <div className={runStatus === "partial-failure" ? styles.emptyState : `${styles.banner} ${styles.bannerSuccess}`}>
            {runType === "weekly"
              ? `Weekly digest result: ${weekly} birthday member(s), ${recipients} recipient(s), ${failed} failure(s).`
              : `Daily birthday result: ${sent} personal email(s) sent, ${failed} failure(s). Status: ${runStatus}.`}
          </div>
        ) : null}

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>Manual Sending</h2>
            <p className={styles.panelText}>Use these controls for testing or when you need to run a message outside the normal cron schedule.</p>
            <div className={styles.actions}>
              <form action={sendDailyBirthdayEmailsNow}>
                <button className={styles.primaryButton} type="submit">Send Today&apos;s Birthday Emails</button>
              </form>
              <form action={sendWeeklyBirthdayDigestNow}>
                <button className={styles.secondaryButton} type="submit">Send Weekly Digest Now</button>
              </form>
            </div>
          </div>
        </section>

        <form action={saveBirthdayEmailSettings} className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Sending</h2>
              <label className={styles.checkboxWrap}>
                <input defaultChecked={Boolean(settings.enabled)} name="enabled" type="checkbox" />
                Enable automatic birthday notifications
              </label>
              <div className={styles.doubleGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="sendTime">Preferred Lagos time</label>
                  <input className={styles.input} defaultValue={settings.sendTime ?? "08:00"} id="sendTime" name="sendTime" type="time" />
                </div>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Last successful run</span>
                  <p className={styles.panelText}>{formatLastRun(settings.lastRun)}</p>
                </div>
              </div>
              <p className={styles.panelText}>The external cron-job schedule controls the actual execution time.</p>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Sunday Gmail Birthday Digest</h2>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="adminNotificationEmails">Notification email addresses</label>
                <textarea
                  className={styles.textarea}
                  defaultValue={settings.adminNotificationEmails ?? ""}
                  id="adminNotificationEmails"
                  name="adminNotificationEmails"
                  placeholder={"firstperson@gmail.com\nsecondperson@gmail.com"}
                />
                <p className={styles.panelText}>Enter one address per line or separate addresses with commas. These addresses receive the Sunday-to-Saturday birthday list every Sunday.</p>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="adminSummarySubject">Summary subject</label>
                <input className={styles.input} defaultValue={settings.adminSummarySubject ?? "Birthday list for the week of {{date}}"} id="adminSummarySubject" name="adminSummarySubject" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="adminSummaryBody">Summary message</label>
                <textarea className={styles.textarea} defaultValue={settings.adminSummaryBody ?? ""} id="adminSummaryBody" name="adminSummaryBody" />
                <p className={styles.panelText}>Available placeholders: {"{{date}}"}, {"{{memberList}}"}, {"{{sentCount}}"}, {"{{skippedCount}}"}, {"{{failedCount}}"}.</p>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Member Birthday Email</h2>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="memberEmailSubject">Member subject</label>
                <input className={styles.input} defaultValue={settings.memberEmailSubject ?? "Happy birthday from The Nest Church"} id="memberEmailSubject" name="memberEmailSubject" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="memberEmailBody">Member message</label>
                <textarea className={styles.textarea} defaultValue={settings.memberEmailBody ?? ""} id="memberEmailBody" name="memberEmailBody" />
                <p className={styles.panelText}>Available placeholders: {"{{firstName}}"}, {"{{lastName}}"}, {"{{fullName}}"}, {"{{date}}"}.</p>
              </div>
              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit">Save Birthday Email Settings</button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}
