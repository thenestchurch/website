export const ADMIN_ROLES = [
  "admin",
  "staff",
  "department-lead",
  "absentee-viewer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const SERVICE_TYPES = [
  "sunday-service",
  "midweek-service",
  "prayer-meeting",
  "special-program",
  "other",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const BIRTHDAY_NOTIFICATION_STATUSES = ["sent", "skipped", "failed"] as const;

export type BirthdayNotificationStatus = (typeof BIRTHDAY_NOTIFICATION_STATUSES)[number];

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type EntityId = number;

export type TimestampedEntity = {
  createdAt: string;
  id: EntityId;
  updatedAt: string;
};

export type AdminAccount = TimestampedEntity & {
  authUserId: string | null;
  departmentId: EntityId | null;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  name: string;
  roles: AdminRole[];
};

export type AdminSummary = Pick<AdminAccount, "email" | "id" | "name">;

export type AdminAccountSaveInput = {
  departmentId: EntityId | null;
  email: string;
  id?: EntityId;
  isActive: boolean;
  isSuperAdmin: boolean;
  name: string;
  password?: string;
  roles: AdminRole[];
};

export type Department = TimestampedEntity & {
  description: string | null;
  isActive: boolean;
  name: string;
  reportingChannel: string | null;
  slug: string | null;
};

export type DepartmentSaveInput = {
  description: string | null;
  id?: EntityId;
  isActive: boolean;
  name: string;
  reportingChannel: string | null;
  slug: string;
};

export type MediaAsset = TimestampedEntity & {
  alt: string;
  filename: string | null;
  filesize: number | null;
  height: number | null;
  legacyPath: string | null;
  mimeType: string | null;
  storagePath: string | null;
  url: string | null;
  width: number | null;
};

export type Member = TimestampedEntity & {
  availableDays: DayOfWeek[];
  bornAgain: boolean;
  churchInterests: string | null;
  company: string | null;
  course: string | null;
  dateJoined: string | null;
  dateOfBirth: string | null;
  departmentId: EntityId | null;
  email: string | null;
  facebookHandle: string | null;
  favoriteVerse: string | null;
  firstName: string;
  fullName: string;
  hobbies: string | null;
  homeAddress: string | null;
  instagramHandle: string | null;
  institution: string | null;
  isNewComer: boolean;
  lastName: string;
  legacyProfilePictureUrl: string | null;
  maritalStatus: string | null;
  middleName: string | null;
  nationality: string | null;
  nickname: string | null;
  occupation: string | null;
  phoneNumber: string | null;
  preferredDepartmentId: EntityId | null;
  previousChurch: string | null;
  profilePictureId: EntityId | null;
  role: string | null;
  skills: string | null;
  tribe: string | null;
  wantsDepartment: boolean;
  whatsappNumber: string | null;
  xHandle: string | null;
  yearsAChristian: string | null;
};

export type MemberUpdateInput = Pick<
  Member,
  | "company"
  | "dateJoined"
  | "dateOfBirth"
  | "departmentId"
  | "email"
  | "facebookHandle"
  | "favoriteVerse"
  | "firstName"
  | "hobbies"
  | "homeAddress"
  | "instagramHandle"
  | "isNewComer"
  | "lastName"
  | "maritalStatus"
  | "middleName"
  | "nationality"
  | "nickname"
  | "occupation"
  | "phoneNumber"
  | "preferredDepartmentId"
  | "role"
  | "skills"
  | "tribe"
  | "whatsappNumber"
  | "xHandle"
> & {
  profilePictureId?: EntityId;
};

export type MemberCreateInput = {
  dateJoined: string | null;
  dateOfBirth: string | null;
  departmentId: EntityId | null;
  email: string | null;
  firstName: string;
  isNewComer: boolean;
  lastName: string;
  middleName: string | null;
  phoneNumber: string | null;
  preferredDepartmentId: EntityId | null;
  profilePictureId: EntityId | null;
  whatsappNumber: string | null;
};

export type MediaUploadInput = {
  alt: string;
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
};

export type Service = TimestampedEntity & {
  date: string;
  endTime: string | null;
  isActive: boolean;
  name: string;
  notes: string | null;
  serviceType: ServiceType;
  startTime: string | null;
};

export type ServiceCreateInput = {
  date: string;
  endTime: string | null;
  isActive: boolean;
  name: string;
  notes: string | null;
  serviceType: ServiceType;
  startTime: string | null;
};

export type AttendanceRecord = TimestampedEntity & {
  date: string;
  memberId: EntityId;
  notes: string | null;
  present: boolean;
  serviceId: EntityId | null;
};

export type AttendanceRecordWithMember = AttendanceRecord & {
  member: Member;
};

export type PublicAttendanceSearchMember = {
  departmentName: string;
  firstName: string;
  fullName: string;
  id: EntityId;
  record: { id: EntityId; present: boolean } | null;
};

export type AttendanceRegisterEntry = {
  memberId: EntityId;
  notes: string | null;
  present: boolean;
};

export type AttendanceRegisterWrite = {
  date: string;
  entries: readonly AttendanceRegisterEntry[];
  serviceId: EntityId | null;
};

export type ServiceReport = TimestampedEntity & {
  approvedAt: string | null;
  approvedById: EntityId | null;
  attachmentUrl: string | null;
  departmentAttendance: number;
  departmentId: EntityId;
  isApproved: boolean;
  reportContent: string;
  serviceId: EntityId;
  submittedById: EntityId | null;
  title: string;
  volunteersCount: number;
};

export type ServiceReportCreateInput = {
  attachmentUrl: string | null;
  departmentAttendance: number;
  departmentId: EntityId;
  reportContent: string;
  serviceId: EntityId;
  title: string;
  volunteersCount: number;
};

export type ServiceReportApprovalInput = {
  id: EntityId;
  isApproved: boolean;
};

export type ReportInstruction = TimestampedEntity & {
  content: string;
  departmentId: EntityId;
  isActive: boolean;
  title: string;
};

export type ReportInstructionSaveInput = {
  content: string;
  departmentId: EntityId;
  id?: EntityId;
  isActive: boolean;
  title: string;
};

export type ReportTemplate = TimestampedEntity & {
  applicableDepartmentIds: EntityId[];
  content: string;
  isActive: boolean;
  title: string;
};

export type ReportTemplateSaveInput = {
  applicableDepartmentIds: EntityId[];
  content: string;
  id?: EntityId;
  isActive: boolean;
  title: string;
};

export type BirthdayNotificationLog = TimestampedEntity & {
  dryRun: boolean;
  memberId: EntityId | null;
  message: string | null;
  recipientEmail: string | null;
  runDate: string;
  status: BirthdayNotificationStatus;
};

export type BirthdayNotificationSettings = {
  adminNotificationEmails: string | null;
  adminSummaryBody: string | null;
  adminSummarySubject: string | null;
  enabled: boolean;
  id: EntityId;
  lastRun: string | null;
  memberEmailBody: string | null;
  memberEmailSubject: string | null;
  sendTime: string | null;
  updatedAt: string | null;
};

export type BirthdayNotificationSettingsUpdate = Omit<
  BirthdayNotificationSettings,
  "id" | "lastRun" | "updatedAt"
>;

export type MemberWithDepartment = Member & {
  department: Department | null;
  preferredDepartment: Department | null;
};

export type ServiceReportDetail = ServiceReport & {
  approvedBy: AdminSummary | null;
  department: Department;
  service: Service;
  submittedBy: AdminSummary | null;
};
