import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
  hasAnyRole,
  isAbsenteeViewerOnly,
  isDepartmentLeadOnly,
  requireAnyRole,
  requireDepartmentAccess,
  requireDepartmentLead,
  type AuthenticatedActor,
} from "../../lib/auth/authorization.ts";
import { getAdminPortalRedirect } from "../../lib/auth/admin-portal-access.ts";
import { getDepartmentHeadPortalRedirect } from "../../lib/auth/department-head-portal-access.ts";

const actor = (overrides: Partial<AuthenticatedActor> = {}): AuthenticatedActor => ({
  adminId: 1,
  authUserId: "00000000-0000-0000-0000-000000000001",
  departmentId: null,
  email: "user@example.com",
  isActive: true,
  isSuperAdmin: false,
  name: "Test User",
  roles: ["staff"],
  ...overrides,
});

test("super admins satisfy every role check", () => {
  assert.equal(hasAnyRole(actor({ isSuperAdmin: true, roles: [] }), ["admin"]), true);
});

test("inactive users fail role checks even when a role matches", () => {
  assert.equal(hasAnyRole(actor({ isActive: false }), ["staff"]), false);
  assert.throws(() => requireAnyRole(actor({ isActive: false }), ["staff"]), AuthorizationError);
});

test("department-lead-only parity excludes users who are also staff", () => {
  assert.equal(isDepartmentLeadOnly(actor({ roles: ["department-lead"] })), true);
  assert.equal(isDepartmentLeadOnly(actor({ roles: ["department-lead", "staff"] })), false);
});

test("absentee-viewer-only parity excludes users who are also admin", () => {
  assert.equal(isAbsenteeViewerOnly(actor({ roles: ["absentee-viewer"] })), true);
  assert.equal(isAbsenteeViewerOnly(actor({ roles: ["absentee-viewer", "admin"] })), false);
});

test("department heads require an assigned department", () => {
  assert.throws(
    () => requireDepartmentLead(actor({ departmentId: null, roles: ["department-lead"] })),
    AuthorizationError,
  );
});

test("department heads cannot cross department boundaries", () => {
  const departmentHead = actor({ departmentId: 10, roles: ["department-lead"] });

  assert.equal(requireDepartmentAccess(departmentHead, 10), departmentHead);
  assert.throws(() => requireDepartmentAccess(departmentHead, 11), AuthorizationError);
});

test("staff can access any department", () => {
  const staff = actor({ roles: ["staff"] });
  assert.equal(requireDepartmentAccess(staff, 99), staff);
});

test("admin portal redirects preserve login, department, and forbidden behavior", () => {
  assert.equal(getAdminPortalRedirect(null), "/admin/login");
  assert.equal(
    getAdminPortalRedirect(
      actor({ departmentId: 44, roles: ["department-lead"] }),
      ["admin", "staff"],
    ),
    "/department-head/reports/submit",
  );
  assert.equal(
    getAdminPortalRedirect(actor({ roles: ["absentee-viewer"] }), ["admin", "staff"]),
    "/admin?error=forbidden",
  );
  assert.equal(getAdminPortalRedirect(actor({ roles: ["staff"] }), ["admin", "staff"]), null);
});

test("department-head portal redirects preserve login, role, and assignment behavior", () => {
  assert.equal(getDepartmentHeadPortalRedirect(null), "/department-head/login");
  assert.equal(
    getDepartmentHeadPortalRedirect(actor({ roles: ["staff"] })),
    "/department-head/login?error=wrongPortal",
  );
  assert.equal(
    getDepartmentHeadPortalRedirect(actor({ departmentId: null, roles: ["department-lead"] })),
    "/department-head/login?error=noDepartment",
  );
  assert.equal(
    getDepartmentHeadPortalRedirect(actor({ departmentId: 3, roles: ["department-lead"] })),
    null,
  );
});
