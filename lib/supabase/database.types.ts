import type { AdminRole, BirthdayNotificationStatus, DayOfWeek, ServiceType } from "../domain/types.ts";

export type Json =
  | boolean
  | number
  | string
  | null
  | Json[]
  | { [key: string]: Json | undefined };

export type AdminRow = {
  auth_user_id: string | null;
  created_at: string;
  department_id: number | null;
  email: string;
  hash: string | null;
  id: number;
  is_active: boolean;
  is_super_admin: boolean | null;
  lock_until: string | null;
  login_attempts: number | null;
  name: string;
  reset_password_expiration: string | null;
  reset_password_token: string | null;
  salt: string | null;
  updated_at: string;
};

export type AdminRoleRow = {
  id: number;
  order: number;
  parent_id: number;
  value: AdminRole | null;
};

export type AdminAccountRpcRow = {
  auth_user_id: string | null;
  created_at: string;
  department_id: number | null;
  email: string;
  id: number;
  is_active: boolean;
  is_super_admin: boolean;
  name: string;
  roles: AdminRole[];
  updated_at: string;
};

export type AdminSummaryRpcRow = {
  email: string;
  id: number;
  name: string;
};

export type PublicAttendanceSearchRow = {
  department_name: string;
  first_name: string;
  full_name: string;
  id: number;
  record_id: number | null;
  record_present: boolean | null;
};

export type PublicDepartmentRow = {
  id: number;
  name: string;
};

export type PublicServiceRow = {
  date: string;
  id: number;
  name: string;
  service_type: ServiceType;
};

export type PublicReportInstructionRow = {
  content: string;
  department_id: number;
  id: number;
  title: string;
};

export type PublicReportTemplateRow = {
  applicable_department_ids: number[];
  content: string;
  id: number;
  title: string;
};

export type DepartmentRow = {
  created_at: string;
  description: string | null;
  id: number;
  is_active: boolean | null;
  name: string;
  reporting_channel: string | null;
  slug: string | null;
  updated_at: string;
};

export type ServiceRow = {
  created_at: string;
  date: string;
  end_time: string | null;
  id: number;
  is_active: boolean | null;
  name: string;
  notes: string | null;
  service_type: ServiceType;
  start_time: string | null;
  updated_at: string;
};

export type MemberRow = {
  available_days: DayOfWeek[] | null;
  born_again: boolean | null;
  church_interests: string | null;
  company: string | null;
  course: string | null;
  created_at: string;
  date_joined: string | null;
  date_of_birth: string | null;
  department_id: number | null;
  email: string | null;
  facebook_handle: string | null;
  favorite_verse: string | null;
  first_name: string;
  full_name: string | null;
  hobbies: string | null;
  home_address: string | null;
  id: number;
  instagram_handle: string | null;
  institution: string | null;
  is_new_comer: boolean | null;
  last_name: string;
  legacy_profile_picture_url: string | null;
  marital_status: string | null;
  middle_name: string | null;
  nationality: string | null;
  nickname: string | null;
  occupation: string | null;
  phone_number: string | null;
  preferred_department_id: number | null;
  previous_church: string | null;
  profile_picture_id: number | null;
  role: string | null;
  skills: string | null;
  tribe: string | null;
  updated_at: string;
  wants_department: boolean | null;
  whatsapp_number: string | null;
  x_handle: string | null;
  years_a_christian: string | null;
};

export type MediaRow = {
  alt: string;
  created_at: string;
  filename: string | null;
  filesize: number | null;
  focal_x: number | null;
  focal_y: number | null;
  height: number | null;
  id: number;
  legacy_path: string | null;
  mime_type: string | null;
  storage_path: string | null;
  thumbnail_u_r_l: string | null;
  updated_at: string;
  url: string | null;
  width: number | null;
};

export type BirthdayNotificationSettingsRow = {
  admin_notification_emails: string | null;
  admin_summary_body: string | null;
  admin_summary_subject: string | null;
  created_at: string | null;
  enabled: boolean | null;
  id: number;
  last_run: string | null;
  member_email_body: string | null;
  member_email_subject: string | null;
  send_time: string | null;
  updated_at: string | null;
};

export type BirthdayNotificationLogRow = {
  created_at: string;
  dry_run: boolean | null;
  id: number;
  member_id: number | null;
  message: string | null;
  recipient_email: string | null;
  run_date: string;
  status: BirthdayNotificationStatus;
  updated_at: string;
};

export type AttendanceRecordRow = {
  created_at: string;
  date: string;
  id: number;
  member_id: number;
  notes: string | null;
  present: boolean | null;
  service_id: number | null;
  updated_at: string;
};

export type ServiceReportRow = {
  approved_at: string | null;
  approved_by_id: number | null;
  attachment_url: string | null;
  created_at: string;
  department_attendance: number | null;
  department_id: number;
  id: number;
  is_approved: boolean | null;
  report_content: string;
  service_id: number;
  submitted_by_id: number | null;
  title: string;
  updated_at: string;
  volunteers_count: number | null;
};

export type ReportInstructionRow = {
  content: string;
  created_at: string;
  department_id: number;
  id: number;
  is_active: boolean | null;
  title: string;
  updated_at: string;
};

export type ReportTemplateRow = {
  content: string;
  created_at: string;
  id: number;
  is_active: boolean | null;
  title: string;
  updated_at: string;
};

export type ReportTemplateRelationRow = {
  departments_id: number | null;
  id: number;
  order: number | null;
  parent_id: number;
  path: string;
};

type DepartmentInsert = Omit<DepartmentRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type ServiceInsert = Omit<ServiceRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type AdminInsert = Omit<AdminRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type AdminRoleInsert = Omit<AdminRoleRow, "id"> & {
  id?: number;
};

type MemberInsert = Omit<MemberRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type MediaInsert = Omit<MediaRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type BirthdayNotificationSettingsInsert = Omit<
  BirthdayNotificationSettingsRow,
  "id"
> & { id?: number };

type BirthdayNotificationLogInsert = Omit<BirthdayNotificationLogRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string; id?: number; updated_at?: string;
};

type AttendanceRecordInsert = Omit<
  AttendanceRecordRow,
  "created_at" | "id" | "updated_at"
> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type ServiceReportInsert = Omit<ServiceReportRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type ReportInstructionInsert = Omit<
  ReportInstructionRow,
  "created_at" | "id" | "updated_at"
> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type ReportTemplateInsert = Omit<ReportTemplateRow, "created_at" | "id" | "updated_at"> & {
  created_at?: string;
  id?: number;
  updated_at?: string;
};

type ReportTemplateRelationInsert = Omit<ReportTemplateRelationRow, "id"> & {
  id?: number;
};

export type Database = {
  public: {
    CompositeTypes: Record<never, never>;
    Enums: {
      enum_admins_roles: AdminRole;
      enum_services_service_type: ServiceType;
    };
    Functions: {
      list_admin_accounts: {
        Args: Record<never, never>;
        Returns: AdminAccountRpcRow[];
      };
      get_admin_summaries: {
        Args: { p_ids: number[] };
        Returns: AdminSummaryRpcRow[];
      };
      list_public_departments: {
        Args: Record<never, never>;
        Returns: PublicDepartmentRow[];
      };
      list_public_report_instructions: {
        Args: Record<never, never>;
        Returns: PublicReportInstructionRow[];
      };
      list_public_report_templates: {
        Args: Record<never, never>;
        Returns: PublicReportTemplateRow[];
      };
      list_public_services: {
        Args: Record<never, never>;
        Returns: PublicServiceRow[];
      };
      get_public_media: {
        Args: { p_id: number; p_secret: string };
        Returns: MediaRow | null;
      };
      register_public_media: {
        Args: { p_input: Json; p_secret: string };
        Returns: MediaRow;
      };
      register_public_member: {
        Args: { p_input: Json; p_secret: string };
        Returns: MemberRow;
      };
      save_attendance_register: {
        Args: {
          p_date: string;
          p_entries: Json;
          p_service_id?: number | null;
        };
        Returns: AttendanceRecordRow[];
      };
      save_admin_account: {
        Args: {
          p_auth_user_id: string;
          p_department_id: number | null;
          p_email: string;
          p_id: number | null;
          p_is_active: boolean;
          p_is_super_admin: boolean;
          p_name: string;
          p_roles: AdminRole[];
        };
        Returns: AdminAccountRpcRow[];
      };
      save_report_instruction: {
        Args: {
          p_content: string;
          p_department_id: number;
          p_id: number | null;
          p_is_active: boolean;
          p_title: string;
        };
        Returns: ReportInstructionRow;
      };
      save_report_template: {
        Args: {
          p_content: string;
          p_department_ids: number[];
          p_id: number | null;
          p_is_active: boolean;
          p_title: string;
        };
        Returns: ReportTemplateRow;
      };
      save_public_attendance_register: {
        Args: { p_date: string; p_entries: Json; p_secret: string };
        Returns: AttendanceRecordRow[];
      };
      search_public_attendance_members: {
        Args: { p_date: string; p_query: string; p_secret: string };
        Returns: PublicAttendanceSearchRow[];
      };
      submit_public_service_report: {
        Args: { p_input: Json; p_secret: string };
        Returns: ServiceReportRow;
      };
    };
    Tables: {
      birthday_notification_settings: {
        Insert: BirthdayNotificationSettingsInsert;
        Relationships: [];
        Row: BirthdayNotificationSettingsRow;
        Update: Partial<BirthdayNotificationSettingsInsert>;
      };
      birthday_notification_logs: {
        Insert: BirthdayNotificationLogInsert;
        Relationships: [];
        Row: BirthdayNotificationLogRow;
        Update: Partial<BirthdayNotificationLogInsert>;
      };
      admins: {
        Insert: AdminInsert;
        Relationships: [];
        Row: AdminRow;
        Update: Partial<AdminInsert>;
      };
      admins_roles: {
        Insert: AdminRoleInsert;
        Relationships: [
          {
            columns: ["parent_id"];
            foreignKeyName: "admins_roles_parent_fk";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "admins";
          },
        ];
        Row: AdminRoleRow;
        Update: Partial<AdminRoleInsert>;
      };
      departments: {
        Insert: DepartmentInsert;
        Relationships: [];
        Row: DepartmentRow;
        Update: Partial<DepartmentInsert>;
      };
      members: {
        Insert: MemberInsert;
        Relationships: [
          {
            columns: ["department_id"];
            foreignKeyName: "members_department_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "departments";
          },
          {
            columns: ["preferred_department_id"];
            foreignKeyName: "members_preferred_department_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "departments";
          },
        ];
        Row: MemberRow;
        Update: Partial<MemberInsert>;
      };
      media: {
        Insert: MediaInsert;
        Relationships: [];
        Row: MediaRow;
        Update: Partial<MediaInsert>;
      };
      attendance_records: {
        Insert: AttendanceRecordInsert;
        Relationships: [
          {
            columns: ["member_id"];
            foreignKeyName: "attendance_records_member_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "members";
          },
          {
            columns: ["service_id"];
            foreignKeyName: "attendance_records_service_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "services";
          },
        ];
        Row: AttendanceRecordRow;
        Update: Partial<AttendanceRecordInsert>;
      };
      service_reports: {
        Insert: ServiceReportInsert;
        Relationships: [
          {
            columns: ["service_id"];
            foreignKeyName: "service_reports_service_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "services";
          },
          {
            columns: ["department_id"];
            foreignKeyName: "service_reports_department_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "departments";
          },
          {
            columns: ["submitted_by_id"];
            foreignKeyName: "service_reports_submitted_by_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "admins";
          },
          {
            columns: ["approved_by_id"];
            foreignKeyName: "service_reports_approved_by_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "admins";
          },
        ];
        Row: ServiceReportRow;
        Update: Partial<ServiceReportInsert>;
      };
      report_instructions: {
        Insert: ReportInstructionInsert;
        Relationships: [
          {
            columns: ["department_id"];
            foreignKeyName: "report_instructions_department_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "departments";
          },
        ];
        Row: ReportInstructionRow;
        Update: Partial<ReportInstructionInsert>;
      };
      report_templates: {
        Insert: ReportTemplateInsert;
        Relationships: [];
        Row: ReportTemplateRow;
        Update: Partial<ReportTemplateInsert>;
      };
      report_templates_rels: {
        Insert: ReportTemplateRelationInsert;
        Relationships: [
          {
            columns: ["parent_id"];
            foreignKeyName: "report_templates_rels_parent_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "report_templates";
          },
          {
            columns: ["departments_id"];
            foreignKeyName: "report_templates_rels_departments_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "departments";
          },
        ];
        Row: ReportTemplateRelationRow;
        Update: Partial<ReportTemplateRelationInsert>;
      };
      services: {
        Insert: ServiceInsert;
        Relationships: [];
        Row: ServiceRow;
        Update: Partial<ServiceInsert>;
      };
    };
    Views: Record<never, never>;
  };
};
