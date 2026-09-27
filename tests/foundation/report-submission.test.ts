import assert from "node:assert/strict";
import test from "node:test";
import { parseServiceReportForm } from "../../lib/validation/report-forms.ts";
import { reportSubmissionErrorCode } from "../../lib/validation/report-submission-error.ts";
import { RepositoryError } from "../../lib/repositories/errors.ts";

const form = () => {
  const data = new FormData();
  data.set("service", "5");
  data.set("department", "999");
  data.set("reportContent", "Sunday service report");
  return data;
};

test("department-head report uses the assigned department and defaults empty counts to zero", () => {
  const result = parseServiceReportForm(form(), 3);
  assert.equal(result?.departmentId, 3);
  assert.equal(result?.departmentAttendance, 0);
  assert.equal(result?.volunteersCount, 0);
});

test("report counts must fit nonnegative database integers", () => {
  for (const field of ["departmentAttendance", "volunteersCount"]) {
    for (const value of ["1.5", "-1", "NaN", "Infinity", "2147483648"]) {
      const data = form(); data.set(field, value);
      assert.equal(parseServiceReportForm(data, 3), null, `${field}: ${value}`);
    }
  }
  const data = form(); data.set("departmentAttendance", "12");
  assert.equal(parseServiceReportForm(data, 3)?.departmentAttendance, 12);
});

test("only a database uniqueness error is presented as a duplicate report", () => {
  assert.equal(reportSubmissionErrorCode(new RepositoryError("Save failed", "23505")), "duplicate");
  assert.equal(reportSubmissionErrorCode(new RepositoryError("Save failed", "42501")), "forbidden");
  assert.equal(reportSubmissionErrorCode(new RepositoryError("Save failed", "22P02")), "invalid");
  assert.equal(reportSubmissionErrorCode(new RepositoryError("Save failed", "PGRST205")), "failed");
  assert.equal(reportSubmissionErrorCode(new Error("network unavailable")), "failed");
});
