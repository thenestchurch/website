import styles from "@/app/public-operations.module.css";
import { HoneypotField } from "@/components/honeypot-field";
import { getPublicDepartmentRepository } from "@/lib/repositories/server/public-operations.ts";
import { registerPublicMember } from "./actions";

type SearchParams = Promise<{
  saved?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getBanner = (value: string | undefined) => {
  switch (value) {
    case "invalid":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "First name and last name are required." };
    case "error":
      return { className: `${styles.banner} ${styles.bannerWarn}`, message: "Member could not be registered. Check for duplicate email or invalid values." };
    default:
      return null;
  }
};

export const dynamic = "force-dynamic";

export default async function PublicMemberRegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const banner = getBanner(takeString((await searchParams).saved));
  const departments = await (await getPublicDepartmentRepository()).findActive();

  const todayValue = new Date().toISOString().slice(0, 10);

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <div className={styles.heroIcon} aria-hidden="true">
            <svg fill="none" height="40" viewBox="0 0 24 24" width="40">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className={styles.heroTitle}>Register Member</h1>
          <p className={styles.heroText}>Create a new member record before marking attendance.</p>
          {banner ? <div className={banner.className}>{banner.message}</div> : null}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelPad}>
            <form action={registerPublicMember} className={styles.form} encType="multipart/form-data">
              <HoneypotField />
              <div className={styles.twoCol}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="firstName">First Name</label>
                  <input className={styles.input} id="firstName" name="firstName" required type="text" />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="middleName">Middle Name</label>
                  <input className={styles.input} id="middleName" name="middleName" type="text" />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="lastName">Last Name</label>
                  <input className={styles.input} id="lastName" name="lastName" required type="text" />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="email">Email</label>
                  <input className={styles.input} id="email" name="email" type="email" />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="phoneNumber">Phone Number</label>
                  <input className={styles.input} id="phoneNumber" name="phoneNumber" type="text" />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="whatsappNumber">WhatsApp Number</label>
                  <input className={styles.input} id="whatsappNumber" name="whatsappNumber" type="text" />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="department">Department</label>
                  <select className={styles.select} id="department" name="department">
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="preferredDepartment">Preferred Department</label>
                  <select className={styles.select} id="preferredDepartment" name="preferredDepartment">
                    <option value="">Select preferred department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.twoCol}>
                <div>
                  <label className={styles.fieldLabel} htmlFor="dateOfBirth">Date Of Birth</label>
                  <input className={styles.input} id="dateOfBirth" name="dateOfBirth" type="date" />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="dateJoined">Date Joined</label>
                  <input className={styles.input} defaultValue={todayValue} id="dateJoined" name="dateJoined" type="date" />
                </div>
              </div>

              <div>
                <label className={styles.fieldLabel} htmlFor="profilePicture">Profile Picture</label>
                <input className={styles.input} accept="image/*" id="profilePicture" name="profilePicture" type="file" />
              </div>

              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit">
                  Register Member
                </button>
                <a className={styles.secondaryButton} href="/attendance/mark-attendance">
                  Back To Attendance
                </a>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
