import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerAdminAccountRepository } from "@/lib/repositories/server/admin-accounts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import styles from "../members/members.module.css";

export const dynamic = "force-dynamic";
export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const actor = await requireServerAdminActor(["admin"]);
  const [accounts, departments] = await Promise.all([
    (await getServerAdminAccountRepository(actor)).list(),
    (await getServerDepartmentRepository()).findAll(),
  ]);
  const departmentNames = new Map(departments.map((department) => [department.id, department.name]));
  const updated = (await searchParams).updated;
  return <main className={styles.page}><div className={styles.stack}>
    <section className={styles.hero}><p className={styles.eyebrow}>Administration</p><h1 className={styles.title}>Accounts</h1><p className={styles.lede}>Manage operational roles, department assignments, and login status.</p><div className={styles.actions}><Link className={styles.primaryButton} href="/admin/accounts/new">New Account</Link></div></section>
    {updated ? <div className={`${styles.banner} ${styles.bannerSuccess}`}>Account saved.</div> : null}
    <section className={styles.panel}><div className={styles.panelPad}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Name</th><th>Roles</th><th>Department</th><th>Status</th><th>Action</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td><span className={styles.memberName}>{account.name}</span><span className={styles.memberMeta}>{account.email}</span></td><td>{account.roles.join(", ")}</td><td>{account.departmentId ? departmentNames.get(account.departmentId) ?? "Unknown" : "None"}</td><td>{account.isActive ? "Active" : "Inactive"}</td><td><Link className={styles.secondaryButton} href={`/admin/accounts/${account.id}/edit`}>Edit</Link></td></tr>)}</tbody></table></div></div></section>
  </div></main>;
}
