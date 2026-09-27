import { NextResponse, type NextRequest } from "next/server";
import { isHoneypotTriggered } from "@/lib/security/honeypot";
import {
  isOversizedPublicAttendanceBody,
  isValidPublicAttendanceQuery,
  parsePublicAttendanceEntries,
} from "@/lib/security/public-attendance";
import {
  getPublicAttendanceSearchRepository,
  getPublicAttendanceWriteRepository,
} from "@/lib/repositories/server/public-operations";

const todayValue = () => new Date().toISOString().slice(0, 10);
const takeString = (value: FormDataEntryValue | string | null) =>
  typeof value === "string" ? value.trim() : "";
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayValue();

export async function GET(request: NextRequest) {
  const query = takeString(request.nextUrl.searchParams.get("query"));
  const date = validDate(takeString(request.nextUrl.searchParams.get("date")));
  if (query.length < 2) return NextResponse.json({ members: [] });
  if (!isValidPublicAttendanceQuery(query)) {
    return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
  }

  const members = await (await getPublicAttendanceSearchRepository()).search(query, date);
  return NextResponse.json({ members: members.map((member) => ({ ...member, record: member.record ?? undefined })) });
}

export async function POST(request: NextRequest) {
  const wantsJSON = request.headers.get("accept")?.includes("application/json")
    || request.headers.get("x-requested-with") === "attendance-autosave";
  const invalidResponse = () => wantsJSON
    ? NextResponse.json({ error: "Invalid submission." }, { status: 400 })
    : NextResponse.redirect(new URL("/attendance/mark-attendance?saved=invalid", request.url), 303);
  if (isOversizedPublicAttendanceBody(request.headers.get("content-length"))) {
    return NextResponse.json({ error: "Submission is too large." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return invalidResponse();
  }
  if (isHoneypotTriggered(formData)) return invalidResponse();

  const date = validDate(takeString(formData.get("date")));
  const entries = parsePublicAttendanceEntries(formData);
  if (!entries) return invalidResponse();

  try {
    const saved = await (await getPublicAttendanceWriteRepository()).saveRegister({
      date,
      entries,
      serviceId: null,
    });
    if (wantsJSON) {
      return NextResponse.json({
        saved: saved.map((record) => ({ id: record.id, member: record.memberId, present: record.present })),
      });
    }
  } catch {
    if (wantsJSON) return NextResponse.json({ error: "Attendance could not be saved." }, { status: 400 });
    return invalidResponse();
  }

  return NextResponse.redirect(new URL("/attendance/mark-attendance?saved=1", request.url), 303);
}
