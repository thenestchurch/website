import { notFound } from "next/navigation";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerAdminAccountRepository } from "@/lib/repositories/server/admin-accounts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { AccountForm } from "../../account-form";
import styles from "../../../members/members.module.css";

export const dynamic = "force-dynamic";
export default async function EditAccountPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const actor = await requireServerAdminActor(["admin"]);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [account, departments] = await Promise.all([(await getServerAdminAccountRepository(actor)).findById(id), (await getServerDepartmentRepository()).findAll()]);
  if (!account) notFound();
  const saved = (await searchParams).saved;
  return <main className={styles.page}><div className={styles.stack}><section className={styles.hero}><p className={styles.eyebrow}>Administration</p><h1 className={styles.title}>Edit {account.name}</h1><p className={styles.lede}>Update roles, assignment, login email, or status.</p></section>{saved === "invalid" ? <div className={styles.emptyState}>The account could not be saved. Check the fields and avoid removing your own access.</div> : null}<section className={styles.panel}><div className={styles.panelPad}><AccountForm account={account} departments={departments} /></div></section></div></main>;
}
