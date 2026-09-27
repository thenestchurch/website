import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("missing or expired sessions resolve to a signed-out actor instead of rejecting the page", async () => {
  const source = readFileSync(new URL("../../lib/auth/server-actor.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const mocks = {
    "server-only": {},
    react: { cache: (fn) => fn },
    "../supabase/server.ts": { createSupabaseServerClient: async () => ({}) },
    "./actor-resolution.ts": { resolveAuthenticatedActor: async () => { throw new Error("Session missing"); } },
    "./supabase-data-source.ts": { createSupabaseActorDataSource: () => ({}) },
  };
  const context = { exports: {}, require: (name) => mocks[name] };
  vm.runInNewContext(outputText, context);
  assert.equal(await context.exports.getServerAuthenticatedActor(), null);
});
