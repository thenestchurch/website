import type { AttendanceRegisterEntry } from "../domain/types.ts";

export const PUBLIC_ATTENDANCE_ENTRY_LIMIT = 40;
export const PUBLIC_ATTENDANCE_MAX_BODY_BYTES = 64 * 1024;
export const PUBLIC_ATTENDANCE_MAX_QUERY_LENGTH = 100;

const parsePositiveInteger = (value: FormDataEntryValue) => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const parseBoundedIDs = (
  values: FormDataEntryValue[],
  maximum: number,
  required: boolean,
) => {
  if ((required && values.length === 0) || values.length > maximum) return null;

  const parsed = values.map(parsePositiveInteger);
  if (parsed.some((value) => value === null)) return null;

  return [...new Set(parsed as number[])];
};

export const isOversizedPublicAttendanceBody = (contentLength: string | null) => {
  if (contentLength === null) return false;

  const normalized = contentLength.trim();
  if (!/^\d+$/.test(normalized)) return true;

  return BigInt(normalized) > BigInt(PUBLIC_ATTENDANCE_MAX_BODY_BYTES);
};

export const isValidPublicAttendanceQuery = (query: string) =>
  query.length >= 2 && query.length <= PUBLIC_ATTENDANCE_MAX_QUERY_LENGTH;

export const parsePublicAttendanceEntries = (
  formData: FormData,
): AttendanceRegisterEntry[] | null => {
  const memberIDs = parseBoundedIDs(
    formData.getAll("memberIds"),
    PUBLIC_ATTENDANCE_ENTRY_LIMIT,
    true,
  );
  const presentIDs = parseBoundedIDs(
    formData.getAll("presentMembers"),
    PUBLIC_ATTENDANCE_ENTRY_LIMIT,
    false,
  );

  if (!memberIDs || !presentIDs) return null;

  const memberSet = new Set(memberIDs);
  if (presentIDs.some((memberID) => !memberSet.has(memberID))) return null;

  const presentSet = new Set(presentIDs);
  const entries = memberIDs
    .filter((memberID) => {
      const existingRecordID = parsePositiveInteger(formData.get(`existing_${memberID}`) ?? "");
      return presentSet.has(memberID) || existingRecordID !== null;
    })
    .map((memberID) => ({
      memberId: memberID,
      notes: null,
      present: presentSet.has(memberID),
    }));

  return entries.length > 0 ? entries : null;
};
