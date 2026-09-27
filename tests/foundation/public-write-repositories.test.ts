import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabasePublicAttendanceWriteRepository,
  createSupabasePublicMemberWriteRepository,
  createSupabasePublicReportWriteRepository,
} from "../../lib/repositories/supabase/public-writes.ts";
import {
  createSupabasePublicAttendanceSearchRepository,
  createSupabasePublicDepartmentRepository,
  createSupabasePublicReportContentRepository,
  createSupabasePublicServiceRepository,
} from "../../lib/repositories/supabase/public-reads.ts";
import { createSupabasePublicMediaRepository } from "../../lib/repositories/supabase/public-media.ts";
import type {
  AttendanceRecordRow,
  Database,
  MemberRow,
  MediaRow,
  ServiceReportRow,
} from "../../lib/supabase/database.types.ts";

const mediaRow: MediaRow = {
  alt: "Ada profile picture", created_at: "2026-08-30T00:00:00Z", filename: "ada.jpg",
  filesize: 3, focal_x: null, focal_y: null, height: null, id: 6, legacy_path: null,
  mime_type: "image/jpeg", storage_path: "members/test.jpg", thumbnail_u_r_l: null,
  updated_at: "2026-08-30T00:00:00Z", url: "https://example.test/ada.jpg", width: null,
};

const memberRow: MemberRow = {
  available_days: [], born_again: false, church_interests: null, company: null, course: null,
  created_at: "2026-08-30T00:00:00Z", date_joined: null, date_of_birth: null,
  department_id: null, email: null, facebook_handle: null, favorite_verse: null,
  first_name: "Ada", full_name: "Ada Nwosu", hobbies: null, home_address: null, id: 1,
  instagram_handle: null, institution: null, is_new_comer: true, last_name: "Nwosu",
  legacy_profile_picture_url: null, marital_status: null, middle_name: null, nationality: null,
  nickname: null, occupation: null, phone_number: null, preferred_department_id: null,
  previous_church: null, profile_picture_id: null, role: null, skills: null, tribe: null,
  updated_at: "2026-08-30T00:00:00Z", wants_department: false, whatsapp_number: null,
  x_handle: null, years_a_christian: null,
};

const attendanceRow: AttendanceRecordRow = {
  created_at: "2026-08-30T00:00:00Z", date: "2026-08-30", id: 2, member_id: 1,
  notes: null, present: true, service_id: null, updated_at: "2026-08-30T00:00:00Z",
};

const reportRow: ServiceReportRow = {
  approved_at: null, approved_by_id: null, attachment_url: null,
  created_at: "2026-08-30T00:00:00Z", department_attendance: 4, department_id: 3,
  id: 4, is_approved: false, report_content: "All good", service_id: 5,
  submitted_by_id: null, title: "Vibes", updated_at: "2026-08-30T00:00:00Z",
  volunteers_count: 2,
};

const fakeClient = (data: unknown, calls: unknown[]) => ({
  async rpc(name: string, args: unknown) {
    calls.push({ args, name });
    return { data, error: null };
  },
  from() {
    throw new Error("Public write adapters must not access tables directly.");
  },
}) as unknown as SupabaseClient<Database>;

test("public attendance writes use only the bounded secret RPC", async () => {
  const calls: unknown[] = [];
  const saved = await createSupabasePublicAttendanceWriteRepository(
    fakeClient([attendanceRow], calls),
    "server-secret",
  ).saveRegister({
    date: "2026-08-30",
    entries: [{ memberId: 1, notes: null, present: true }],
    serviceId: null,
  });

  assert.equal(saved[0]?.memberId, 1);
  assert.deepEqual(calls, [{
    args: {
      p_date: "2026-08-30",
      p_entries: [{ memberId: 1, notes: null, present: true }],
      p_secret: "server-secret",
    },
    name: "save_public_attendance_register",
  }]);
});

test("public member registration uses only its secret RPC", async () => {
  const calls: unknown[] = [];
  const input = {
    dateJoined: null, dateOfBirth: null, departmentId: null, email: null,
    firstName: "Ada", isNewComer: true, lastName: "Nwosu", middleName: null,
    phoneNumber: null, preferredDepartmentId: null, profilePictureId: null,
    whatsappNumber: null,
  };
  const member = await createSupabasePublicMemberWriteRepository(
    fakeClient(memberRow, calls),
    "server-secret",
  ).create(input);

  assert.equal(member.fullName, "Ada Nwosu");
  assert.deepEqual(calls, [{
    args: { p_input: input, p_secret: "server-secret" },
    name: "register_public_member",
  }]);
});

test("public reports use only the unapproved secret RPC", async () => {
  const calls: unknown[] = [];
  const input = {
    attachmentUrl: null, departmentAttendance: 4, departmentId: 3,
    reportContent: "All good", serviceId: 5, title: "Vibes", volunteersCount: 2,
  };
  const report = await createSupabasePublicReportWriteRepository(
    fakeClient(reportRow, calls),
    "server-secret",
  ).create(input);

  assert.equal(report.isApproved, false);
  assert.deepEqual(calls, [{
    args: { p_input: input, p_secret: "server-secret" },
    name: "submit_public_service_report",
  }]);
});

test("public reads use narrow RPCs without direct table access", async () => {
  const calls: unknown[] = [];
  const responses: Record<string, unknown> = {
    list_public_departments: [{ id: 3, name: "Vibes" }],
    list_public_report_instructions: [{ content: "Include wins", department_id: 3, id: 7, title: "Guidance" }],
    list_public_report_templates: [{ applicable_department_ids: [3], content: "Summary", id: 8, title: "Weekly" }],
    list_public_services: [{ date: "2026-08-30", id: 5, name: "Sunday Service", service_type: "sunday-service" }],
  };
  const client = {
    async rpc(name: string, args: unknown) {
      calls.push({ args, name });
      return { data: responses[name], error: null };
    },
    from() {
      throw new Error("Public read adapters must not access tables directly.");
    },
  } as unknown as SupabaseClient<Database>;

  const departments = await createSupabasePublicDepartmentRepository(client).findActive();
  const services = await createSupabasePublicServiceRepository(client).findActive();
  const content = createSupabasePublicReportContentRepository(client);

  assert.equal(departments[0]?.name, "Vibes");
  assert.equal(services[0]?.name, "Sunday Service");
  assert.equal((await content.findActiveInstructions())[0]?.departmentId, 3);
  assert.deepEqual((await content.findActiveTemplates())[0]?.applicableDepartmentIds, [3]);
  assert.deepEqual(calls.map((call) => (call as { name: string }).name), [
    "list_public_departments",
    "list_public_services",
    "list_public_report_instructions",
    "list_public_report_templates",
  ]);
});

test("public attendance search sends its server secret only to the bounded RPC", async () => {
  const calls: unknown[] = [];
  const members = await createSupabasePublicAttendanceSearchRepository(
    fakeClient([{
      department_name: "Vibes", first_name: "Ada", full_name: "Ada Nwosu",
      id: 1, record_id: 9, record_present: true,
    }], calls),
    "server-secret",
  ).search("Ada", "2026-08-30");

  assert.deepEqual(members[0]?.record, { id: 9, present: true });
  assert.deepEqual(calls, [{
    args: { p_date: "2026-08-30", p_query: "Ada", p_secret: "server-secret" },
    name: "search_public_attendance_members",
  }]);
});

test("public media uses privileged access only for Storage and a narrow RPC for its row", async () => {
  const rpcCalls: unknown[] = [];
  const storageCalls: unknown[] = [];
  const storageClient = {
    from() {
      throw new Error("The privileged public-media client must not access database tables.");
    },
    storage: {
      from(bucket: string) {
        return {
          getPublicUrl(storagePath: string) {
            return { data: { publicUrl: `https://example.test/${storagePath}` } };
          },
          async remove(paths: string[]) {
            storageCalls.push({ paths, type: "remove" });
            return { data: null, error: null };
          },
          async upload(storagePath: string, bytes: Uint8Array, options: unknown) {
            storageCalls.push({ bucket, bytes: [...bytes], options, storagePath, type: "upload" });
            return { data: { path: storagePath }, error: null };
          },
        };
      },
    },
  } as unknown as SupabaseClient<Database>;

  const media = await createSupabasePublicMediaRepository(
    storageClient,
    fakeClient(mediaRow, rpcCalls),
    "server-secret",
  ).create({
    alt: "Ada profile picture",
    bytes: new Uint8Array([1, 2, 3]),
    filename: "ada.jpg",
    mimeType: "image/jpeg",
  });

  assert.equal(media.id, 6);
  const upload = storageCalls[0] as { bucket: string; storagePath: string; type: string };
  assert.equal(upload.bucket, "member-profile-pictures");
  assert.equal(upload.type, "upload");
  assert.match(upload.storagePath, /^members\/[0-9a-f-]{36}\.jpg$/);
  const rpc = rpcCalls[0] as { args: { p_input: { storagePath: string }; p_secret: string }; name: string };
  assert.equal(rpc.name, "register_public_media");
  assert.equal(rpc.args.p_secret, "server-secret");
  assert.equal(rpc.args.p_input.storagePath, upload.storagePath);
});
