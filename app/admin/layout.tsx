import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerAuthenticatedActor } from "@/lib/auth/server-actor.ts";
import { hasAnyRole, isDepartmentLeadOnly } from "@/lib/auth/authorization.ts";
import type { AdminRole } from "@/lib/domain/types.ts";
import { AdminSidebar } from "./admin-sidebar";
import styles from "./admin-layout.module.css";

const navItems: {
  allowedRoles: AdminRole[];
  href: string;
  label: string;
}[] = [
  {
    allowedRoles: ["admin", "staff", "absentee-viewer"],
    href: "/admin",
    label: "Dashboard",
  },
  {
    allowedRoles: ["admin"],
    href: "/admin/accounts",
    label: "Accounts",
  },
  {
    allowedRoles: ["admin", "staff"],
    href: "/admin/members",
    label: "Members",
  },
  {
    allowedRoles: ["admin", "staff"],
    href: "/admin/reports",
    label: "Reports",
  },
  {
    allowedRoles: ["admin", "staff"],
    href: "/admin/report-content",
    label: "Report Setup",
  },
  {
    allowedRoles: ["admin", "staff"],
    href: "/admin/departments",
    label: "Departments",
  },
  {
    allowedRoles: ["admin", "staff"],
    href: "/admin/attendance",
    label: "Attendance",
  },
  {
    allowedRoles: ["admin", "staff", "absentee-viewer"],
    href: "/admin/attendance/absentees",
    label: "Absentees",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const incomingHeaders = await headers();
  const currentPath = incomingHeaders.get("x-current-path") ?? "";

  if (currentPath.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const user = await getServerAuthenticatedActor();

  if (isDepartmentLeadOnly(user)) {
    redirect("/department-head/reports/submit");
  }

  const visibleNavItems = user
    ? navItems
        .filter((item) => hasAnyRole(user, item.allowedRoles))
        .map(({ href, label }) => ({ href, label }))
    : navItems.map(({ href, label }) => ({ href, label }));

  return (
    <div className={styles.container}>
      <AdminSidebar user={user} navItems={visibleNavItems} />
      <div className={styles.mainArea}>
        {/* Content Header (Desktop) */}
        <header className={styles.contentHeader}>
          <h1 className={styles.headerTitle}>System Panel</h1>
          <div className={styles.headerMeta}>
            <span className={styles.dateBadge}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Dynamic page contents */}
        <main className={styles.pageBody}>{children}</main>
      </div>
    </div>
  );
}
