import { notFound } from "next/navigation";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { DepartmentForm } from "../../department-form";
import styles from "../../departments.module.css";

export const dynamic = "force-dynamic";
export default async function EditDepartmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireServerAdminActor(["admin", "staff"]);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const department = await (await getServerDepartmentRepository()).findById(id);
  if (!department) notFound();
  const saved = (await searchParams).saved;
  return <main className={styles.page}><div className={styles.stack}>
    <section className={styles.hero}><p className={styles.eyebrow}>Departments</p><h1 className={styles.title}>Edit {department.name}</h1><p className={styles.lede}>Update department status and reporting details.</p></section>
    {saved === "invalid" ? <div className={styles.emptyState}>Use a unique name and slug, then complete the required fields.</div> : null}
    <section className={styles.panel}><div className={styles.panelPad}><DepartmentForm department={department} /></div></section>
  </div></main>;
}
