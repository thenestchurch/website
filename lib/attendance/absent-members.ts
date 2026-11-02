import type { AttendanceRecord, Member } from "../domain/types.ts";

// Missing records count as absent. A present record wins over an absent record.
export const selectAbsentMembers = <T extends Pick<Member, "id" | "dateJoined" | "createdAt">>(
  members: readonly T[],
  records: readonly Pick<AttendanceRecord, "memberId" | "present" | "date">[],
  date: string,
  serviceSelected = false,
): T[] => {
  const day = date.slice(0, 10);
  const present = new Set(records
    .filter((record) => record.present && (serviceSelected || record.date.slice(0, 10) === day))
    .map((record) => record.memberId));
  return members.filter((member) => {
    const joined = member.dateJoined || member.createdAt;
    return !present.has(member.id) && (!joined || joined.slice(0, 10) <= day);
  });
};
