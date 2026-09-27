import Link from "next/link";
import { notFound } from "next/navigation";
import { hasAnyRole } from "@/lib/auth/authorization";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import type { Member } from "@/lib/domain/types";
import { getServerAttendanceRepository } from "@/lib/repositories/server/attendance";
import { getServerMediaRepository } from "@/lib/repositories/server/media";
import { getServerMemberRepository } from "@/lib/repositories/server/members";
import { getServerServiceRepository } from "@/lib/repositories/server/services";
import styles from "../members.module.css";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    updated?: string | string[];
  }>;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(date);
};

const getInitials = (member: Member) =>
  `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "M";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const updatedValue = await searchParams;
  const memberID = Number(id);

  if (!Number.isFinite(memberID)) {
    notFound();
  }

  const actor = await requireServerAdminActor(["admin", "staff", "absentee-viewer"]);
  const canManageMembers = hasAnyRole(actor, ["admin", "staff"]);

  try {
    const [memberRepository, attendanceRepository, serviceRepository, mediaRepository] = await Promise.all([
      getServerMemberRepository(),
      getServerAttendanceRepository(),
      getServerServiceRepository(),
      getServerMediaRepository(actor),
    ]);
    const [member, attendancePage, services] = await Promise.all([
      memberRepository.findById(memberID),
      attendanceRepository.list({ limit: 500, memberId: memberID, page: 1 }),
      serviceRepository.findAll(),
    ]);
    if (!member) notFound();
    const media = member.profilePictureId === null ? null : await mediaRepository.findById(member.profilePictureId);
    const mediaUrl = media?.url ?? member.legacyProfilePictureUrl;
    const attendanceRecords = attendancePage.docs;
    const servicesById = new Map(services.map((service) => [service.id, service.name]));

    return (
      <main className={styles.page}>
        <div className={styles.stack}>
          {(Array.isArray(updatedValue.updated) ? updatedValue.updated[0] : updatedValue.updated) === "1" ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>Member details updated.</div>
          ) : null}
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Members</p>
            <h1 className={styles.title}>{member.fullName}</h1>
            <p className={styles.lede}>Member details and attendance records from the custom church management portal.</p>
            <div className={styles.actions}>
              <Link className={styles.secondaryButton} href={canManageMembers ? "/admin/members" : "/admin/attendance/absentees"}>
                {canManageMembers ? "Back To Members" : "Back To Absentees"}
              </Link>
              {canManageMembers ? (
                <>
                  <Link className={styles.primaryButton} href={`/admin/members/${member.id}/edit`}>
                    Edit Member
                  </Link>
                  <Link className={styles.ghostButton} href="/admin/attendance">
                    Attendance Register
                  </Link>
                </>
              ) : null}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.profileHeader} />
            <div className={styles.profileBody}>
              <div className={styles.avatarRow}>
                <div className={styles.avatar}>
                  {mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={member.fullName ?? "Member"} src={mediaUrl} />
                  ) : (
                    <span>{getInitials(member)}</span>
                  )}
                </div>
                <div className={styles.profileCopy}>
                  <h2>{member.fullName}</h2>
                  <p>{member.email || member.phoneNumber || member.whatsappNumber || "No contact details"}</p>
                  {member.nickname ? <p>&quot;{member.nickname}&quot;</p> : null}
                </div>
              </div>

              <div className={styles.detailGrid}>
                <section className={styles.detailCard}>
                  <h2 className={styles.panelTitle}>Personal Details</h2>
                  <div className={styles.detailList}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Phone Number</span>
                      <span className={styles.detailValue}>{member.phoneNumber || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>WhatsApp</span>
                      <span className={styles.detailValue}>{member.whatsappNumber || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Date of Birth</span>
                      <span className={styles.detailValue}>{formatDate(member.dateOfBirth)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Nationality</span>
                      <span className={styles.detailValue}>{member.nationality || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Tribe</span>
                      <span className={styles.detailValue}>{member.tribe || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Marital Status</span>
                      <span className={styles.detailValue}>{member.maritalStatus || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Instagram</span>
                      <span className={styles.detailValue}>{member.instagramHandle || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Facebook</span>
                      <span className={styles.detailValue}>{member.facebookHandle || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>X</span>
                      <span className={styles.detailValue}>{member.xHandle || "-"}</span>
                    </div>
                  </div>
                </section>

                <section className={styles.detailCard}>
                  <h2 className={styles.panelTitle}>Church Details</h2>
                  <div className={styles.detailList}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Department</span>
                      <span className={styles.detailValue}>{member.department?.name ?? "Unassigned"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Preferred Department</span>
                      <span className={styles.detailValue}>{member.preferredDepartment?.name ?? "Unassigned"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Date Joined</span>
                      <span className={styles.detailValue}>{formatDate(member.dateJoined)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Newcomer</span>
                      <span className={styles.detailValue}>{member.isNewComer ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </section>

                <section className={styles.detailCard}>
                  <h2 className={styles.panelTitle}>Work And Interests</h2>
                  <div className={styles.detailList}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Occupation</span>
                      <span className={styles.detailValue}>{member.occupation || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Company</span>
                      <span className={styles.detailValue}>{member.company || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Role</span>
                      <span className={styles.detailValue}>{member.role || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Skills</span>
                      <span className={styles.detailValue}>{member.skills || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Hobbies</span>
                      <span className={styles.detailValue}>{member.hobbies || "-"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailTerm}>Favorite Verse</span>
                      <span className={styles.detailValue}>{member.favoriteVerse || "-"}</span>
                    </div>
                  </div>
                </section>
              </div>

              {member.homeAddress ? (
                <section className={styles.detailCard}>
                  <h2 className={styles.panelTitle}>Home Address</h2>
                  <p className={styles.panelText}>{member.homeAddress}</p>
                </section>
              ) : null}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Attendance Records</h2>
              <p className={styles.panelText}>
                {attendanceRecords.length} attendance record{attendanceRecords.length === 1 ? "" : "s"} found for this
                member.
              </p>

              {attendanceRecords.length === 0 ? (
                <div className={styles.emptyState}>No attendance records were found for this member.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Service</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((attendance) => (
                        <tr key={attendance.id}>
                          <td>{formatDate(attendance.date)}</td>
                          <td>
                            <span
                              className={`${styles.pill} ${attendance.present ? styles.pillGold : styles.pillRed}`}
                            >
                              {attendance.present ? "Present" : "Absent"}
                            </span>
                          </td>
                          <td>
                            {attendance.serviceId === null
                              ? "Date-only record"
                              : servicesById.get(attendance.serviceId) ?? "Unknown service"}
                          </td>
                          <td>{attendance.notes || "-"}</td>
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
  } catch {
    notFound();
  }
}
