import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import type { Member } from "@/lib/domain/types";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { getServerMediaRepository } from "@/lib/repositories/server/media";
import { getServerMemberRepository } from "@/lib/repositories/server/members";
import { collectAllPages } from "@/lib/repositories/pagination";
import styles from "../members.module.css";

type SearchParams = Promise<{
  month?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const months = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const parseMonth = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 12) {
    return new Date().getMonth() + 1;
  }

  return parsed;
};

const getBirthMonth = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getMonth() + 1;
};

const getBirthDay = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getDate();
};

const formatBirthDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
  }).format(date);
};

const getLagosToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Lagos",
    year: "numeric",
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    day: Number(lookup.day),
    month: Number(lookup.month),
  };
};

const getInitials = (member: Member) =>
  `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "M";

export const dynamic = "force-dynamic";

export default async function MemberBirthdaysPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedMonth = parseMonth(takeString(params.month));
  const selectedMonthName = months.find((month) => month.value === selectedMonth)?.label ?? "Current Month";
  const today = getLagosToday();
  const actor = await requireServerAdminActor(["admin", "staff"]);
  const [memberRepository, departmentRepository, mediaRepository] = await Promise.all([
    getServerMemberRepository(),
    getServerDepartmentRepository(),
    getServerMediaRepository(actor),
  ]);
  const [memberPage, departments] = await Promise.all([
    collectAllPages(({ limit, page }) => memberRepository.list({ limit, page })),
    departmentRepository.findAll(),
  ]);
  const members = memberPage
    .filter((member) => getBirthMonth(member.dateOfBirth) === selectedMonth)
    .sort((left, right) => {
      const leftDay = getBirthDay(left.dateOfBirth) ?? 0;
      const rightDay = getBirthDay(right.dateOfBirth) ?? 0;
      return leftDay - rightDay || (left.fullName ?? "").localeCompare(right.fullName ?? "");
    });
  const todayMembers = selectedMonth === today.month
    ? members.filter((member) => getBirthDay(member.dateOfBirth) === today.day)
    : [];
  const upcomingMembers = selectedMonth === today.month
    ? members.filter((member) => (getBirthDay(member.dateOfBirth) ?? 0) > today.day)
    : members;
  const pastMembers = selectedMonth === today.month
    ? members.filter((member) => (getBirthDay(member.dateOfBirth) ?? 0) < today.day)
    : [];
  const mediaIds = [...new Set(members.map((member) => member.profilePictureId).filter((id): id is number => id !== null))];
  const mediaAssets = await Promise.all(mediaIds.map((id) => mediaRepository.findById(id)));
  const mediaUrls = new Map(mediaAssets.filter(Boolean).map((media) => [media!.id, media!.url]));
  const departmentNames = new Map(departments.map((department) => [department.id, department.name]));

  const renderBirthdayCard = (member: Member) => {
    const profileUrl = (member.profilePictureId === null ? null : mediaUrls.get(member.profilePictureId))
      ?? member.legacyProfilePictureUrl;

    return (
      <article className={styles.birthdayCard} key={member.id}>
        <div className={styles.birthdayHead}>
          <div className={styles.birthdayAvatar}>
            {profileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={member.fullName ?? "Member"} src={profileUrl} />
            ) : (
              <span>{getInitials(member)}</span>
            )}
          </div>
          <div>
            <span className={styles.memberName}>{member.fullName}</span>
            <span className={styles.memberMeta}>{formatBirthDate(member.dateOfBirth)}</span>
          </div>
          <div className={styles.birthdayBadge}>{getBirthDay(member.dateOfBirth) ?? "-"}</div>
        </div>
        <span className={`${styles.pill} ${styles.pillDark}`}>
          {member.departmentId === null ? "No department" : departmentNames.get(member.departmentId) ?? "No department"}
        </span>
        <div className={styles.detailList}>
          <div className={styles.detailRow}>
            <span className={styles.detailTerm}>Email</span>
            <span className={styles.detailValue}>{member.email || "-"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailTerm}>Phone</span>
            <span className={styles.detailValue}>{member.phoneNumber || member.whatsappNumber || "-"}</span>
          </div>
        </div>
        <Link className={styles.primaryButton} href={`/admin/members/${member.id}`}>
          View Profile
        </Link>
      </article>
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Members</p>
          <h1 className={styles.title}>Birthday Dashboard</h1>
          <p className={styles.lede}>Celebrate members with birthdays in {selectedMonthName}, grouped for daily follow-up.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/admin/members/birthdays/settings">
              Email Settings
            </Link>
            <Link className={styles.primaryButton} href="/admin/members/birthdays/logs">
              Delivery Logs
            </Link>
            <Link className={styles.secondaryButton} href="/admin/members">
              Back To Members
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <div className={styles.actions} style={{ justifyContent: "space-between" }}>
              <form action="/admin/members/birthdays" className={styles.form} method="get" style={{ maxWidth: 260 }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="month">
                    Month
                  </label>
                  <select className={styles.select} defaultValue={selectedMonth} id="month" name="month">
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button className={styles.primaryButton} type="submit">
                  View Birthdays
                </button>
              </form>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>{selectedMonthName}</span>
                <span className={styles.statValue}>{members.length}</span>
              </div>
            </div>

            {members.length === 0 ? (
              <div className={styles.emptyState}>No birthdays were found for {selectedMonthName}.</div>
            ) : (
              <div className={styles.stack}>
                {todayMembers.length > 0 ? (
                  <section className={styles.stack}>
                    <h2 className={styles.panelTitle}>Today</h2>
                    <div className={styles.monthGrid}>{todayMembers.map(renderBirthdayCard)}</div>
                  </section>
                ) : null}
                <section className={styles.stack}>
                  <h2 className={styles.panelTitle}>{selectedMonth === today.month ? "Upcoming" : selectedMonthName}</h2>
                  {upcomingMembers.length === 0 ? (
                    <div className={styles.emptyState}>No upcoming birthdays for the selected month.</div>
                  ) : (
                    <div className={styles.monthGrid}>{upcomingMembers.map(renderBirthdayCard)}</div>
                  )}
                </section>
                {pastMembers.length > 0 ? (
                  <section className={styles.stack}>
                    <h2 className={styles.panelTitle}>Earlier This Month</h2>
                    <div className={styles.monthGrid}>{pastMembers.map(renderBirthdayCard)}</div>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
