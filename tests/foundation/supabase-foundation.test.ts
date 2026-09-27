import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseDepartmentRepository } from "../../lib/repositories/supabase/departments.ts";
import { createSupabaseServiceRepository } from "../../lib/repositories/supabase/services.ts";
import { mapDepartmentRow, mapServiceRow } from "../../lib/repositories/supabase/mappers.ts";
import { RepositoryError } from "../../lib/repositories/errors.ts";
import type { Database } from "../../lib/supabase/database.types.ts";
import {
  readPublicOperationsSecret,
  readSupabasePrivilegedEnvironment,
  readSupabasePublicEnvironment,
} from "../../lib/supabase/environment.ts";

type FakeResult = {
  data: unknown;
  error: { code: string } | null;
};

const createFakeClient = (result: FakeResult, calls: string[]) => {
  const builder = {
    eq(column: string, value: unknown) {
      calls.push(`eq:${column}:${String(value)}`);
      return builder;
    },
    maybeSingle() {
      calls.push("maybeSingle");
      return Promise.resolve(result);
    },
    order(column: string, options: { ascending: boolean }) {
      calls.push(`order:${column}:${String(options.ascending)}`);
      return Promise.resolve(result);
    },
    select(columns: string) {
      calls.push(`select:${columns}`);
      return builder;
    },
  };

  return {
    from(table: string) {
      calls.push(`from:${table}`);
      return builder;
    },
  } as unknown as SupabaseClient<Database>;
};

test("Supabase environment parsing is inert and validates required values", () => {
  assert.deepEqual(
    readSupabasePublicEnvironment({
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      SUPABASE_URL: "https://example.supabase.co",
    }),
    {
      publishableKey: "public-key",
      url: "https://example.supabase.co",
    },
  );

  assert.throws(
    () => readSupabasePublicEnvironment({ SUPABASE_URL: "https://example.supabase.co" }),
    /SUPABASE_PUBLISHABLE_KEY is required/,
  );
});

test("server-only Supabase secrets fail closed when absent", () => {
  assert.deepEqual(
    readSupabasePrivilegedEnvironment({
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      SUPABASE_SECRET_KEY: "secret-key",
      SUPABASE_URL: "https://example.supabase.co",
    }),
    {
      publishableKey: "public-key",
      secretKey: "secret-key",
      url: "https://example.supabase.co",
    },
  );
  assert.equal(readPublicOperationsSecret({ PUBLIC_OPERATIONS_SECRET: "rpc-secret" }), "rpc-secret");
  assert.throws(() => readPublicOperationsSecret({}), /PUBLIC_OPERATIONS_SECRET is required/);
});

test("department rows map into application domain objects", () => {
  assert.deepEqual(
    mapDepartmentRow({
      created_at: "2026-08-01T00:00:00.000Z",
      description: null,
      id: 44,
      is_active: null,
      name: "THE VIBES – MUSIC DEPARTMENT",
      reporting_channel: "WhatsApp",
      slug: null,
      updated_at: "2026-08-02T00:00:00.000Z",
    }),
    {
      createdAt: "2026-08-01T00:00:00.000Z",
      description: null,
      id: 44,
      isActive: true,
      name: "THE VIBES – MUSIC DEPARTMENT",
      reportingChannel: "WhatsApp",
      slug: null,
      updatedAt: "2026-08-02T00:00:00.000Z",
    },
  );
});

test("service rows map into application domain objects", () => {
  const service = mapServiceRow({
    created_at: "2026-08-01T00:00:00.000Z",
    date: "2026-08-30T00:00:00.000Z",
    end_time: "12:00",
    id: 12,
    is_active: true,
    name: "Sunday Service",
    notes: null,
    service_type: "sunday-service",
    start_time: "09:00",
    updated_at: "2026-08-02T00:00:00.000Z",
  });

  assert.equal(service.serviceType, "sunday-service");
  assert.equal(service.date, "2026-08-30T00:00:00.000Z");
  assert.equal(service.isActive, true);
});

test("department repository performs the expected active sorted query", async () => {
  const calls: string[] = [];
  const client = createFakeClient(
    {
      data: [
        {
          created_at: "2026-08-01T00:00:00.000Z",
          description: null,
          id: 1,
          is_active: true,
          name: "Acoustic",
          reporting_channel: null,
          slug: "acoustic",
          updated_at: "2026-08-02T00:00:00.000Z",
        },
      ],
      error: null,
    },
    calls,
  );

  const departments = await createSupabaseDepartmentRepository(client).findActive();

  assert.deepEqual(calls, [
    "from:departments",
    "select:*",
    "eq:is_active:true",
    "order:name:true",
  ]);
  assert.equal(departments[0]?.name, "Acoustic");
});

test("service repository uses maybeSingle for ID lookups", async () => {
  const calls: string[] = [];
  const client = createFakeClient({ data: null, error: null }, calls);

  const service = await createSupabaseServiceRepository(client).findById(42);

  assert.equal(service, null);
  assert.deepEqual(calls, ["from:services", "select:*", "eq:id:42", "maybeSingle"]);
});

test("repository errors do not expose raw database messages", async () => {
  const calls: string[] = [];
  const client = createFakeClient(
    {
      data: null,
      error: { code: "42501" },
    },
    calls,
  );

  await assert.rejects(
    createSupabaseDepartmentRepository(client).findById(3),
    (error: unknown) =>
      error instanceof RepositoryError &&
      error.message === "The department could not be loaded." &&
      error.causeCode === "42501",
  );
});
