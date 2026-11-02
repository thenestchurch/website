import assert from "node:assert/strict";
import test from "node:test";
import { getChurchDate, isCalendarDate } from "../../lib/dates/church-date.ts";

test("church dates switch at Lagos midnight rather than UTC midnight", () => {
  assert.equal(getChurchDate(new Date("2026-11-01T22:59:59Z")), "2026-11-01");
  assert.equal(getChurchDate(new Date("2026-11-01T23:00:00Z")), "2026-11-02");
  assert.equal(getChurchDate(new Date("2026-12-31T23:30:00Z")), "2027-01-01");
});

test("calendar dates reject impossible days and malformed values", () => {
  for (const value of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-00-01", "2026-11-00", "2026-1-1", "invalid"]) {
    assert.equal(isCalendarDate(value), false, value);
  }
  assert.equal(isCalendarDate("2028-02-29"), true);
  assert.equal(isCalendarDate("2026-11-02"), true);
});
