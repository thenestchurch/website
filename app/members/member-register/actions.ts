"use server";

import { redirect } from "next/navigation";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import { validateProfileImageFile } from "@/lib/security/profile-image";
import {
  getPublicMediaRepository,
  getPublicMemberWriteRepository,
} from "@/lib/repositories/server/public-operations";

const takeString = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

const takeOptionalRelationshipID = (value: FormDataEntryValue | null) => {
  const rawValue = takeString(value);

  if (!rawValue) {
    return undefined;
  }

  const relationshipID = Number(rawValue);
  return Number.isInteger(relationshipID) && relationshipID > 0 ? relationshipID : undefined;
};

const createUploadedProfilePicture = async (file: FormDataEntryValue | null, fullName: string) => {
  if (!(file instanceof File) || file.size === 0) {
    return undefined;
  }
  const validated = await validateProfileImageFile(file);
  if (!validated) {
    redirect("/members/member-register?saved=invalid");
  }

  const media = await (await getPublicMediaRepository()).create({
    alt: `${fullName || "Member"} profile picture`,
    bytes: validated.bytes,
    filename: file.name,
    mimeType: validated.mimeType,
  });

  return media.id;
};

export async function registerPublicMember(formData: FormData) {
  if (isHoneypotTriggered(formData)) {
    redirect("/members/member-register?saved=invalid");
  }

  const firstName = takeString(formData.get("firstName"));
  const middleName = takeString(formData.get("middleName"));
  const lastName = takeString(formData.get("lastName"));
  const email = takeString(formData.get("email"));
  const phoneNumber = takeString(formData.get("phoneNumber"));
  const whatsappNumber = takeString(formData.get("whatsappNumber"));
  const dateOfBirth = takeString(formData.get("dateOfBirth"));
  const dateJoined = takeString(formData.get("dateJoined"));
  const department = takeOptionalRelationshipID(formData.get("department"));
  const preferredDepartment = takeOptionalRelationshipID(formData.get("preferredDepartment"));

  if (!firstName || !lastName) {
    redirect("/members/member-register?saved=invalid");
  }

  try {
    const profilePicture = await createUploadedProfilePicture(
      formData.get("profilePicture"),
      `${firstName} ${lastName}`.trim(),
    );

    await (await getPublicMemberWriteRepository()).create({
      dateJoined: dateJoined || null,
      dateOfBirth: dateOfBirth || null,
      departmentId: department ?? null,
      email: email || null,
      firstName,
      isNewComer: true,
      lastName,
      middleName: middleName || null,
      phoneNumber: phoneNumber || null,
      preferredDepartmentId: preferredDepartment ?? null,
      profilePictureId: profilePicture ?? null,
      whatsappNumber: whatsappNumber || null,
    });
  } catch {
    redirect("/members/member-register?saved=error");
  }

  redirect("/attendance/mark-attendance?registered=1");
}
