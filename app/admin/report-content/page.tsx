import { HoneypotField } from "@/components/honeypot-field";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { getServerReportContentRepository } from "@/lib/repositories/server/report-content";
import { saveReportInstruction, saveReportTemplate } from "./actions";
import styles from "../reports/reports.module.css";

type Props = { searchParams: Promise<{ saved?: string | string[] }> };
const value = (input: string | string[] | undefined) => Array.isArray(input) ? input[0] : input;

export const dynamic = "force-dynamic";

export default async function ReportContentPage({ searchParams }: Props) {
  await requireServerAdminActor(["admin", "staff"]);
  const [departments, contentRepository] = await Promise.all([
    (await getServerDepartmentRepository()).findAll(),
    getServerReportContentRepository(),
  ]);
  const [instructions, templates] = await Promise.all([
    contentRepository.findAllInstructions(),
    contentRepository.findAllTemplates(),
  ]);
  const saved = value((await searchParams).saved);

  const instructionForm = (instruction?: (typeof instructions)[number]) => (
    <form action={saveReportInstruction} className={styles.form} key={instruction?.id ?? "new-instruction"}>
      <HoneypotField />
      {instruction ? <input name="id" type="hidden" value={instruction.id} /> : null}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Title</label>
        <input className={styles.input} defaultValue={instruction?.title ?? ""} name="title" required />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Department</label>
        <select className={styles.select} defaultValue={instruction?.departmentId ?? ""} name="departmentId" required>
          <option value="">Select department</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Instructions</label>
        <textarea className={styles.textarea} defaultValue={instruction?.content ?? ""} name="content" required />
      </div>
      <label><input defaultChecked={instruction?.isActive ?? true} name="isActive" type="checkbox" /> Active</label>
      <button className={styles.primaryButton} type="submit">{instruction ? "Update Instruction" : "Add Instruction"}</button>
    </form>
  );

  const templateForm = (template?: (typeof templates)[number]) => (
    <form action={saveReportTemplate} className={styles.form} key={template?.id ?? "new-template"}>
      <HoneypotField />
      {template ? <input name="id" type="hidden" value={template.id} /> : null}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Title</label>
        <input className={styles.input} defaultValue={template?.title ?? ""} name="title" required />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Applicable Departments</label>
        <select className={styles.select} defaultValue={template?.applicableDepartmentIds.map(String) ?? []} multiple name="departmentIds">
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
        <p className={styles.panelText}>Leave empty to make the template available to every department.</p>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Template</label>
        <textarea className={styles.textarea} defaultValue={template?.content ?? ""} name="content" required />
      </div>
      <label><input defaultChecked={template?.isActive ?? true} name="isActive" type="checkbox" /> Active</label>
      <button className={styles.primaryButton} type="submit">{template ? "Update Template" : "Add Template"}</button>
    </form>
  );

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Reports</p>
          <h1 className={styles.title}>Report Setup</h1>
          <p className={styles.lede}>Manage department instructions and reusable service-report templates.</p>
        </section>
        {saved ? <div className={`${styles.banner} ${saved === "invalid" ? styles.bannerWarn : styles.bannerSuccess}`}>{saved === "invalid" ? "Complete all required fields." : "Report content saved."}</div> : null}
        <div className={styles.grid}>
          <section className={styles.panel}><div className={styles.panelPad}><h2 className={styles.panelTitle}>New Instruction</h2>{instructionForm()}</div></section>
          <section className={styles.panel}><div className={styles.panelPad}><h2 className={styles.panelTitle}>Existing Instructions</h2>{instructions.length ? instructions.map(instructionForm) : <p className={styles.emptyState}>No active instructions.</p>}</div></section>
        </div>
        <div className={styles.grid}>
          <section className={styles.panel}><div className={styles.panelPad}><h2 className={styles.panelTitle}>New Template</h2>{templateForm()}</div></section>
          <section className={styles.panel}><div className={styles.panelPad}><h2 className={styles.panelTitle}>Existing Templates</h2>{templates.length ? templates.map(templateForm) : <p className={styles.emptyState}>No active templates.</p>}</div></section>
        </div>
      </div>
    </main>
  );
}
