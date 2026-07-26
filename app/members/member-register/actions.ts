"use server";

import configPromise from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const takeString = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

const takeOptionalRelationshipID = (value: FormDataEntryValue | null) => {
  const rawValue = takeString(value);

  if (!rawValue) {
    return undefined;
  }

  const relationshipID = Number(rawValue);
  return Number.isInteger(relationshipID) && relationshipID > 0 ? relationshipID : undefined;
};

const createUploadedProfilePicture = async ({
  file,
  fullName,
  payload,
}: {
  file: FormDataEntryValue | null;
  fullName: string;
  payload: Awaited<ReturnType<typeof getPayload>>;
}) => {
  if (!(file instanceof File) || file.size === 0) {
    return undefined;
  }

  const media = await payload.create({
    collection: "media",
    data: {
      alt: `${fullName || "Member"} profile picture`,
    },
    file: {
      data: Buffer.from(await file.arrayBuffer()),
      mimetype: file.type,
      name: file.name,
      size: file.size,
    },
    overrideAccess: true,
  });

  return media.id;
};

export async function registerPublicMember(formData: FormData) {
  const payload = await getPayload({
    config: configPromise,
    key: "thenestchurch-app",
  });

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
    const profilePicture = await createUploadedProfilePicture({
      file: formData.get("profilePicture"),
      fullName: `${firstName} ${lastName}`.trim(),
      payload,
    });

    await payload.create({
      collection: "members",
      data: {
        dateJoined: dateJoined || undefined,
        dateOfBirth: dateOfBirth || undefined,
        department,
        email: email || undefined,
        firstName,
        isNewComer: true,
        lastName,
        middleName: middleName || undefined,
        phoneNumber: phoneNumber || undefined,
        preferredDepartment,
        profilePicture,
        whatsappNumber: whatsappNumber || undefined,
      },
      overrideAccess: true,
    });
  } catch {
    redirect("/members/member-register?saved=error");
  }

  redirect("/attendance/mark-attendance?registered=1");
}
