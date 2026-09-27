import Link from "next/link";
import { HoneypotField } from "@/components/honeypot-field";
import type { Department } from "@/lib/domain/types";
import { saveDepartment } from "./actions";
import styles from "./departments.module.css";

export function DepartmentForm({ department }: { department?: Department }) {
  return (
    <form action={saveDepartment} className={styles.form}>
      <HoneypotField />
      {department ? <input name="id" type="hidden" value={department.id} /> : null}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="name">Department Name</label>
        <input className={styles.input} defaultValue={department?.name ?? ""} id="name" name="name" required />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="slug">Slug</label>
        <input className={styles.input} defaultValue={department?.slug ?? ""} id="slug" name="slug" placeholder="Generated from the name" />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="reportingChannel">Reporting Channel</label>
        <input className={styles.input} defaultValue={department?.reportingChannel ?? ""} id="reportingChannel" name="reportingChannel" />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="description">Description</label>
        <textarea className={styles.textarea} defaultValue={department?.description ?? ""} id="description" name="description" />
      </div>
      <label><input defaultChecked={department?.isActive ?? true} name="isActive" type="checkbox" /> Active</label>
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="submit">{department ? "Update Department" : "Create Department"}</button>
        <Link className={styles.ghostButton} href={department ? `/admin/departments/${department.id}` : "/admin/departments"}>Cancel</Link>
      </div>
    </form>
  );
}
