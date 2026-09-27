"use server";

import { redirect } from "next/navigation";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import { validateProfileImageFile } from "@/lib/security/profile-image";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import { getServerMediaRepository } from "@/lib/repositories/server/media";
import { getServerMemberWriteRepository } from "@/lib/repositories/server/member-writes";

const takeString = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");

const createUploadedProfilePicture = async (
  file: FormDataEntryValue | null,
  fullName: string,
  actor: Awaited<ReturnType<typeof requireServerAdminActor>>,
) => {
  if (!(file instanceof File) || file.size === 0) {
    return undefined;
  }
  const validated = await validateProfileImageFile(file);
  if (!validated) {
    redirect("/admin/members?updated=invalid");
  }

  const mediaRepository = await getServerMediaRepository(actor);
  const media = await mediaRepository.create({
    alt: `${fullName || "Member"} profile picture`,
    bytes: validated.bytes,
    filename: file.name,
    mimeType: validated.mimeType,
  });

  return media.id;
};

export async function markMemberAsRegular(formData: FormData) {
  const memberValue = formData.get("memberId");
  const returnToValue = formData.get("returnTo");
  const memberID = Number(memberValue);
  const returnTo = typeof returnToValue === "string" && returnToValue.startsWith("/admin")
    ? returnToValue
    : "/admin/members/newcomers";

  if (isHoneypotTriggered(formData)) {
    redirect(`${returnTo}?updated=invalid`);
  }

  if (!Number.isFinite(memberID)) {
    redirect(`${returnTo}?updated=invalid`);
  }

  const actor = await requireServerAdminActor(["admin", "staff"]);
  await (await getServerMemberWriteRepository(actor)).markAsRegular(memberID);

  redirect(`${returnTo}?updated=regular`);
}

export async function updateMemberDetails(formData: FormData) {
  if (isHoneypotTriggered(formData)) {
    redirect("/admin/members?updated=invalid");
  }

  const memberID = Number(takeString(formData.get("memberId")));

  if (!Number.isFinite(memberID)) {
    redirect("/admin/members?updated=invalid");
  }

  const relationshipOrNull = (key: string) => {
    const value = takeString(formData.get(key)).trim();
    if (!value) {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const optionalString = (key: string) => {
    const value = takeString(formData.get(key)).trim();
    return value || null;
  };

  const actor = await requireServerAdminActor(["admin", "staff"]);
  const firstName = takeString(formData.get("firstName")).trim();
  const lastName = takeString(formData.get("lastName")).trim();
  if (!firstName || !lastName) redirect("/admin/members?updated=invalid");
  const profilePicture = await createUploadedProfilePicture(
    formData.get("profilePicture"),
    `${firstName} ${lastName}`,
    actor,
  );

  await (await getServerMemberWriteRepository(actor)).update(memberID, {
      company: optionalString("company"),
      dateJoined: optionalString("dateJoined"),
      dateOfBirth: optionalString("dateOfBirth"),
      departmentId: relationshipOrNull("department"),
      email: optionalString("email"),
      favoriteVerse: optionalString("favoriteVerse"),
      firstName,
      hobbies: optionalString("hobbies"),
      homeAddress: optionalString("homeAddress"),
      isNewComer: takeString(formData.get("isNewComer")) === "on",
      lastName,
      maritalStatus: optionalString("maritalStatus"),
      middleName: optionalString("middleName"),
      nationality: optionalString("nationality"),
      nickname: optionalString("nickname"),
      occupation: optionalString("occupation"),
      phoneNumber: optionalString("phoneNumber"),
      preferredDepartmentId: relationshipOrNull("preferredDepartment"),
      role: optionalString("role"),
      skills: optionalString("skills"),
      tribe: optionalString("tribe"),
      whatsappNumber: optionalString("whatsappNumber"),
      facebookHandle: optionalString("facebookHandle"),
      instagramHandle: optionalString("instagramHandle"),
      ...(profilePicture ? { profilePictureId: profilePicture } : {}),
      xHandle: optionalString("xHandle"),
  });

  redirect(`/admin/members/${memberID}?updated=1`);
}
