import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import { getServerAttendanceRepository } from "@/lib/repositories/server/attendance.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerMemberRepository } from "@/lib/repositories/server/members.ts";
import { collectAllPages } from "@/lib/repositories/pagination.ts";
import styles from "../departments.module.css";

export const dynamic = "force-dynamic";

export default async function DepartmentReportPage() {
  await requireServerAdminActor(["admin", "staff"]);
  const [departmentRepository, memberRepository, attendanceRepository] = await Promise.all([
    getServerDepartmentRepository(),
    getServerMemberRepository(),
    getServerAttendanceRepository(),
  ]);

  const [departments, members, attendanceRecords] = await Promise.all([
    departmentRepository.findAll(),
    collectAllPages(({ limit, page }) => memberRepository.list({ limit, page })),
    collectAllPages(({ limit, page }) => attendanceRepository.list({ limit, page, present: true })),
  ]);
  const memberById = new Map(members.map((member) => [member.id, member]));

  const rows = departments.map((department) => {
    const departmentMembers = members.filter((member) => {
      return member.departmentId === department.id;
    });

    const presentMemberIDs = new Set<number>();

    for (const record of attendanceRecords) {
      const member = memberById.get(record.memberId);
      if (!member) continue;

      if (member.departmentId === department.id) {
        presentMemberIDs.add(member.id);
      }
    }

    const attendanceRate = departmentMembers.length
      ? Math.round((presentMemberIDs.size / departmentMembers.length) * 1000) / 10
      : 0;

    return {
      attendanceRate,
      department,
      memberCount: departmentMembers.length,
      presentCount: presentMemberIDs.size,
    };
  });

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Departments</p>
          <h1 className={styles.title}>Department Report</h1>
          <p className={styles.lede}>Cross-department summary of member count, attendance reach, and reporting channels.</p>
          <div className={styles.actions}>
            <Link className={styles.secondaryButton} href="/admin/departments">
              Back To Departments
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>Department Summary Table</h2>
            {rows.length === 0 ? (
              <div className={styles.emptyState}>No departments are available yet.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Number Of Members</th>
                      <th>Attendance Rate</th>
                      <th>Reporting Channel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.department.id}>
                        <td>
                          <span className={styles.memberName}>{row.department.name}</span>
                        </td>
                        <td>{row.memberCount}</td>
                        <td>{row.attendanceRate}%</td>
                        <td>{row.department.reportingChannel || "Not specified"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
