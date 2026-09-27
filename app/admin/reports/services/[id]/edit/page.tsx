import Link from "next/link";
import { notFound } from "next/navigation";
import { HoneypotField } from "@/components/honeypot-field";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { SERVICE_TYPES } from "@/lib/domain/types";
import { getServerServiceRepository } from "@/lib/repositories/server/services";
import { updateService } from "../../../actions";
import styles from "../../../reports.module.css";

const labels = {
  "sunday-service": "Sunday Service", "midweek-service": "Midweek Service",
  "prayer-meeting": "Prayer Meeting", "special-program": "Special Program", other: "Other",
};
export const dynamic = "force-dynamic";

export default async function EditServicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireServerAdminActor(["admin", "staff"]);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const service = await (await getServerServiceRepository()).findById(id);
  if (!service) notFound();
  const saved = (await searchParams).saved;
  return <main className={styles.page}><div className={styles.stack}>
    <section className={styles.hero}><p className={styles.eyebrow}>Reports</p><h1 className={styles.title}>Edit Service</h1><p className={styles.lede}>Update service details and report availability.</p><div className={styles.actions}><Link className={styles.secondaryButton} href={`/admin/reports/${service.id}`}>Back To Service</Link></div></section>
    {saved === "invalid" ? <div className={`${styles.banner} ${styles.bannerWarn}`}>Complete the required service fields.</div> : null}
    <section className={styles.panel}><div className={styles.panelPad}><form action={updateService} className={styles.form}>
      <HoneypotField /><input name="serviceId" type="hidden" value={service.id} />
      <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Service Name</label><input className={styles.input} defaultValue={service.name} name="name" required /></div>
      <div className={styles.grid} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Service Type</label><select className={styles.select} defaultValue={service.serviceType} name="serviceType">{SERVICE_TYPES.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></div>
        <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Date</label><input className={styles.input} defaultValue={service.date.slice(0, 10)} name="date" required type="date" /></div>
      </div>
      <div className={styles.grid} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Start Time</label><input className={styles.input} defaultValue={service.startTime ?? ""} name="startTime" /></div>
        <div className={styles.fieldGroup}><label className={styles.fieldLabel}>End Time</label><input className={styles.input} defaultValue={service.endTime ?? ""} name="endTime" /></div>
      </div>
      <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Notes</label><textarea className={styles.textarea} defaultValue={service.notes ?? ""} name="notes" /></div>
      <label><input defaultChecked={service.isActive} name="isActive" type="checkbox" /> Active for report submissions</label>
      <div className={styles.actions}><button className={styles.primaryButton} type="submit">Update Service</button><Link className={styles.ghostButton} href={`/admin/reports/${service.id}`}>Cancel</Link></div>
    </form></div></section>
  </div></main>;
}
