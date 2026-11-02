import { getChurchDate } from "@/lib/dates/church-date";
import styles from "@/app/public-operations.module.css";
import { AttendanceSearch } from "./attendance-search";

type SearchParams = Promise<{
  registered?: string | string[];
  saved?: string | string[];
}>;

export const dynamic = "force-dynamic";

export default async function PublicAttendancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const todayValue = getChurchDate();
  const params = await searchParams;
  const saved = Array.isArray(params.saved) ? params.saved[0] : params.saved;
  const registered = Array.isArray(params.registered) ? params.registered[0] : params.registered;

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <div className={styles.heroIcon} aria-hidden="true">
            <svg fill="none" height="40" viewBox="0 0 24 24" width="40">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className={styles.heroTitle}>Mark Attendance</h1>
          <p className={styles.heroText}>
            Select members who are present today and save the attendance register.
          </p>
          <div className={styles.datePill}>
            {new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(new Date(todayValue))}
          </div>
          {registered === "1" ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>Member registered successfully and marked present for today.</div>
          ) : null}
          {saved === "invalid" ? (
            <div className={`${styles.banner} ${styles.bannerWarn}`}>Attendance could not be saved. Please try again.</div>
          ) : null}
          {saved === "1" ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>Attendance saved.</div>
          ) : null}
        </section>

        <div className={styles.actions}>
          <a className={styles.secondaryButton} href="/members/member-register">
            Register Member
          </a>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <AttendanceSearch date={todayValue} />
          </div>
        </section>
      </div>
    </main>
  );
}
