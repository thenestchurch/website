import Link from "next/link";
import { HoneypotField } from "@/components/honeypot-field";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import type { Member } from "@/lib/domain/types.ts";
import { getServerAttendanceRepository } from "@/lib/repositories/server/attendance.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerMemberRepository } from "@/lib/repositories/server/members.ts";
import { collectAllPages } from "@/lib/repositories/pagination.ts";
import { markMemberAsRegular } from "../actions";
import styles from "../members.module.css";

type SearchParams = Promise<{
  updated?: string | string[];
}>;

type CategorizedMember = {
  daysSince?: number;
  departmentName: string;
  lastAttendance?: string;
  member: Member;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDate = (value: string | null | undefined) => {
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

const getDaysSince = (today: Date, value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((today.getTime() - parsed.getTime()) / MS_PER_DAY));
};

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const dynamic = "force-dynamic";

export default async function NewcomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const updated = takeString(params.updated);
  const today = new Date();
  await requireServerAdminActor(["admin", "staff"]);
  const [memberRepository, attendanceRepository, departmentRepository] = await Promise.all([
    getServerMemberRepository(),
    getServerAttendanceRepository(),
    getServerDepartmentRepository(),
  ]);
  const [newcomers, departments] = await Promise.all([
    collectAllPages(({ limit, page }) => memberRepository.list({ isNewComer: true, limit, page })),
    departmentRepository.findAll(),
  ]);
  const newcomerIDs = newcomers.map((member) => member.id);
  const newcomerIDSet = new Set(newcomerIDs);
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
    if (!newcomerIDSet.has(record.memberId) || latestAttendanceByMember.has(record.memberId)) {
      continue;
    }

    latestAttendanceByMember.set(record.memberId, record);
  }

  const currentNewcomers: CategorizedMember[] = [];
  const returningMembers: CategorizedMember[] = [];
  const nonReturningMembers: CategorizedMember[] = [];

  for (const member of newcomers) {
    const lastAttendance = latestAttendanceByMember.get(member.id);
    const departmentName =
      member.departmentId === null
        ? "Unassigned"
        : departmentNameById.get(member.departmentId) ?? "Unassigned";

    if (!lastAttendance?.date) {
      currentNewcomers.push({
        departmentName,
        member,
      });
      continue;
    }

    const daysSince = getDaysSince(today, lastAttendance.date);

    if (daysSince === null) {
      currentNewcomers.push({
        departmentName,
        member,
      });
      continue;
    }

    const row = {
      daysSince,
      departmentName,
      lastAttendance: lastAttendance.date,
      member,
    };

    if (daysSince <= 14) {
      returningMembers.push(row);
    } else {
      nonReturningMembers.push(row);
    }
  }

  const bannerMessage =
    updated === "regular"
      ? "Member marked as regular."
      : updated === "invalid"
        ? "Member update could not be completed."
        : null;

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Members Insights</p>
          <h1 className={styles.title}>Newcomers Report</h1>
          <p className={styles.lede}>
            Track first-time visitors, people who returned within two weeks, and newcomers who now need follow-up.
          </p>
          <div className={styles.actions}>
            <Link className={styles.secondaryButton} href="/admin/members">
              Back To Members
            </Link>
            <Link className={styles.ghostButton} href="/admin/members/absentees">
              Member Absentees
            </Link>
          </div>
        </section>

        {bannerMessage ? (
          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <p className={styles.panelText}>{bannerMessage}</p>
            </div>
          </section>
        ) : null}

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <h2 className={styles.panelTitle}>Summary</h2>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Newcomers</span>
                <span className={styles.statValue}>{newcomers.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Current Newcomers</span>
                <span className={styles.statValue}>{currentNewcomers.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Returning</span>
                <span className={styles.statValue}>{returningMembers.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Non-Returning</span>
                <span className={styles.statValue}>{nonReturningMembers.length}</span>
              </div>
            </div>
          </div>
        </section>

        {[
          {
            empty: "No current newcomers.",
            items: currentNewcomers,
            subtitle: "Never attended service",
            title: "Current Newcomers",
          },
          {
            empty: "No returning newcomers.",
            items: returningMembers,
            subtitle: "Attended within 2 weeks",
            title: "Returning Members",
          },
          {
            empty: "No non-returning newcomers.",
            items: nonReturningMembers,
            subtitle: "Haven't attended in 2+ weeks",
            title: "Non-Returning Members",
          },
        ].map((section) => (
          <section className={styles.panel} key={section.title}>
            <div className={styles.panelPad}>
              <div>
                <h2 className={styles.panelTitle}>{section.title}</h2>
                <p className={styles.panelText}>{section.subtitle}</p>
              </div>

              {section.items.length === 0 ? (
                <div className={styles.emptyState}>{section.empty}</div>
              ) : (
                <div className={styles.threeUp}>
                  {section.items.map((item) => (
                    <article className={styles.insightCard} key={item.member.id}>
                      <div className={styles.insightTop}>
                        <div className={styles.insightMain}>
                          <span className={styles.memberName}>{item.member.fullName}</span>
                          <p className={styles.insightMeta}>{item.member.email || item.member.phoneNumber || "No contact details"}</p>
                          <p className={styles.insightMeta}>Department: {item.departmentName}</p>
                          <p className={styles.insightMeta}>Joined: {formatDate(item.member.dateJoined)}</p>
                          {item.lastAttendance ? (
                            <p className={styles.insightMeta}>
                              Last attended: {formatDate(item.lastAttendance)}
                              {typeof item.daysSince === "number" ? ` (${item.daysSince} day${item.daysSince === 1 ? "" : "s"} ago)` : ""}
                            </p>
                          ) : null}
                        </div>
                        <span className={`${styles.pill} ${section.title === "Non-Returning Members" ? styles.pillRed : styles.pillGold}`}>
                          {section.title === "Current Newcomers"
                            ? "New"
                            : section.title === "Returning Members"
                              ? "Returning"
                              : "Follow-up"}
                        </span>
                      </div>

                      <div className={styles.actions}>
                        <Link className={styles.secondaryButton} href={`/admin/members/${item.member.id}`}>
                          View Details
                        </Link>
                        <form action={markMemberAsRegular} className={styles.inlineForm}>
                          <HoneypotField />
                          <input name="memberId" type="hidden" value={item.member.id} />
                          <input name="returnTo" type="hidden" value="/admin/members/newcomers" />
                          <button className={styles.inlineButton} type="submit">
                            Mark As Regular
                          </button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
