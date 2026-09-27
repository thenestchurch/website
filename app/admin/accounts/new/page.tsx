import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { AccountForm } from "../account-form";
import styles from "../../members/members.module.css";

export const dynamic = "force-dynamic";
export default async function NewAccountPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireServerAdminActor(["admin"]);
  const departments = await (await getServerDepartmentRepository()).findAll();
  const saved = (await searchParams).saved;
  return <main className={styles.page}><div className={styles.stack}><section className={styles.hero}><p className={styles.eyebrow}>Administration</p><h1 className={styles.title}>Create Account</h1><p className={styles.lede}>Provision an operational login and assign least-privilege roles.</p></section>{saved === "invalid" ? <div className={styles.emptyState}>Check the email, roles, department assignment, and 12-character temporary password.</div> : null}<section className={styles.panel}><div className={styles.panelPad}><AccountForm departments={departments} /></div></section></div></main>;
}
