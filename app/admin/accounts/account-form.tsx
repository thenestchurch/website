import Link from "next/link";
import { HoneypotField } from "@/components/honeypot-field";
import { ADMIN_ROLES, type AdminAccount, type Department } from "@/lib/domain/types";
import { saveAdminAccount } from "./actions";
import styles from "../members/members.module.css";

const roleLabels = {
  admin: "Admin", staff: "Staff", "department-lead": "Department Lead", "absentee-viewer": "Absentee Viewer",
};

export function AccountForm({ account, departments }: { account?: AdminAccount; departments: Department[] }) {
  return <form action={saveAdminAccount} className={styles.form}>
    <HoneypotField />{account ? <input name="id" type="hidden" value={account.id} /> : null}
    <div className={styles.doubleGrid}>
      <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Name</label><input className={styles.input} defaultValue={account?.name ?? ""} name="name" required /></div>
      <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Email</label><input className={styles.input} defaultValue={account?.email ?? ""} name="email" required type="email" /></div>
    </div>
    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>{account ? "New Password (optional)" : "Temporary Password"}</label><input className={styles.input} minLength={12} name="password" required={!account} type="password" /><p className={styles.panelText}>Use at least 12 characters. Share it through a secure channel and require rotation.</p></div>
    <div className={styles.fieldGroup}><span className={styles.fieldLabel}>Roles</span>{ADMIN_ROLES.map((role) => <label className={styles.checkboxWrap} key={role}><input defaultChecked={account?.roles.includes(role) ?? role === "staff"} name="roles" type="checkbox" value={role} />{roleLabels[role]}</label>)}</div>
    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Department</label><select className={styles.select} defaultValue={account?.departmentId ?? ""} name="departmentId"><option value="">No department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select><p className={styles.panelText}>Required when Department Lead is selected.</p></div>
    <label className={styles.checkboxWrap}><input defaultChecked={account?.isActive ?? true} name="isActive" type="checkbox" />Active account</label>
    <label className={styles.checkboxWrap}><input defaultChecked={account?.isSuperAdmin ?? false} name="isSuperAdmin" type="checkbox" />Super admin</label>
    <div className={styles.actions}><button className={styles.primaryButton} type="submit">{account ? "Update Account" : "Create Account"}</button><Link className={styles.ghostButton} href="/admin/accounts">Cancel</Link></div>
  </form>;
}
