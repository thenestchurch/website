import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerBirthdayLogRepository } from "@/lib/repositories/server/birthday-logs";
import styles from "../../members.module.css";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
  }).format(date);
};
export const dynamic = "force-dynamic";

export default async function BirthdayLogsPage() {
  const actor = await requireServerAdminActor(["admin", "staff"]);
  const logs = await (await getServerBirthdayLogRepository(actor)).list(500);
  return <main className={styles.page}><div className={styles.stack}>
    <section className={styles.hero}><p className={styles.eyebrow}>Birthdays</p><h1 className={styles.title}>Delivery Logs</h1><p className={styles.lede}>Review recent birthday email outcomes and dry runs.</p><div className={styles.actions}><Link className={styles.secondaryButton} href="/admin/members/birthdays">Back To Birthdays</Link></div></section>
    <section className={styles.panel}><div className={styles.panelPad}>{logs.length === 0 ? <div className={styles.emptyState}>No birthday delivery logs found.</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Run</th><th>Recipient</th><th>Status</th><th>Mode</th><th>Message</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{formatDate(log.runDate)}</td><td>{log.recipientEmail ?? "-"}</td><td><span className={`${styles.pill} ${log.status === "sent" ? styles.pillGold : log.status === "failed" ? styles.pillRed : styles.pillDark}`}>{log.status}</span></td><td>{log.dryRun ? "Dry run" : "Live"}</td><td>{log.message ?? "-"}</td></tr>)}</tbody></table></div>}</div></section>
  </div></main>;
}
