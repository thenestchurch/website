import Link from "next/link";
import { AdminPagination } from "@/components/admin-pagination";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import type { Member } from "@/lib/domain/types.ts";
import { getServerAttendanceRepository } from "@/lib/repositories/server/attendance.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerMemberRepository } from "@/lib/repositories/server/members.ts";
import { collectAllPages } from "@/lib/repositories/pagination.ts";
import styles from "../members.module.css";

type SearchParams = Promise<{
  page?: string | string[];
}>;

type AbsenteeRow = {
  daysAbsent: number | null;
  departmentName: string;
  lastAttendance: string | null;
  member: Member;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Never attended";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(parsed);
};

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

export default async function MemberAbsenteesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentPage = clampPage(takeString((await searchParams).page));
  const pageSize = 24;
  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  await requireServerAdminActor(["admin", "staff"]);
  const [memberRepository, attendanceRepository, departmentRepository] = await Promise.all([
    getServerMemberRepository(),
    getServerAttendanceRepository(),
    getServerDepartmentRepository(),
  ]);
  const [allMembers, departments] = await Promise.all([
    collectAllPages(({ limit, page }) => memberRepository.list({ limit, page })),
    departmentRepository.findAll(),
  ]);
  const members = allMembers.filter((member) => !member.isNewComer);
  const memberIDs = members.map((member) => member.id);
  const memberIDSet = new Set(memberIDs);
  const attendanceRecords = await collectAllPages(({ limit, page }) => attendanceRepository.list({
    limit,
    page,
    present: true,
  }));
  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name]),
  );
  const latestAttendanceByMember = new Map<number, (typeof attendanceRecords)[number]>();

  for (const record of attendanceRecords) {
    if (!memberIDSet.has(record.memberId) || latestAttendanceByMember.has(record.memberId)) {
      continue;
    }

    latestAttendanceByMember.set(record.memberId, record);
  }

  const absentees: AbsenteeRow[] = [];

  for (const member of members) {
    const lastAttendance = latestAttendanceByMember.get(member.id);

    if (!lastAttendance?.date) {
      absentees.push({
        daysAbsent: null,
        departmentName:
          member.departmentId === null
            ? "Unassigned"
            : departmentNameById.get(member.departmentId) ?? "Unassigned",
        lastAttendance: null,
        member,
      });
      continue;
    }

    const parsedDate = new Date(lastAttendance.date);

    if (Number.isNaN(parsedDate.getTime()) || parsedDate >= twoWeeksAgo) {
      continue;
    }

    absentees.push({
      daysAbsent: Math.max(0, Math.floor((today.getTime() - parsedDate.getTime()) / MS_PER_DAY)),
      departmentName:
        member.departmentId === null
          ? "Unassigned"
          : departmentNameById.get(member.departmentId) ?? "Unassigned",
      lastAttendance: lastAttendance.date,
      member,
    });
  }

  absentees.sort((left, right) => {
    if (left.daysAbsent === null && right.daysAbsent !== null) {
      return -1;
    }

    if (left.daysAbsent !== null && right.daysAbsent === null) {
      return 1;
    }

    if ((right.daysAbsent ?? 0) !== (left.daysAbsent ?? 0)) {
      return (right.daysAbsent ?? 0) - (left.daysAbsent ?? 0);
    }

    return (left.member.fullName ?? "").localeCompare(right.member.fullName ?? "");
  });
  const totalPages = Math.max(1, Math.ceil(absentees.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleAbsentees = absentees.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Members Insights</p>
          <h1 className={styles.title}>Absentee Report</h1>
          <p className={styles.lede}>
            Members who have been away for more than two weeks, excluding newcomers, so the follow-up list stays focused.
          </p>
          <div className={styles.actions}>
            <Link className={styles.secondaryButton} href="/admin/members">
              Back To Members
            </Link>
            <Link className={styles.ghostButton} href="/admin/members/newcomers">
              Newcomers
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>Summary</h2>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Members Needing Follow-Up</span>
                <span className={styles.statValue}>{absentees.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Threshold</span>
                <span className={styles.statValue}>2 weeks</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>Follow-Up List</h2>
            <p className={styles.panelText}>Regular members who have not been present in church for at least two weeks.</p>

            {absentees.length === 0 ? (
              <div className={styles.emptyState}>All regular members have attended within the last two weeks.</div>
            ) : (
              <>
                <AdminPagination
                  currentPage={safePage}
                  pageSize={pageSize}
                  pathname="/admin/members/absentees"
                  totalItems={absentees.length}
                />
                <div className={styles.insightGrid}>
                {visibleAbsentees.map((row) => (
                  <article className={styles.insightCard} key={row.member.id}>
                    <div className={styles.insightTop}>
                      <div className={styles.insightMain}>
                        <span className={styles.memberName}>{row.member.fullName}</span>
                        <p className={styles.insightMeta}>{row.member.email || "No email"}</p>
                        <p className={styles.insightMeta}>{row.member.phoneNumber || row.member.whatsappNumber || "No phone"}</p>
                        <p className={styles.insightMeta}>Department: {row.departmentName}</p>
                      </div>
                      <span className={`${styles.pill} ${styles.pillRed}`}>
                        {row.daysAbsent === null ? "Never attended" : `${row.daysAbsent} days away`}
                      </span>
                    </div>

                    <div className={styles.actions}>
                      <span className={styles.memberMeta}>Last seen: {formatDate(row.lastAttendance)}</span>
                      <Link className={styles.secondaryButton} href={`/admin/members/${row.member.id}`}>
                        View Member
                      </Link>
                    </div>
                  </article>
                ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
