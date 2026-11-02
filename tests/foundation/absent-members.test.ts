import assert from "node:assert/strict";
import test from "node:test";
import { selectAbsentMembers } from "../../lib/attendance/absent-members.ts";

const members = [
  { id: 1, dateJoined: "2026-10-01", createdAt: "2026-10-01" },
  { id: 2, dateJoined: "2026-10-01", createdAt: "2026-10-01" },
  { id: 3, dateJoined: null, createdAt: "2026-10-01" },
  { id: 4, dateJoined: "2026-11-03", createdAt: "2026-11-03" },
  { id: 5, dateJoined: null, createdAt: "2026-11-03" },
];

test("absence includes missing and false records, excludes present and future joiners", () => {
  const records = [
    { memberId: 1, present: true, date: "2026-11-01T10:00:00Z" },
    { memberId: 1, present: false, date: "2026-11-01T00:00:00Z" },
    { memberId: 2, present: false, date: "2026-11-01T00:00:00Z" },
    { memberId: 3, present: true, date: "2026-10-25T00:00:00Z" },
  ];
  assert.deepEqual(selectAbsentMembers(members, records, "2026-11-01").map((member) => member.id), [2, 3]);
});

test("service absence uses the already scoped service records", () => {
  const records = [{ memberId: 2, present: true, date: "2026-11-01T10:00:00Z" }];
  assert.deepEqual(selectAbsentMembers(members, records, "2026-11-01T10:00:00Z", true).map((member) => member.id), [1, 3]);
});
