import Link from "next/link";
import { AdminPagination } from "@/components/admin-pagination";
import { hasAnyRole } from "@/lib/auth/authorization";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import type { Member } from "@/lib/domain/types";
import { getServerAttendanceRepository } from "@/lib/repositories/server/attendance";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { getServerMemberRepository } from "@/lib/repositories/server/members";
import { collectAllPages } from "@/lib/repositories/pagination";
import styles from "./page.module.css";

type SearchParams = Promise<{
  department?: string | string[];
  query?: string | string[];
  reference?: string | string[];
  weeks?: string | string[];
  page?: string | string[];
}>;

type AbsenteeRow = {
  departmentName: string;
  joinedDate?: string | null;
  lastPresentDate?: string | null;
  member: Member;
  reason: "never-attended" | "weeks-absent";
  weeksAbsent: number;
};

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const todayValue = new Date().toISOString().slice(0, 10);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDateValue = (value: string | null | undefined) => {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(parsed);
};

const clampWeeks = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return 3;
  }

  return Math.min(24, Math.max(1, parsed));
};

const clampPage = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

const getDepartmentName = (
  departmentId: number | null,
  departmentNames: ReadonlyMap<number, string>,
) => departmentNames.get(departmentId ?? -1) ?? "Unassigned";

const parseEntityId = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const weeksBetween = (later: Date, earlier: Date) =>
  Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY / 7));

export const dynamic = "force-dynamic";

export default async function AttendanceAbsenteesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedDepartment = takeString(params.department);
  const query = takeString(params.query) ?? "";
  const referenceDate = takeString(params.reference) ?? todayValue;
  const weeks = clampWeeks(takeString(params.weeks));
  const currentPage = clampPage(takeString(params.page));
  const pageSize = 25;
  const reference = new Date(referenceDate);
  const cutoff = new Date(reference);
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const requestedDepartmentId = parseEntityId(requestedDepartment);

  const actor = await requireServerAdminActor(["admin", "staff", "absentee-viewer"]);
  const canManageAttendance = hasAnyRole(actor, ["admin", "staff"]);
  const [departmentRepository, memberRepository, attendanceRepository] = await Promise.all([
    getServerDepartmentRepository(),
    getServerMemberRepository(),
    getServerAttendanceRepository(),
  ]);
  const [departments, members] = await Promise.all([
    departmentRepository.findActive(),
    collectAllPages(({ limit, page }) => memberRepository.list({
      departmentId: requestedDepartmentId,
      limit,
      page,
      query,
    })),
  ]);
  const departmentNames = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const selectedDepartment = requestedDepartmentId
    ? departments.find((department) => department.id === requestedDepartmentId)
    : undefined;
  const attendanceRecords = await collectAllPages(({ limit, page }) => attendanceRepository.list({
    limit,
    page,
    present: true,
  }));

  const latestPresentByMember = new Map<number, (typeof attendanceRecords)[number]>();
  for (const record of attendanceRecords) {
    if (!latestPresentByMember.has(record.memberId)) {
      latestPresentByMember.set(record.memberId, record);
    }
  }

  const absenteeRows: AbsenteeRow[] = [];

  for (const member of members) {
    const lastPresent = latestPresentByMember.get(member.id);
    const departmentName = getDepartmentName(member.departmentId, departmentNames);

    if (lastPresent?.date) {
      const lastDate = new Date(lastPresent.date);

      if (Number.isNaN(lastDate.getTime()) || lastDate > cutoff) {
        continue;
      }

      absenteeRows.push({
        departmentName,
        joinedDate: member.dateJoined,
        lastPresentDate: lastPresent.date,
        member,
        reason: "weeks-absent",
        weeksAbsent: weeksBetween(reference, lastDate),
      });

      continue;
    }

    if (member.dateJoined) {
      const joinedDate = new Date(member.dateJoined);

      if (!Number.isNaN(joinedDate.getTime()) && joinedDate <= cutoff) {
        absenteeRows.push({
          departmentName,
          joinedDate: member.dateJoined,
          lastPresentDate: null,
          member,
          reason: "never-attended",
          weeksAbsent: weeksBetween(reference, joinedDate),
        });
      }

      continue;
    }

    absenteeRows.push({
      departmentName,
      joinedDate: null,
      lastPresentDate: null,
      member,
      reason: "never-attended",
      weeksAbsent: weeks,
    });
  }

  absenteeRows.sort((left, right) => {
    if (right.weeksAbsent !== left.weeksAbsent) {
      return right.weeksAbsent - left.weeksAbsent;
    }

    return (left.member.fullName ?? "").localeCompare(right.member.fullName ?? "");
  });

  const summary = {
    absentees: absenteeRows.length,
    neverAttended: absenteeRows.filter((row) => row.reason === "never-attended").length,
    thresholdWeeks: weeks,
    totalMembers: members.length,
  };

  const departmentBreakdown = [...absenteeRows.reduce((map, row) => {
    map.set(row.departmentName, (map.get(row.departmentName) ?? 0) + 1);
    return map;
  }, new Map<string, number>()).entries()]
    .map(([name, count]) => ({ count, name }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 8);
  const totalRows = absenteeRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = absenteeRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Internal Operations</p>
          <h1 className={styles.title}>Absentee Tracking</h1>
          <p className={styles.lede}>
            Surface members who have not been in church for weeks, including people who joined earlier but still have
            no recorded attendance.
          </p>
          {canManageAttendance ? (
            <div className={styles.actions}>
              <Link className={styles.secondaryButton} href="/admin/attendance">
                Back To Register
              </Link>
              <Link className={styles.secondaryButton} href="/admin/attendance/phone-export">
                Export Phones
              </Link>
            </div>
          ) : null}
        </section>

        <div className={styles.grid}>
          <aside className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Tracker Filters</h2>
                <p className={styles.panelText}>Adjust the threshold window, reference date, and department scope.</p>
                <form action="/admin/attendance/absentees" className={styles.form} method="get">
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="reference">
                      Reference Date
                    </label>
                    <input
                      className={styles.input}
                      defaultValue={referenceDate}
                      id="reference"
                      name="reference"
                      type="date"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="weeks">
                      Weeks Absent
                    </label>
                    <input
                      className={styles.input}
                      defaultValue={weeks}
                      id="weeks"
                      max={24}
                      min={1}
                      name="weeks"
                      type="number"
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

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="query">
                      Member Search
                    </label>
                    <input
                      className={styles.input}
                      defaultValue={query}
                      id="query"
                      name="query"
                      placeholder="Name, email, or phone"
                      type="search"
                    />
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.primaryButton} type="submit">
                      Run Tracker
                    </button>
                    {canManageAttendance ? (
                      <Link className={styles.secondaryButton} href="/admin/attendance">
                        Back To Register
                      </Link>
                    ) : null}
                  </div>
                </form>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Absentee Snapshot</h2>
                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Reference Date</span>
                    <span className={styles.statValue}>{formatDateValue(referenceDate)}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Threshold</span>
                    <span className={styles.statValue}>{summary.thresholdWeeks} weeks</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Department Filter</span>
                    <span className={styles.statValue}>{selectedDepartment?.name ?? "All"}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Absentees Found</span>
                    <span className={styles.statValue}>{summary.absentees}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Never Attended</span>
                    <span className={styles.statValue}>{summary.neverAttended}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Visible Members</span>
                    <span className={styles.statValue}>{summary.totalMembers}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Department Hotspots</h2>
                {departmentBreakdown.length === 0 ? (
                  <p className={styles.panelText}>No absentee matches under the current filters.</p>
                ) : (
                  <div className={styles.breakdown}>
                    {departmentBreakdown.map((item) => (
                      <div className={styles.breakdownRow} key={item.name}>
                        <span className={styles.breakdownLabel}>{item.name}</span>
                        <span className={styles.breakdownValue}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </aside>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Members Missing For Weeks</h2>
              <p className={styles.panelText}>
                Members appear here when their last recorded present attendance is older than {weeks} weeks from{" "}
                {formatDateValue(referenceDate)}, or when they joined before the cutoff and still have no present
                attendance.
              </p>

              {canManageAttendance ? (
                <div className={styles.actions}>
                  <Link
                    className={styles.ghostButton}
                    href="/admin/attendance"
                  >
                    Open Attendance Records
                  </Link>
                  <Link className={styles.ghostButton} href="/admin/members">
                    Open Members
                  </Link>
                </div>
              ) : null}

              {absenteeRows.length === 0 ? (
                <div className={styles.emptyState}>No absentee members matched the current tracker settings.</div>
              ) : (
                <>
                  <AdminPagination
                    currentPage={safePage}
                    pageSize={pageSize}
                    pathname="/admin/attendance/absentees"
                    searchParams={{
                      department: requestedDepartment ?? "",
                      query,
                      reference: referenceDate,
                      weeks: String(weeks),
                    }}
                    totalItems={totalRows}
                  />
                  <div className={styles.tableShell}>
                    <div className={styles.tableLead}>
                      <div>
                        <span className={styles.tableLeadLabel}>Visible rows</span>
                        <strong className={styles.tableLeadValue}>{pagedRows.length}</strong>
                      </div>
                      <div>
                        <span className={styles.tableLeadLabel}>Current page</span>
                        <strong className={styles.tableLeadValue}>
                          {safePage} of {totalPages}
                        </strong>
                      </div>
                    </div>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Weeks Away</th>
                            <th>Last Present</th>
                            <th>Date Joined</th>
                            <th>Contact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRows.map((row) => {
                            const pillClass =
                              row.reason === "never-attended"
                                ? `${styles.pill} ${styles.pillNew}`
                                : row.weeksAbsent >= weeks + 4
                                  ? `${styles.pill} ${styles.pillHigh}`
                                  : `${styles.pill} ${styles.pillMedium}`;

                            const statusLabel =
                              row.reason === "never-attended" ? "No attendance yet" : `Away for ${row.weeksAbsent} weeks`;

                            return (
                              <tr key={row.member.id}>
                                <td>
                                  <span className={styles.memberName}>{row.member.fullName}</span>
                                  <span className={styles.memberMeta}>
                                    {row.member.isNewComer ? "Newcomer" : "Existing member"}
                                  </span>
                                </td>
                                <td>{row.departmentName}</td>
                                <td>
                                  <span className={pillClass}>{statusLabel}</span>
                                </td>
                                <td>{row.weeksAbsent}</td>
                                <td>{formatDateValue(row.lastPresentDate)}</td>
                                <td>{formatDateValue(row.joinedDate)}</td>
                                <td className={styles.contactCell}>
                                  <span className={styles.contactPrimary}>
                                    {row.member.phoneNumber || row.member.whatsappNumber || row.member.email || "No contact details"}
                                  </span>
                                  {row.member.phoneNumber && row.member.whatsappNumber && row.member.phoneNumber !== row.member.whatsappNumber ? (
                                    <span className={styles.contactSecondary}>{row.member.whatsappNumber}</span>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
