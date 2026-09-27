import type {
  AdminSummary,
  AdminAccount,
  AdminAccountSaveInput,
  BirthdayNotificationSettings,
  BirthdayNotificationSettingsUpdate,
  BirthdayNotificationLog,
  AttendanceRecord,
  AttendanceRecordWithMember,
  AttendanceRegisterWrite,
  Department,
  DepartmentSaveInput,
  EntityId,
  Member,
  MemberCreateInput,
  MemberUpdateInput,
  MemberWithDepartment,
  MediaAsset,
  MediaUploadInput,
  PublicAttendanceSearchMember,
  ReportInstruction,
  ReportInstructionSaveInput,
  ReportTemplate,
  ReportTemplateSaveInput,
  Service,
  ServiceCreateInput,
  ServiceReport,
  ServiceReportApprovalInput,
  ServiceReportCreateInput,
} from "../domain/types.ts";

export interface AdminSummaryRepository {
  findByIds(ids: EntityId[]): Promise<AdminSummary[]>;
}

export interface AdminAccountRepository {
  findById(id: EntityId): Promise<AdminAccount | null>;
  list(): Promise<AdminAccount[]>;
  save(input: AdminAccountSaveInput): Promise<AdminAccount>;
}

export interface BirthdaySettingsRepository {
  get(): Promise<BirthdayNotificationSettings>;
  update(input: BirthdayNotificationSettingsUpdate): Promise<BirthdayNotificationSettings>;
}

export interface BirthdayLogRepository {
  list(limit: number): Promise<BirthdayNotificationLog[]>;
}

export type PageRequest = {
  limit: number;
  page: number;
};

export type PageResult<TEntity> = {
  docs: TEntity[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  page: number;
  totalDocs: number;
  totalPages: number;
};

export type MemberFilters = PageRequest & {
  departmentId?: EntityId;
  isNewComer?: boolean;
  query?: string;
};

export type AttendanceFilters = PageRequest & {
  date?: string;
  departmentId?: EntityId;
  memberId?: EntityId;
  memberIds?: readonly EntityId[];
  present?: boolean;
  serviceId?: EntityId | null;
};

export type ReportFilters = PageRequest & {
  departmentId?: EntityId;
  isApproved?: boolean;
  serviceId?: EntityId;
};

export interface DepartmentRepository {
  findActive(): Promise<Department[]>;
  findAll(): Promise<Department[]>;
  findById(id: EntityId): Promise<Department | null>;
}

export interface DepartmentWriteRepository {
  save(input: DepartmentSaveInput): Promise<Department>;
}

export interface ServiceRepository {
  findActive(): Promise<Service[]>;
  findAll(): Promise<Service[]>;
  findById(id: EntityId): Promise<Service | null>;
}

export interface ServiceWriteRepository {
  create(input: ServiceCreateInput): Promise<Service>;
  update(id: EntityId, input: ServiceCreateInput): Promise<Service>;
}

export interface MemberRepository {
  findById(id: EntityId): Promise<MemberWithDepartment | null>;
  list(filters: MemberFilters): Promise<PageResult<Member>>;
}

export interface MemberWriteRepository {
  create(input: MemberCreateInput): Promise<Member>;
  markAsRegular(id: EntityId): Promise<Member>;
  update(id: EntityId, input: MemberUpdateInput): Promise<Member>;
}

export interface MediaRepository {
  create(input: MediaUploadInput): Promise<MediaAsset>;
  findById(id: EntityId): Promise<MediaAsset | null>;
}

export interface AttendanceRepository {
  list(filters: AttendanceFilters): Promise<PageResult<AttendanceRecord>>;
  listWithMembers(filters: AttendanceFilters): Promise<PageResult<AttendanceRecordWithMember>>;
}

export interface PublicAttendanceSearchRepository {
  search(query: string, date: string): Promise<PublicAttendanceSearchMember[]>;
}

export interface AttendanceWriteRepository {
  saveRegister(input: AttendanceRegisterWrite): Promise<AttendanceRecord[]>;
}

export interface ReportRepository {
  findById(id: EntityId): Promise<ServiceReport | null>;
  list(filters: ReportFilters): Promise<PageResult<ServiceReport>>;
}

export interface ReportCreateRepository {
  create(input: ServiceReportCreateInput): Promise<ServiceReport>;
}

export interface ReportWriteRepository extends ReportCreateRepository {
  delete(id: EntityId): Promise<ServiceReport>;
  setApproval(input: ServiceReportApprovalInput): Promise<ServiceReport>;
}

export interface ReportContentRepository {
  findActiveInstructions(): Promise<ReportInstruction[]>;
  findActiveTemplates(): Promise<ReportTemplate[]>;
  findAllInstructions(): Promise<ReportInstruction[]>;
  findAllTemplates(): Promise<ReportTemplate[]>;
  findInstructionForDepartment(departmentId: EntityId): Promise<ReportInstruction | null>;
  findTemplatesForDepartment(departmentId: EntityId): Promise<ReportTemplate[]>;
}

export interface ReportContentWriteRepository {
  saveInstruction(input: ReportInstructionSaveInput): Promise<ReportInstruction>;
  saveTemplate(input: ReportTemplateSaveInput): Promise<ReportTemplate>;
}
