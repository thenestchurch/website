import { ReportSubmitButton } from "@/components/report-submit-button";
import { HoneypotField } from "@/components/honeypot-field";
import {
  getPublicDepartmentRepository,
  getPublicReportContentRepository,
  getPublicServiceRepository,
} from "@/lib/repositories/server/public-operations";
import { submitPublicServiceReport } from "./actions";
import styles from "@/app/public-operations.module.css";

type SearchParams = Promise<{
  saved?: string | string[];
  service?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getBanner = (value: string | undefined) => {
  switch (value) {
    case "1":
      return { className: `${styles.banner} ${styles.bannerSuccess}`, message: "Report submitted successfully." };
    case "failed":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "The report could not be submitted. Please try again. If this continues, contact an administrator." };
    case "forbidden":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "Your account could not submit this report. Sign in again or contact an administrator." };
    case "duplicate":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "A report for that department and service already exists." };
    case "invalid":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "Complete the required fields before submitting." };
    default:
      return null;
  }
};

export const dynamic = "force-dynamic";

export default async function PublicSubmitReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const banner = getBanner(takeString(params.saved));
  const requestedService = takeString(params.service) ?? "";
  const [serviceRepository, departmentRepository, reportContentRepository] = await Promise.all([
    getPublicServiceRepository(),
    getPublicDepartmentRepository(),
    getPublicReportContentRepository(),
  ]);
  const [services, departments, instructions, templates] = await Promise.all([
    serviceRepository.findActive(),
    departmentRepository.findActive(),
    reportContentRepository.findActiveInstructions(),
    reportContentRepository.findActiveTemplates(),
  ]);
  const firstTemplate = templates[0]?.content ?? "";

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <div className={styles.heroIcon} aria-hidden="true">
            <svg fill="none" height="40" viewBox="0 0 24 24" width="40">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className={styles.heroTitle}>Submit Report</h1>
          <p className={styles.heroText}>
            Submit a department service report without signing in.
          </p>
          {banner ? <div className={banner.className}>{banner.message}</div> : null}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            {instructions.length > 0 || templates.length > 0 ? (
              <div className={styles.grid}>
                {instructions.slice(0, 3).map((instruction) => (
                  <article className={styles.memberCard} key={instruction.id}>
                    <strong>{instruction.title}</strong>
                    <p>{instruction.content}</p>
                  </article>
                ))}
                {templates.slice(0, 2).map((template) => (
                  <article className={styles.memberCard} key={template.id}>
                    <strong>{template.title}</strong>
                    <p>{template.content}</p>
                  </article>
                ))}
              </div>
            ) : null}
            <form action={submitPublicServiceReport} className={styles.form}>
              <HoneypotField />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="title">
                  Report Title
                </label>
                <input className={styles.input} id="title" name="title" placeholder="Choir Department Report" type="text" />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="service">
                    Service
                  </label>
                  <select className={styles.select} defaultValue={requestedService} id="service" name="service" required>
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
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="reportContent">
                  Report Details
                </label>
                <textarea
                  className={styles.textarea}
                  defaultValue={firstTemplate}
                  id="reportContent"
                  name="reportContent"
                  required
                  placeholder="Write the department report here..."
                />
              </div>

              <div className={styles.twoCol}>
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
    </main>
  );
}
