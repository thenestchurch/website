import Link from "next/link";
import { HoneypotField } from "@/components/honeypot-field";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { createService } from "../../actions";
import styles from "../../reports.module.css";

type SearchParams = Promise<{
  saved?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const dynamic = "force-dynamic";

export default async function CreateServicePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireServerAdminActor(["admin", "staff"]);
  const saved = takeString((await searchParams).saved);

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Reports</p>
          <h1 className={styles.title}>Create Service</h1>
          <p className={styles.lede}>
            Create the service itself first, then submit department reports against that service.
          </p>
          <div className={styles.actions}>
            <Link className={styles.secondaryButton} href="/admin/reports">
              Back To Reports
            </Link>
          </div>
        </section>

        {saved === "invalid" ? (
          <div className={`${styles.banner} ${styles.bannerWarn}`}>Name, service type, and date are required.</div>
        ) : null}

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>New Service</h2>
            <form action={createService} className={styles.form}>
              <HoneypotField />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="name">
                  Service Name
                </label>
                <input className={styles.input} id="name" name="name" placeholder="Sunday Service" required type="text" />
              </div>

              <div className={styles.grid} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="serviceType">
                    Service Type
                  </label>
                  <select className={styles.select} defaultValue="sunday-service" id="serviceType" name="serviceType">
                    <option value="sunday-service">Sunday Service</option>
                    <option value="midweek-service">Midweek Service</option>
                    <option value="prayer-meeting">Prayer Meeting</option>
                    <option value="special-program">Special Program</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="date">
                    Date
                  </label>
                  <input className={styles.input} id="date" name="date" required type="date" />
                </div>
              </div>

              <div className={styles.grid} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="startTime">
                    Start Time
                  </label>
                  <input className={styles.input} id="startTime" name="startTime" placeholder="09:00 AM" type="text" />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="endTime">
                    End Time
                  </label>
                  <input className={styles.input} id="endTime" name="endTime" placeholder="12:00 PM" type="text" />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="notes">
                  Notes
                </label>
                <textarea className={styles.textarea} id="notes" name="notes" placeholder="Optional notes about this service." />
              </div>

              <label style={{ alignItems: "center", display: "inline-flex", fontWeight: 700, gap: 10 }}>
                <input defaultChecked name="isActive" type="checkbox" />
                Active for report submissions
              </label>

              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit">
                  Create Service
                </button>
                <Link className={styles.ghostButton} href="/admin/reports">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
