import type {
  AttendanceRecord,
  AttendanceRecordWithMember,
  Department,
  MediaAsset,
  Member,
  ReportInstruction,
  ReportTemplate,
  Service,
  ServiceReport,
} from "../../domain/types.ts";
import type {
  AttendanceRecordRow,
  DepartmentRow,
  MemberRow,
  MediaRow,
  ReportInstructionRow,
  ReportTemplateRow,
  ServiceRow,
  ServiceReportRow,
} from "../../supabase/database.types.ts";

const memberFullName = (firstName: string, middleName: string | null, lastName: string) =>
  [firstName, middleName, lastName].filter(Boolean).join(" ");

export const mapDepartmentRow = (row: DepartmentRow): Department => ({
  createdAt: row.created_at,
  description: row.description,
  id: row.id,
  isActive: row.is_active ?? true,
  name: row.name,
  reportingChannel: row.reporting_channel,
  slug: row.slug,
  updatedAt: row.updated_at,
});

export const mapServiceRow = (row: ServiceRow): Service => ({
  createdAt: row.created_at,
  date: row.date,
  endTime: row.end_time,
  id: row.id,
  isActive: row.is_active ?? true,
  name: row.name,
  notes: row.notes,
  serviceType: row.service_type,
  startTime: row.start_time,
  updatedAt: row.updated_at,
});

export const mapMemberRow = (row: MemberRow): Member => ({
  availableDays: row.available_days ?? [],
  bornAgain: row.born_again ?? false,
  churchInterests: row.church_interests,
  company: row.company,
  course: row.course,
  createdAt: row.created_at,
  dateJoined: row.date_joined,
  dateOfBirth: row.date_of_birth,
  departmentId: row.department_id,
  email: row.email,
  facebookHandle: row.facebook_handle,
  favoriteVerse: row.favorite_verse,
  firstName: row.first_name,
  fullName: row.full_name ?? memberFullName(row.first_name, row.middle_name, row.last_name),
  hobbies: row.hobbies,
  homeAddress: row.home_address,
  id: row.id,
  instagramHandle: row.instagram_handle,
  institution: row.institution,
  isNewComer: row.is_new_comer ?? false,
  lastName: row.last_name,
  legacyProfilePictureUrl: row.legacy_profile_picture_url,
  maritalStatus: row.marital_status,
  middleName: row.middle_name,
  nationality: row.nationality,
  nickname: row.nickname,
  occupation: row.occupation,
  phoneNumber: row.phone_number,
  preferredDepartmentId: row.preferred_department_id,
  previousChurch: row.previous_church,
  profilePictureId: row.profile_picture_id,
  role: row.role,
  skills: row.skills,
  tribe: row.tribe,
  updatedAt: row.updated_at,
  wantsDepartment: row.wants_department ?? false,
  whatsappNumber: row.whatsapp_number,
  xHandle: row.x_handle,
  yearsAChristian: row.years_a_christian,
});

export const mapMediaRow = (row: MediaRow): MediaAsset => ({
  alt: row.alt,
  createdAt: row.created_at,
  filename: row.filename,
  filesize: row.filesize,
  height: row.height,
  id: row.id,
  legacyPath: row.legacy_path,
  mimeType: row.mime_type,
  storagePath: row.storage_path,
  updatedAt: row.updated_at,
  url: row.url,
  width: row.width,
});

export const mapAttendanceRecordRow = (row: AttendanceRecordRow): AttendanceRecord => ({
  createdAt: row.created_at,
  date: row.date,
  id: row.id,
  memberId: row.member_id,
  notes: row.notes,
  present: row.present ?? false,
  serviceId: row.service_id,
  updatedAt: row.updated_at,
});

export const mapAttendanceRecordWithMemberRow = (
  row: AttendanceRecordRow & { member: MemberRow },
): AttendanceRecordWithMember => ({
  ...mapAttendanceRecordRow(row),
  member: mapMemberRow(row.member),
});

export const mapServiceReportRow = (row: ServiceReportRow): ServiceReport => ({
  approvedAt: row.approved_at,
  approvedById: row.approved_by_id,
  attachmentUrl: row.attachment_url,
  createdAt: row.created_at,
  departmentAttendance: row.department_attendance ?? 0,
  departmentId: row.department_id,
  id: row.id,
  isApproved: row.is_approved ?? false,
  reportContent: row.report_content,
  serviceId: row.service_id,
  submittedById: row.submitted_by_id,
  title: row.title,
  updatedAt: row.updated_at,
  volunteersCount: row.volunteers_count ?? 0,
});

export const mapReportInstructionRow = (row: ReportInstructionRow): ReportInstruction => ({
  content: row.content,
  createdAt: row.created_at,
  departmentId: row.department_id,
  id: row.id,
  isActive: row.is_active ?? true,
  title: row.title,
  updatedAt: row.updated_at,
});

export const mapReportTemplateRow = (
  row: ReportTemplateRow,
  applicableDepartmentIds: number[],
): ReportTemplate => ({
  applicableDepartmentIds,
  content: row.content,
  createdAt: row.created_at,
  id: row.id,
  isActive: row.is_active ?? true,
  title: row.title,
  updatedAt: row.updated_at,
});
