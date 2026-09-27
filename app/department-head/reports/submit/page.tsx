import { ReportSubmitButton } from "@/components/report-submit-button";
import { HoneypotField } from "@/components/honeypot-field";
import { requireServerDepartmentLeadActor } from "@/lib/auth/server-department-lead-context";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { getServerReportContentRepository } from "@/lib/repositories/server/report-content";
import { getServerServiceRepository } from "@/lib/repositories/server/services";
import { submitDepartmentHeadReport } from "./actions";
import styles from "@/app/admin/reports/reports.module.css";

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
        message: "A report for your department and that service already exists.",
      };
    case "invalid":
      return {
        className: `${styles.banner} ${styles.bannerWarn}`,
        message: "Choose a service and complete the report content.",
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

export default async function DepartmentHeadSubmitReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedService = takeString(params.service);
  const banner = getBanner(takeString(params.saved));
  const actor = await requireServerDepartmentLeadActor();
  const departmentID = actor.departmentId;
  const [serviceRepository, departmentRepository, reportContentRepository] =
    await Promise.all([
      getServerServiceRepository(),
      getServerDepartmentRepository(),
      getServerReportContentRepository(),
    ]);
  const [services, selectedDepartment, instruction, templates] = await Promise.all([
    serviceRepository.findActive(),
    departmentRepository.findById(departmentID),
    reportContentRepository.findInstructionForDepartment(departmentID),
    reportContentRepository.findTemplatesForDepartment(departmentID),
  ]);
  const instructions = instruction ? [instruction] : [];
  const firstTemplate = templates[0]?.content ?? "";

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Department Head Portal</p>
          <h1 className={styles.title}>Submit Service Report</h1>
          <p className={styles.lede}>
            {selectedDepartment?.name ?? "Your department"} report submission for {actor.name || actor.email}.
          </p>
        </section>

        {banner ? <div className={banner.className}>{banner.message}</div> : null}

        <div className={styles.grid}>
          <aside className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Report Guidance</h2>
                <ol className={styles.panelText}>
                  <li>Choose the service first.</li>
                  <li>Submit one report for your department per service.</li>
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
              <form action={submitDepartmentHeadReport} className={styles.form}>
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
                        {service.name} - {service.date}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="departmentName">
                    Department
                  </label>
                  <input
                    className={styles.input}
                    id="departmentName"
                    readOnly
                    value={selectedDepartment?.name ?? `Department ${departmentID}`}
                  />
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
