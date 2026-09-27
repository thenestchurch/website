import Link from "next/link";
import { notFound } from "next/navigation";
import { HoneypotField } from "@/components/honeypot-field";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { getServerMemberRepository } from "@/lib/repositories/server/members";
import { updateMemberDetails } from "../../actions";
import styles from "../../members.module.css";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const relationshipValue = (value: number | null | undefined) => value ? String(value) : "";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({
  params,
}: PageProps) {
  const memberID = Number((await params).id);

  if (!Number.isFinite(memberID)) {
    notFound();
  }

  await requireServerAdminActor(["admin", "staff"]);

  try {
    const [memberRepository, departmentRepository] = await Promise.all([
      getServerMemberRepository(),
      getServerDepartmentRepository(),
    ]);
    const [memberDoc, departments] = await Promise.all([
      memberRepository.findById(memberID),
      departmentRepository.findActive(),
    ]);
    if (!memberDoc) notFound();

    return (
      <main className={styles.page}>
        <div className={styles.stack}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Members</p>
            <h1 className={styles.title}>Edit Member</h1>
            <p className={styles.lede}>Update member details inside the custom admin instead of using raw collection CRUD.</p>
            <div className={styles.actions}>
              <Link className={styles.secondaryButton} href={`/admin/members/${memberDoc.id}`}>
                Back To Profile
              </Link>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>{memberDoc.fullName}</h2>
              <form action={updateMemberDetails} className={styles.form} encType="multipart/form-data">
                <HoneypotField />
                <input name="memberId" type="hidden" value={memberDoc.id} />

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="firstName">
                      First Name
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.firstName} id="firstName" name="firstName" required type="text" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="middleName">
                      Middle Name
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.middleName ?? ""} id="middleName" name="middleName" type="text" />
                  </div>
                </div>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="lastName">
                      Last Name
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.lastName} id="lastName" name="lastName" required type="text" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="nickname">
                      Nickname
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.nickname ?? ""} id="nickname" name="nickname" type="text" />
                  </div>
                </div>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="email">
                      Email
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.email ?? ""} id="email" name="email" type="email" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="phoneNumber">
                      Phone Number
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.phoneNumber ?? ""} id="phoneNumber" name="phoneNumber" type="text" />
                  </div>
                </div>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="whatsappNumber">
                      WhatsApp Number
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.whatsappNumber ?? ""} id="whatsappNumber" name="whatsappNumber" type="text" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="maritalStatus">
                      Marital Status
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.maritalStatus ?? ""} id="maritalStatus" name="maritalStatus" type="text" />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="profilePicture">
                    Profile Picture
                  </label>
                  <input className={styles.input} accept="image/*" id="profilePicture" name="profilePicture" type="file" />
                </div>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="nationality">
                      Nationality
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.nationality ?? ""} id="nationality" name="nationality" type="text" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="tribe">
                      Tribe
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.tribe ?? ""} id="tribe" name="tribe" type="text" />
                  </div>
                </div>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="dateOfBirth">
                      Date Of Birth
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.dateOfBirth?.slice(0, 10) ?? ""} id="dateOfBirth" name="dateOfBirth" type="date" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="dateJoined">
                      Date Joined
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.dateJoined?.slice(0, 10) ?? ""} id="dateJoined" name="dateJoined" type="date" />
                  </div>
                </div>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="instagramHandle">
                      Instagram Handle
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.instagramHandle ?? ""} id="instagramHandle" name="instagramHandle" type="text" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="facebookHandle">
                      Facebook Handle
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.facebookHandle ?? ""} id="facebookHandle" name="facebookHandle" type="text" />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="xHandle">
                    X Handle
                  </label>
                  <input className={styles.input} defaultValue={memberDoc.xHandle ?? ""} id="xHandle" name="xHandle" type="text" />
                </div>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="department">
                      Department
                    </label>
                    <select className={styles.select} defaultValue={relationshipValue(memberDoc.departmentId)} id="department" name="department">
                      <option value="">No department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="preferredDepartment">
                      Preferred Department
                    </label>
                    <select
                      className={styles.select}
                      defaultValue={relationshipValue(memberDoc.preferredDepartmentId)}
                      id="preferredDepartment"
                      name="preferredDepartment"
                    >
                      <option value="">No preferred department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className={styles.checkboxWrap}>
                  <input defaultChecked={Boolean(memberDoc.isNewComer)} name="isNewComer" type="checkbox" />
                  Newcomer
                </label>

                <div className={styles.doubleGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="occupation">
                      Occupation
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.occupation ?? ""} id="occupation" name="occupation" type="text" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="company">
                      Company
                    </label>
                    <input className={styles.input} defaultValue={memberDoc.company ?? ""} id="company" name="company" type="text" />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="role">
                    Role
                  </label>
                  <input className={styles.input} defaultValue={memberDoc.role ?? ""} id="role" name="role" type="text" />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="skills">
                    Skills
                  </label>
                  <textarea className={styles.textarea} defaultValue={memberDoc.skills ?? ""} id="skills" name="skills" />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="hobbies">
                    Hobbies
                  </label>
                  <textarea className={styles.textarea} defaultValue={memberDoc.hobbies ?? ""} id="hobbies" name="hobbies" />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="favoriteVerse">
                    Favorite Verse
                  </label>
                  <input className={styles.input} defaultValue={memberDoc.favoriteVerse ?? ""} id="favoriteVerse" name="favoriteVerse" type="text" />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="homeAddress">
                    Home Address
                  </label>
                  <textarea className={styles.textarea} defaultValue={memberDoc.homeAddress ?? ""} id="homeAddress" name="homeAddress" />
                </div>

                <div className={styles.actions}>
                  <button className={styles.primaryButton} type="submit">
                    Save Member
                  </button>
                  <Link className={styles.ghostButton} href={`/admin/members/${memberDoc.id}`}>
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
