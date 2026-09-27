import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerMemberRepository } from "@/lib/repositories/server/members.ts";
import { collectAllPages } from "@/lib/repositories/pagination.ts";
import styles from "./departments.module.css";

type SearchParams = Promise<{
  q?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = (takeString((await searchParams).q) ?? "").trim().toLowerCase();
  await requireServerAdminActor(["admin", "staff"]);
  const [departmentRepository, memberRepository] = await Promise.all([
    getServerDepartmentRepository(),
    getServerMemberRepository(),
  ]);

  const [allDepartments, members] = await Promise.all([
    departmentRepository.findAll(),
    collectAllPages(({ limit, page }) => memberRepository.list({ limit, page })),
  ]);

  const departments = allDepartments.filter((department) => {
    if (!query) {
      return true;
    }

    return (
      department.name.toLowerCase().includes(query) ||
      (department.reportingChannel ?? "").toLowerCase().includes(query) ||
      (department.description ?? "").toLowerCase().includes(query)
    );
  });

  const reportingChannels = new Set(
    departments.map((department) => department.reportingChannel?.trim()).filter(Boolean),
  );

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Departments</p>
          <h1 className={styles.title}>Department Management</h1>
          <p className={styles.lede}>Manage department structure, member groupings, and reporting channels in one place.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/admin/departments/new">
              New Department
            </Link>
            <Link className={styles.primaryButton} href="/admin/departments/report">
              Department Report
            </Link>
            <Link className={styles.ghostButton} href="/admin/reports">
              Service Reports
            </Link>
          </div>
        </section>

        <div className={styles.grid}>
          <aside className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Search Departments</h2>
                <p className={styles.panelText}>Search by department name, reporting channel, or description.</p>
                <form action="/admin/departments" className={styles.form} method="get">
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="q">
                      Search
                    </label>
                    <input className={styles.input} defaultValue={query} id="q" name="q" placeholder="Choir, media, WhatsApp..." type="search" />
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.primaryButton} type="submit">
                      Filter
                    </button>
                    <Link className={styles.ghostButton} href="/admin/departments">
                      Reset
                    </Link>
                  </div>
                </form>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Snapshot</h2>
                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Departments</span>
                    <span className={styles.statValue}>{departments.length}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Members</span>
                    <span className={styles.statValue}>{members.length}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Channels</span>
                    <span className={styles.statValue}>{reportingChannels.size}</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Department List</h2>
              {departments.length === 0 ? (
                <div className={styles.emptyState}>No departments matched the current search.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Department</th>
                        <th>Reporting Channel</th>
                        <th>Members</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((department) => {
                        const memberCount = members.filter((member) => {
                          return member.departmentId === department.id;
                        }).length;

                        return (
                          <tr key={department.id}>
                            <td>#{department.id}</td>
                            <td>
                              <span className={styles.memberName}>{department.name}</span>
                              <span className={styles.memberMeta}>{department.description || "No description provided"}</span>
                            </td>
                            <td>
                              <span className={`${styles.pill} ${styles.pillBlue}`}>{department.reportingChannel || "Not specified"}</span>
                            </td>
                            <td>
                              <span className={`${styles.pill} ${styles.pillGreen}`}>{memberCount} members</span>
                            </td>
                            <td>
                              <Link className={styles.secondaryButton} href={`/admin/departments/${department.id}`}>
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
