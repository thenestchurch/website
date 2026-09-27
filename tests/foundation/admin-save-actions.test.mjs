import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
for (const [kind, actionName, successPath] of [
  ["accounts", "saveAdminAccount", "/admin/accounts?updated=42"],
  ["departments", "saveDepartment", "/admin/departments/42?saved=1"],
]) {
  for (const succeeds of [true, false]) {
    test(`${kind} save redirects to ${succeeds ? "success" : "error"} after repository result`, async () => {
      const source = readFileSync(new URL(`../../app/admin/${kind}/actions.ts`, import.meta.url), "utf8");
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      });
      const repository = { async save() {
        if (!succeeds) throw new Error("Database rejected save");
        return { id: 42 };
      } };
      const mocks = {
        "next/navigation": { redirect(path) { throw Object.assign(new Error("NEXT_REDIRECT"), { path }); } },
        "@/lib/auth/server-admin-context": { requireServerAdminActor: async () => ({ adminId: 1 }) },
        "@/lib/security/honeypot": { isHoneypotTriggered: () => false },
        "@/lib/validation/admin-account-forms": { parseAdminAccountForm: () => ({}) },
        "@/lib/validation/department-forms": { parseDepartmentForm: () => ({}) },
        "@/lib/repositories/server/admin-accounts": { getServerAdminAccountRepository: async () => repository },
        "@/lib/repositories/server/department-writes": { getServerDepartmentWriteRepository: async () => repository },
      };
      const context = { exports: {}, require: (name) => mocks[name] ?? require(name) };
      vm.runInNewContext(outputText, context);
      await assert.rejects(context.exports[actionName](new FormData()), (error) => {
        assert.equal(error.path, succeeds ? successPath : `/admin/${kind}/new?saved=invalid`);
        return true;
      });
    });
  }
}
