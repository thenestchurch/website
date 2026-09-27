import Link from "next/link";
import { notFound } from "next/navigation";
import { HoneypotField } from "@/components/honeypot-field";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import { hasAnyRole } from "@/lib/auth/authorization.ts";
import { getServerAdminSummaryRepository } from "@/lib/repositories/server/admin-summaries.ts";
import { getServerAttendanceRepository } from "@/lib/repositories/server/attendance.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerMemberRepository } from "@/lib/repositories/server/members.ts";
import { getServerReportRepository } from "@/lib/repositories/server/reports.ts";
import { getServerServiceRepository } from "@/lib/repositories/server/services.ts";
import { collectAllPages } from "@/lib/repositories/pagination.ts";
import { deleteServiceReport, setServiceReportApproval } from "../actions";
import styles from "../reports.module.css";

type PageProps = {
  params: Promise<{
    serviceId: string;
  }>;
  searchParams: Promise<{
    created?: string | string[];
    saved?: string | string[];
    updated?: string | string[];
  }>;
};

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
  }).format(new Date(value));

export const dynamic = "force-dynamic";

export default async function ReportOverviewPage({
  params,
  searchParams,
}: PageProps) {
  const { serviceId } = await params;
  const query = await searchParams;
  const saved = takeString(query.saved);
  const created = takeString(query.created);
  const updated = takeString(query.updated);
  const serviceID = Number(serviceId);

  if (!Number.isFinite(serviceID)) {
    notFound();
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  const canDeleteReports = hasAnyRole(actor, ["admin"]);
  const [
    serviceRepository,
    reportRepository,
    attendanceRepository,
    departmentRepository,
    memberRepository,
    adminSummaryRepository,
  ] = await Promise.all([
    getServerServiceRepository(),
    getServerReportRepository(),
    getServerAttendanceRepository(),
    getServerDepartmentRepository(),
    getServerMemberRepository(),
    getServerAdminSummaryRepository(),
  ]);

  try {
    const service = await serviceRepository.findById(serviceID);
    if (!service) notFound();

    const [reports, attendanceRecords, departments, members] = await Promise.all([
      collectAllPages(({ limit, page }) => reportRepository.list({
        limit,
        page,
        serviceId: serviceID,
      })),
      collectAllPages(({ limit, page }) => attendanceRepository.list({
        date: service.date,
        limit,
        page,
        present: true,
      })),
      departmentRepository.findAll(),
      collectAllPages(({ limit, page }) => memberRepository.list({ limit, page })),
    ]);
    const memberById = new Map(members.map((member) => [member.id, member]));
    const departmentNameById = new Map(
      departments.map((department) => [department.id, department.name]),
    );
    const adminSummaries = await adminSummaryRepository.findByIds(
      reports.flatMap((report) => [
        ...(report.submittedById === null ? [] : [report.submittedById]),
        ...(report.approvedById === null ? [] : [report.approvedById]),
      ]),
    );
    const adminSummaryById = new Map(adminSummaries.map((admin) => [admin.id, admin]));
    const reportsByDepartment = new Map<number, (typeof reports)[number]>();

    for (const report of reports) {
      reportsByDepartment.set(report.departmentId, report);
    }

    const attendanceSummary = {
      totalPresent: attendanceRecords.length,
    };

    const attendanceByDepartment = new Map<string, { count: number }>();

    for (const record of attendanceRecords) {
      const member = memberById.get(record.memberId);
      const departmentName =
        member?.departmentId === null || member?.departmentId === undefined
          ? "Unassigned"
          : departmentNameById.get(member.departmentId) ?? "Unassigned";
      const counts = attendanceByDepartment.get(departmentName) ?? { count: 0 };
      counts.count += 1;
      attendanceByDepartment.set(departmentName, counts);
    }

    const departmentStats = departments.map((department) => {
      const totalMembers = members.filter((member) => {
        return member.departmentId === department.id;
      }).length;
      const attendanceCount = attendanceRecords.filter((record) => {
        return memberById.get(record.memberId)?.departmentId === department.id;
      }).length;
      const report = reportsByDepartment.get(department.id);

      return {
        attendanceCount,
        attendanceRate: totalMembers > 0 ? Math.round((attendanceCount / totalMembers) * 1000) / 10 : 0,
        department,
        report,
        totalMembers,
      };
    });

    const pendingDepartments = departments.filter((department) => !reportsByDepartment.has(department.id));

    return (
      <main className={styles.page}>
        <div className={styles.stack}>
        <section className={styles.hero}>
            <p className={styles.eyebrow}>Reports</p>
            <h1 className={styles.title}>{service.name}</h1>
            <p className={styles.lede}>
              {formatDate(service.date)}
              {service.startTime ? ` at ${service.startTime}` : ""} - department reports and attendance summary.
            </p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href={`/admin/reports/services/${service.id}/edit`}>
              Edit Service
            </Link>
              <Link className={styles.secondaryButton} href="/admin/reports">
                Back To Services
              </Link>
              <Link className={styles.primaryButton} href={`/admin/reports/submit?service=${service.id}`}>
                Submit Report
              </Link>
            </div>
          </section>

          {created === "service" ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>Service created successfully.</div>
          ) : null}
          {saved === "1" ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>Service report submitted successfully.</div>
          ) : null}
          {updated === "approved" || updated === "pending" ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>
              Report marked as {updated === "approved" ? "approved" : "pending"}.
            </div>
          ) : null}
          {updated === "deleted" ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>Service report deleted.</div>
          ) : null}

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Key Metrics</h2>
              <div className={styles.stats}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Attendance</span>
                  <span className={styles.statValue}>{attendanceSummary.totalPresent}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Dept Reports</span>
                  <span className={styles.statValue}>{reports.length}</span>
                </div>
              </div>
            </div>
          </section>

          <div className={styles.grid}>
            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Department Reports</h2>
                {reports.length === 0 ? (
                  <div className={styles.emptyState}>No department reports have been submitted for this service yet.</div>
                ) : (
                  <div className={styles.list}>
                    {reports.map((report) => (
                      <article className={styles.reportCard} key={report.id}>
                        <div className={styles.reportHeader}>
                          <div>
                            <span className={styles.serviceName}>
                              {departmentNameById.get(report.departmentId) ?? "Department"}
                            </span>
                            <p className={styles.reportMeta}>
                              {report.submittedById === null
                                ? "Admin"
                                : adminSummaryById.get(report.submittedById)?.name ??
                                  adminSummaryById.get(report.submittedById)?.email ??
                                  "Admin"}
                            </p>
                          </div>
                          <div className={styles.actions}>
                            <span className={`${styles.pill} ${report.isApproved ? styles.pillGreen : styles.pillGold}`}>
                              {report.isApproved ? "Approved" : "Pending"}
                            </span>
                          </div>
                        </div>

                        <div className={styles.actions}>
                          <span className={`${styles.pill} ${styles.pillBlue}`}>{report.departmentAttendance ?? 0} attendance</span>
                          <span className={`${styles.pill} ${styles.pillBlue}`}>{report.volunteersCount ?? 0} volunteers</span>
                        </div>

                        <div className={styles.reportBody}>{report.reportContent}</div>

                        {report.isApproved ? (
                          <p className={styles.reportMeta}>
                            Approved by {report.approvedById === null
                              ? "an administrator"
                              : adminSummaryById.get(report.approvedById)?.name
                                ?? adminSummaryById.get(report.approvedById)?.email
                                ?? "an administrator"}
                            {report.approvedAt ? ` on ${formatDate(report.approvedAt)}` : ""}.
                          </p>
                        ) : null}

                        {report.attachmentUrl ? (
                          <a className={styles.ghostButton} href={report.attachmentUrl} rel="noreferrer" target="_blank">
                            Open Attachment
                          </a>
                        ) : null}

                        <div className={styles.actions}>
                          <form action={setServiceReportApproval}>
                            <HoneypotField />
                            <input name="reportId" type="hidden" value={report.id} />
                            <input name="approval" type="hidden" value={report.isApproved ? "pending" : "approved"} />
                            <button className={styles.secondaryButton} type="submit">
                              {report.isApproved ? "Mark Pending" : "Approve Report"}
                            </button>
                          </form>
                          {canDeleteReports ? (
                            <form action={deleteServiceReport}>
                              <HoneypotField />
                              <input name="reportId" type="hidden" value={report.id} />
                              <label className={styles.deleteConfirmation}>
                                <input name="confirmDelete" required type="checkbox" value="confirmed" />
                                Confirm deletion
                              </label>
                              <button className={styles.dangerButton} type="submit">Delete Report</button>
                            </form>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className={styles.stack}>
              <section className={styles.panel}>
                <div className={styles.panelPad}>
                  <h2 className={styles.panelTitle}>Department Statistics</h2>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Attendance</th>
                          <th>Rate</th>
                          <th>Report</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentStats.map((item) => (
                          <tr key={item.department.id}>
                            <td>{item.department.name}</td>
                            <td>
                              {item.attendanceCount}/{item.totalMembers}
                            </td>
                            <td>{item.attendanceRate}%</td>
                            <td>
                              <span className={`${styles.pill} ${item.report ? styles.pillGreen : styles.pillRed}`}>
                                {item.report ? "Submitted" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelPad}>
                  <h2 className={styles.panelTitle}>Attendance By Department</h2>
                  {attendanceByDepartment.size === 0 ? (
                    <div className={styles.emptyState}>No attendance records were saved for this service date.</div>
                  ) : (
                    <div className={styles.list}>
                      {[...attendanceByDepartment.entries()]
                        .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
                        .map(([name, data]) => (
                          <article className={styles.reportCard} key={name}>
                            <span className={styles.serviceName}>{name}</span>
                            <div className={styles.actions}>
                              <span className={`${styles.pill} ${styles.pillBlue}`}>{data.count} present</span>
                            </div>
                          </article>
                        ))}
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelPad}>
                  <h2 className={styles.panelTitle}>Pending Departments</h2>
                  {pendingDepartments.length === 0 ? (
                    <div className={styles.emptyState}>Every department has submitted a report for this service.</div>
                  ) : (
                    <div className={styles.list}>
                      {pendingDepartments.map((department) => (
                        <article className={styles.reportCard} key={department.id}>
                          <span className={styles.serviceName}>{department.name}</span>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelPad}>
                  <h2 className={styles.panelTitle}>Migration Status</h2>
                  <p className={styles.panelText}>
                    The old Django overview also showed donations, prayer requests, testimonies, events, livestreams, and counseling. Those
                    modules are not part of this operations portal yet, so this overview currently focuses on attendance and department reports.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
