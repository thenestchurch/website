import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyRole, isDepartmentLeadOnly } from "@/lib/auth/authorization";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import type { AdminRole } from "@/lib/domain/types";
import styles from "./admin-dashboard.module.css";

export const dynamic = "force-dynamic";

function getDashboardIcon(href: string) {
  switch (href) {
    case "/admin/members":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "/admin/members/birthdays":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 12v10H4V12" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 22V7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      );
    case "/admin/members/newcomers":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      );
    case "/admin/members/absentees":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="18" y1="8" x2="23" y2="13" />
          <line x1="23" y1="8" x2="18" y2="13" />
        </svg>
      );
    case "/admin/reports":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "/admin/reports/submit":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="11" x2="16" y2="11" />
        </svg>
      );
    case "/admin/departments":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "/admin/departments/report":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "/admin/attendance":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "/admin/attendance/absentees":
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    default:
      return (
        <svg
          className={styles.cardIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}

function getRoleBadgeClass(role: AdminRole) {
  switch (role) {
    case "admin":
      return `${styles.roleBadge} ${styles.roleAdmin}`;
    case "staff":
      return `${styles.roleBadge} ${styles.roleStaff}`;
    default:
      return styles.roleBadge;
  }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const actor = await requireServerAdminActor();

  if (isDepartmentLeadOnly(actor)) {
    redirect("/department-head/reports/submit");
  }

  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const cards: {
    allowedRoles: AdminRole[];
    description: string;
    href: string;
    title: string;
  }[] = [
    {
      allowedRoles: ["admin", "staff"],
      description: "Search members, open full profiles, and move through the custom directory.",
      href: "/admin/members",
      title: "Members",
    },
    {
      allowedRoles: ["admin", "staff"],
      description: "See birthdays by month using the imported member records.",
      href: "/admin/members/birthdays",
      title: "Birthdays",
    },
    {
      allowedRoles: ["admin", "staff"],
      description: "Track first-timers, returning newcomers, and people who need follow-up.",
      href: "/admin/members/newcomers",
      title: "Newcomers Report",
    },
    {
      allowedRoles: ["admin", "staff"],
      description: "See regular members who have missed church for more than two weeks.",
      href: "/admin/members/absentees",
      title: "Member Absentees",
    },
    {
      allowedRoles: ["admin", "staff"],
      description: "Open service overviews and review department report submissions.",
      href: "/admin/reports",
      title: "Reports",
    },
    {
      allowedRoles: ["admin", "staff"],
      description: "Manage department structure, reporting channels, and member grouping.",
      href: "/admin/departments",
      title: "Departments",
    },
    {
      allowedRoles: ["admin", "staff"],
      description: "View the cross-department summary report.",
      href: "/admin/departments/report",
      title: "Department Report",
    },
    {
      allowedRoles: ["admin", "staff"],
      description: "Mark attendance, track counts, and manage service/date registers.",
      href: "/admin/attendance",
      title: "Attendance Register",
    },
    {
      allowedRoles: ["admin", "staff", "absentee-viewer"],
      description: "Track members who have not been in church for multiple weeks.",
      href: "/admin/attendance/absentees",
      title: "Absentee Tracking",
    },
  ];
  const visibleCards = cards.filter((card) => hasAnyRole(actor, card.allowedRoles));

  return (
    <div className={styles.dashboard}>
      {error === "forbidden" ? (
        <div className={styles.errorBanner}>
          Your account is signed in, but it does not have permission to access that section.
        </div>
      ) : null}

      <section className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <p className={styles.eyebrow}>Internal Operations</p>
          <h2 className={styles.title}>Admin Dashboard</h2>
          <p className={styles.description}>
            Welcome back, {actor.name || actor.email || "Operations Team"}. This panel gives you access to custom member registers,
            attendance logs, and department reporting configurations.
          </p>
        </div>
      </section>

      <section className={styles.cardsGrid}>
        {visibleCards.map((item) => (
          <Link href={item.href} key={item.href} className={styles.card}>
            <div className={styles.iconBox}>{getDashboardIcon(item.href)}</div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>
                <span>{item.title}</span>
                <svg
                  className={styles.cardArrow}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </h3>
              <p className={styles.cardDesc}>{item.description}</p>
            </div>
            <div className={styles.cardFooter}>
              {item.allowedRoles.map((role) => (
                <span key={role} className={getRoleBadgeClass(role)}>
                  {role}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
