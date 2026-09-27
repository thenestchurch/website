import assert from "node:assert/strict";
import test from "node:test";
import {
  PUBLIC_ATTENDANCE_ENTRY_LIMIT,
  PUBLIC_ATTENDANCE_MAX_BODY_BYTES,
  PUBLIC_ATTENDANCE_MAX_QUERY_LENGTH,
  isOversizedPublicAttendanceBody,
  isValidPublicAttendanceQuery,
  parsePublicAttendanceEntries,
} from "../../lib/security/public-attendance.ts";

test("public attendance search queries have strict minimum and maximum lengths", () => {
  assert.equal(isValidPublicAttendanceQuery("a"), false);
  assert.equal(isValidPublicAttendanceQuery("ab"), true);
  assert.equal(isValidPublicAttendanceQuery("a".repeat(PUBLIC_ATTENDANCE_MAX_QUERY_LENGTH)), true);
  assert.equal(isValidPublicAttendanceQuery("a".repeat(PUBLIC_ATTENDANCE_MAX_QUERY_LENGTH + 1)), false);
});

test("public attendance rejects oversized or malformed Content-Length values", () => {
  assert.equal(isOversizedPublicAttendanceBody(null), false);
  assert.equal(isOversizedPublicAttendanceBody(String(PUBLIC_ATTENDANCE_MAX_BODY_BYTES)), false);
  assert.equal(isOversizedPublicAttendanceBody(String(PUBLIC_ATTENDANCE_MAX_BODY_BYTES + 1)), true);
  assert.equal(isOversizedPublicAttendanceBody("not-a-size"), true);
  assert.equal(isOversizedPublicAttendanceBody("999999999999999999999999999999"), true);
});

test("public attendance parses a non-empty bounded register", () => {
  const formData = new FormData();
  formData.append("memberIds", "7");
  formData.append("memberIds", "9");
  formData.append("presentMembers", "7");
  formData.append("existing_9", "42");

  assert.deepEqual(parsePublicAttendanceEntries(formData), [
    { memberId: 7, notes: null, present: true },
    { memberId: 9, notes: null, present: false },
  ]);
});

test("public attendance rejects empty, invalid, unrelated, and excessive entries", () => {
  assert.equal(parsePublicAttendanceEntries(new FormData()), null);

  const invalid = new FormData();
  invalid.append("memberIds", "1.5");
  invalid.append("presentMembers", "1");
  assert.equal(parsePublicAttendanceEntries(invalid), null);

  const unrelated = new FormData();
  unrelated.append("memberIds", "1");
  unrelated.append("presentMembers", "2");
  assert.equal(parsePublicAttendanceEntries(unrelated), null);

  const excessive = new FormData();
  for (let index = 1; index <= PUBLIC_ATTENDANCE_ENTRY_LIMIT + 1; index += 1) {
    excessive.append("memberIds", String(index));
    excessive.append("presentMembers", String(index));
  }
  assert.equal(parsePublicAttendanceEntries(excessive), null);

  const noSelection = new FormData();
  noSelection.append("memberIds", "1");
  assert.equal(parsePublicAttendanceEntries(noSelection), null);
});
