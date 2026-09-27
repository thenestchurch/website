import Link from "next/link";
import { AdminPagination } from "@/components/admin-pagination";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerMemberRepository } from "@/lib/repositories/server/members.ts";
import { collectAllPages } from "@/lib/repositories/pagination.ts";
import styles from "./members.module.css";

type SearchParams = Promise<{
  department?: string | string[];
  q?: string | string[];
  page?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const clampPage = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = takeString(params.q) ?? "";
  const requestedDepartment = takeString(params.department);
  const currentPage = clampPage(takeString(params.page));
  const pageSize = 25;
  await requireServerAdminActor(["admin", "staff"]);
  const [departmentRepository, memberRepository] = await Promise.all([
    getServerDepartmentRepository(),
    getServerMemberRepository(),
  ]);
  const departments = await departmentRepository.findActive();
  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const selectedDepartment = requestedDepartment
    ? departments.find((department) => String(department.id) === requestedDepartment)
    : undefined;

  const members = await collectAllPages(({ limit, page }) => memberRepository.list({
    departmentId: selectedDepartment?.id,
    limit,
    page,
    query,
  }));
  const totalMembers = members.length;
  const totalPages = Math.max(1, Math.ceil(totalMembers / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedMembers = members.slice((safePage - 1) * pageSize, safePage * pageSize);
  const stats = {
    newcomers: members.filter((member) => Boolean(member.isNewComer)).length,
    total: totalMembers,
    withBirthdays: members.filter((member) => Boolean(member.dateOfBirth)).length,
  };

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Members</p>
          <h1 className={styles.title}>Member List</h1>
          <p className={styles.lede}>
            Manage the church directory, search members quickly, and open the same detail flow the old Django portal
            provided.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/admin/members/birthdays">
              Birthdays
            </Link>
            <Link className={styles.secondaryButton} href="/admin/members/newcomers">
              Newcomers
            </Link>
            <Link className={styles.secondaryButton} href="/admin/members/absentees">
              Absentee Report
            </Link>
            <Link className={styles.ghostButton} href="/admin/attendance">
              Attendance Register
            </Link>
          </div>
        </section>

        <div className={styles.grid}>
          <aside className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Search Members</h2>
                <p className={styles.panelText}>Search by name or email and optionally narrow the list by department.</p>
                <form action="/admin/members" className={styles.form} method="get">
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="q">
                      Search
                    </label>
                    <input
                      className={styles.input}
                      defaultValue={query}
                      id="q"
                      name="q"
                      placeholder="First name, last name, email"
                      type="search"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="department">
                      Department
                    </label>
                    <select
                      className={styles.select}
                      defaultValue={requestedDepartment ?? ""}
                      id="department"
                      name="department"
                    >
                      <option value="">All departments</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.primaryButton} type="submit">
                      Filter Members
                    </button>
                    <Link className={styles.ghostButton} href="/admin/members">
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
                    <span className={styles.statLabel}>Visible Members</span>
                    <span className={styles.statValue}>{stats.total}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Newcomers</span>
                    <span className={styles.statValue}>{stats.newcomers}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Birthdays Saved</span>
                    <span className={styles.statValue}>{stats.withBirthdays}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Department</span>
                    <span className={styles.statValue}>{selectedDepartment?.name ?? "All"}</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Directory</h2>
              <p className={styles.panelText}>
                {members.length} member{members.length === 1 ? "" : "s"} matched the current filter.
              </p>

              {members.length === 0 ? (
                <div className={styles.emptyState}>No members matched the current filters.</div>
              ) : (
                <>
                  <AdminPagination
                    currentPage={safePage}
                    pageSize={pageSize}
                    pathname="/admin/members"
                    searchParams={{
                      department: requestedDepartment ?? "",
                      q: query,
                    }}
                    totalItems={totalMembers}
                  />
                  <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedMembers.map((member) => (
                        <tr key={member.id}>
                          <td>
                            <span className={styles.memberName}>{member.fullName}</span>
                            <span className={styles.memberMeta}>
                              Joined {member.dateJoined ? new Date(member.dateJoined).toLocaleDateString("en-NG") : "Unknown"}
                            </span>
                          </td>
                          <td>{member.email || member.phoneNumber || member.whatsappNumber || "No contact details"}</td>
                          <td>{
                            member.departmentId === null
                              ? "Unassigned"
                              : departmentNameById.get(member.departmentId) ?? "Unassigned"
                          }</td>
                          <td>
                            <span
                              className={`${styles.pill} ${member.isNewComer ? styles.pillGold : styles.pillDark}`}
                            >
                              {member.isNewComer ? "Newcomer" : "Regular member"}
                            </span>
                          </td>
                          <td>
                            <Link className={styles.secondaryButton} href={`/admin/members/${member.id}`}>
                              View Member
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
