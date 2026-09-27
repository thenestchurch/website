import { ReportSubmitButton } from "@/components/report-submit-button";
import Link from "next/link";
import { HoneypotField } from "@/components/honeypot-field";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context.ts";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments.ts";
import { getServerReportContentRepository } from "@/lib/repositories/server/report-content.ts";
import { getServerServiceRepository } from "@/lib/repositories/server/services.ts";
import { submitServiceReport } from "../actions";
import styles from "../reports.module.css";

type SearchParams = Promise<{
  saved?: string | string[];
  service?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getBanner = (value: string | undefined) => {
  switch (value) {
    case "failed":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "The report could not be submitted. Please try again. If this continues, contact an administrator." };
    case "forbidden":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "Your account could not submit this report. Sign in again or contact an administrator." };
    case "duplicate":
      return {
        className: `${styles.banner} ${styles.bannerWarn}`,
        message: "A report for that department and service already exists.",
      };
    case "invalid":
      return {
        className: `${styles.banner} ${styles.bannerWarn}`,
        message: "Complete the required service, department, and report fields.",
      };
    case "1":
      return {
        className: `${styles.banner} ${styles.bannerSuccess}`,
        message: "Service report submitted successfully.",
      };
    default:
      return null;
  }
};

export const dynamic = "force-dynamic";

export default async function SubmitReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedService = takeString(params.service);
  const banner = getBanner(takeString(params.saved));
  await requireServerAdminActor(["admin", "staff"]);
  const [serviceRepository, departmentRepository, reportContentRepository] =
    await Promise.all([
      getServerServiceRepository(),
      getServerDepartmentRepository(),
      getServerReportContentRepository(),
    ]);

  const [services, departments, activeInstructions, activeTemplates] = await Promise.all([
    serviceRepository.findActive(),
    departmentRepository.findActive(),
    reportContentRepository.findActiveInstructions(),
    reportContentRepository.findActiveTemplates(),
  ]);

  const allowedDepartmentIDs = new Set(departments.map((department) => department.id));
  const instructions = activeInstructions.filter((instruction) =>
    allowedDepartmentIDs.has(instruction.departmentId),
  );
  const templates = activeTemplates.filter((template) => {
    if (template.applicableDepartmentIds.length === 0) {
      return true;
    }

    return template.applicableDepartmentIds.some((id) => allowedDepartmentIDs.has(id));
  });
  const firstTemplate = templates[0]?.content ?? "";

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Reports</p>
          <h1 className={styles.title}>Submit Service Report</h1>
          <p className={styles.lede}>Create a department report for a service using the custom admin flow.</p>
          <div className={styles.actions}>
            <Link className={styles.secondaryButton} href="/admin/reports">
              Back To Reports
            </Link>
          </div>
        </section>

        {banner ? <div className={banner.className}>{banner.message}</div> : null}

        <div className={styles.grid}>
          <aside className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Report Guidance</h2>
                <ol className={styles.panelText}>
                  <li>Choose the service first.</li>
                  <li>Submit one report per department per service.</li>
                  <li>Include key activities, highlights, challenges, and follow-up notes.</li>
                </ol>
                {instructions.length > 0 ? (
                  <div className={styles.list}>
                    {instructions.map((instruction) => (
                      <article className={styles.reportCard} key={instruction.id}>
                        <span className={styles.serviceName}>{instruction.title}</span>
                        <p className={styles.panelText}>{instruction.content}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
                {templates.length > 0 ? (
                  <div className={styles.list}>
                    <h3 className={styles.panelTitle}>Templates</h3>
                    {templates.map((template) => (
                      <article className={styles.reportCard} key={template.id}>
                        <span className={styles.serviceName}>{template.title}</span>
                        <pre className={styles.templateText}>{template.content}</pre>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Department Submission</h2>
              <form action={submitServiceReport} className={styles.form}>
                <HoneypotField />
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="title">
                    Report Title
                  </label>
                  <input className={styles.input} id="title" name="title" placeholder="e.g. Choir Department Report" type="text" />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="service">
                    Service
                  </label>
                  <select className={styles.select} defaultValue={requestedService ?? ""} id="service" name="service" required>
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {service.date}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="department">
                    Department
                  </label>
                  <select className={styles.select} id="department" name="department" required>
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="reportContent">
                    Report Content
                  </label>
                  <textarea
                    className={styles.textarea}
                    defaultValue={firstTemplate}
                    id="reportContent"
                    name="reportContent"
                  required
                    placeholder="Summarize the department's activities, observations, highlights, and issues."
                  />
                </div>

                <div className={styles.grid} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="departmentAttendance">
                      Department Attendance
                    </label>
                    <input className={styles.input} id="departmentAttendance" min={0} step={1} name="departmentAttendance" type="number" />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="volunteersCount">
                      Volunteers Count
                    </label>
                    <input className={styles.input} id="volunteersCount" min={0} step={1} name="volunteersCount" type="number" />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="attachmentUrl">
                    Attachment URL
                  </label>
                  <input className={styles.input} id="attachmentUrl" name="attachmentUrl" placeholder="https://..." type="url" />
                </div>

                <div className={styles.actions}>
                  <ReportSubmitButton className={styles.primaryButton} />
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
