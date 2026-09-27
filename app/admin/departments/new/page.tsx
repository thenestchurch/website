import Link from "next/link";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { DepartmentForm } from "../department-form";
import styles from "../departments.module.css";

export const dynamic = "force-dynamic";
export default async function NewDepartmentPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireServerAdminActor(["admin", "staff"]);
  const saved = (await searchParams).saved;
  return <main className={styles.page}><div className={styles.stack}>
    <section className={styles.hero}><p className={styles.eyebrow}>Departments</p><h1 className={styles.title}>Create Department</h1><p className={styles.lede}>Add a department and its reporting details.</p><div className={styles.actions}><Link className={styles.secondaryButton} href="/admin/departments">Back To Departments</Link></div></section>
    {saved === "invalid" ? <div className={styles.emptyState}>Use a unique name and slug, then complete the required fields.</div> : null}
    <section className={styles.panel}><div className={styles.panelPad}><DepartmentForm /></div></section>
  </div></main>;
}
