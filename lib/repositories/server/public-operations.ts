import "server-only";
import { createSupabasePrivilegedClient } from "../../supabase/privileged.ts";
import { createSupabasePublicOperationsClient } from "../../supabase/public-operations.ts";
import { readPublicOperationsSecret } from "../../supabase/environment.ts";
import type { AttendanceWriteRepository, DepartmentRepository, MediaRepository, MemberWriteRepository, PublicAttendanceSearchRepository, ReportContentRepository, ReportCreateRepository, ServiceRepository } from "../contracts.ts";
import { createSupabasePublicMediaRepository } from "../supabase/public-media.ts";
import { createSupabasePublicAttendanceSearchRepository, createSupabasePublicDepartmentRepository, createSupabasePublicReportContentRepository, createSupabasePublicServiceRepository } from "../supabase/public-reads.ts";
import { createSupabasePublicAttendanceWriteRepository, createSupabasePublicMemberWriteRepository, createSupabasePublicReportWriteRepository } from "../supabase/public-writes.ts";

const publicClient = () => createSupabasePublicOperationsClient();
const secret = () => readPublicOperationsSecret(process.env);
export const getPublicDepartmentRepository = async (): Promise<DepartmentRepository> => createSupabasePublicDepartmentRepository(publicClient());
export const getPublicServiceRepository = async (): Promise<ServiceRepository> => createSupabasePublicServiceRepository(publicClient());
export const getPublicAttendanceSearchRepository = async (): Promise<PublicAttendanceSearchRepository> => createSupabasePublicAttendanceSearchRepository(publicClient(), secret());
export const getPublicAttendanceWriteRepository = async (): Promise<AttendanceWriteRepository> => createSupabasePublicAttendanceWriteRepository(publicClient(), secret());
export const getPublicMemberWriteRepository = async (): Promise<MemberWriteRepository> => createSupabasePublicMemberWriteRepository(publicClient(), secret());
export const getPublicMediaRepository = async (): Promise<MediaRepository> => createSupabasePublicMediaRepository(createSupabasePrivilegedClient(), publicClient(), secret());
export const getPublicReportContentRepository = async (): Promise<ReportContentRepository> => createSupabasePublicReportContentRepository(publicClient());
export const getPublicReportWriteRepository = async (): Promise<ReportCreateRepository> => createSupabasePublicReportWriteRepository(publicClient(), secret());
