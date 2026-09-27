import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerReportRepository } from "@/lib/repositories/server/reports.ts";
import { getServerServiceRepository } from "@/lib/repositories/server/services.ts";
import { collectAllPages } from "@/lib/repositories/pagination.ts";
import styles from "./reports.module.css";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireServerAdminActor(["admin", "staff"]);
  const [serviceRepository, departmentRepository, reportRepository] = await Promise.all([
    getServerServiceRepository(),
    getServerDepartmentRepository(),
    getServerReportRepository(),
  ]);

  const [services, departments, reports] = await Promise.all([
    serviceRepository.findAll(),
    departmentRepository.findActive(),
    collectAllPages(({ limit, page }) => reportRepository.list({ limit, page })),
  ]);
  const reportCountByService = new Map<number, number>();

  for (const report of reports) {
    reportCountByService.set(report.serviceId, (reportCountByService.get(report.serviceId) ?? 0) + 1);
  }

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Reports</p>
          <h1 className={styles.title}>Service Reports</h1>
          <p className={styles.lede}>
            Select a service to review attendance and department submissions, or submit a fresh report for the latest service.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/admin/reports/services/new">
              Create Service
            </Link>
            <Link className={styles.primaryButton} href="/admin/reports/submit">
              Submit Report
            </Link>
            <Link className={styles.ghostButton} href="/admin/attendance">
              Attendance Register
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>Snapshot</h2>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Services</span>
                <span className={styles.statValue}>{services.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Departments</span>
                <span className={styles.statValue}>{departments.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Reports Submitted</span>
                <span className={styles.statValue}>{reports.length}</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>All Services</h2>

            {services.length === 0 ? (
              <div className={styles.emptyState}>No services have been created yet.</div>
            ) : (
              <div className={styles.list}>
                {services.map((service) => {
                  const reportsCount = reportCountByService.get(service.id) ?? 0;
                  const pendingCount = Math.max(0, departments.length - reportsCount);

                  return (
                    <article className={styles.listCard} key={service.id}>
                      <div>
                        <span className={styles.serviceName}>{service.name}</span>
                        <span className={styles.serviceMeta}>
                          {new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(new Date(service.date))}
                          {service.startTime ? ` at ${service.startTime}` : ""}
                        </span>
                        <div className={styles.actions} style={{ marginTop: 12 }}>
                          <span className={`${styles.pill} ${styles.pillBlue}`}>{reportsCount} reports</span>
                          <span className={`${styles.pill} ${pendingCount > 0 ? styles.pillGold : styles.pillGreen}`}>
                            {pendingCount} pending
                          </span>
                        </div>
                      </div>

                      <div className={styles.actions}>
                        <Link className={styles.primaryButton} href={`/admin/reports/submit?service=${service.id}`}>
                          New Report
                        </Link>
                        <Link className={styles.secondaryButton} href={`/admin/reports/${service.id}`}>
                          View Overview
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
