import Link from "next/link";
import { AdminPagination } from "@/components/admin-pagination";
import { requireServerAdminActor } from "@/lib/auth/server-admin-context";
import type { Member } from "@/lib/domain/types";
import { getServerAttendanceRepository } from "@/lib/repositories/server/attendance";
import { getServerDepartmentRepository } from "@/lib/repositories/server/departments";
import { getServerServiceRepository } from "@/lib/repositories/server/services";
import { collectAllPages } from "@/lib/repositories/pagination";
import styles from "../page.module.css";

type SearchParams = Promise<{
  department?: string | string[];
  date?: string | string[];
  page?: string | string[];
  query?: string | string[];
  service?: string | string[];
}>;

type PhoneExportRow = {
  departmentName: string;
  email: string;
  fullName: string;
  phone: string;
  whatsapp: string;
};

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const todayValue = new Date().toISOString().slice(0, 10);

const clampPage = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

const formatDateValue = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
  }).format(parsed);
};

const includesQuery = (member: Member, query: string) => {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return true;
  }

  return [
    member.fullName,
    member.email,
    member.phoneNumber,
    member.whatsappNumber,
  ].some((value) => (value ?? "").toLowerCase().includes(trimmed));
};

export const dynamic = "force-dynamic";

export default async function AttendancePhoneExportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedDepartment = takeString(params.department);
  const requestedService = takeString(params.service);
  const requestedDate = takeString(params.date) ?? todayValue;
  const query = takeString(params.query) ?? "";
  const currentPage = clampPage(takeString(params.page));
  const pageSize = 40;

  await requireServerAdminActor(["admin", "staff"]);
  const [serviceRepository, departmentRepository, attendanceRepository] =
    await Promise.all([
      getServerServiceRepository(),
      getServerDepartmentRepository(),
      getServerAttendanceRepository(),
    ]);
  const [services, departments] = await Promise.all([
    serviceRepository.findActive(),
    departmentRepository.findActive(),
  ]);

  const departmentNameByID = new Map(departments.map((department) => [department.id, department.name]));
  const selectedService = requestedService
    ? services.find((service) => String(service.id) === requestedService)
    : undefined;
  const activeDate = selectedService?.date ?? requestedDate;
  const selectedDepartment = requestedDepartment
    ? departments.find((department) => String(department.id) === requestedDepartment)
    : undefined;

  const attendanceRecords = await collectAllPages(({ limit, page }) =>
    attendanceRepository.listWithMembers({
      ...(selectedService
        ? { serviceId: selectedService.id }
        : { date: activeDate, serviceId: null }),
      limit,
      page,
      present: true,
    }));

  const rows = new Map<number, PhoneExportRow>();

  for (const record of attendanceRecords) {
    const member = record.member;

    if (selectedDepartment && member.departmentId !== selectedDepartment.id) {
      continue;
    }

    if (!includesQuery(member, query)) {
      continue;
    }

    const phone = (member.phoneNumber ?? "").trim();
    const whatsapp = (member.whatsappNumber ?? "").trim();

    if (!phone && !whatsapp) {
      continue;
    }

    rows.set(member.id, {
      departmentName: departmentNameByID.get(member.departmentId ?? -1) ?? "Unassigned",
      email: member.email ?? "",
      fullName: member.fullName ?? "Unnamed member",
      phone,
      whatsapp,
    });
  }

  const exportRows = [...rows.values()].sort((left, right) => left.fullName.localeCompare(right.fullName));
  const totalPages = Math.max(1, Math.ceil(exportRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = exportRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rawNumbers = exportRows
    .flatMap((row) => [row.phone, row.whatsapp])
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueNumbers = [...new Set(rawNumbers)];
  const commaSeparatedNumbers = uniqueNumbers.join(", ");
  const lineSeparatedNumbers = uniqueNumbers.join("\n");

  return (
    <div className={styles.page}>
      <div className={styles.stack}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Internal Operations</p>
          <h1 className={styles.title}>Attendance Phone Export</h1>
          <p className={styles.lede}>
            Export only the phone contacts for members marked present on the selected service or date.
          </p>
        </section>

        <div className={styles.grid}>
          <aside className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Export Filters</h2>
                <p className={styles.panelText}>Use the same attendance filters, but return contacts only for members marked present.</p>
                <form action="/admin/attendance/phone-export" className={styles.filterForm} method="get">
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="service">
                      Service
                    </label>
                    <select className={styles.select} defaultValue={requestedService ?? ""} id="service" name="service">
                      <option value="">Date-only register</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.date}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="date">
                      Date
                    </label>
                    <input className={styles.input} defaultValue={activeDate} id="date" name="date" type="date" />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="department">
                      Department
                    </label>
                    <select className={styles.select} defaultValue={requestedDepartment ?? ""} id="department" name="department">
                      <option value="">All departments</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="query">
                      Member Search
                    </label>
                    <input
                      className={styles.input}
                      defaultValue={query}
                      id="query"
                      name="query"
                      placeholder="Name, email, or phone"
                      type="search"
                    />
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.primaryButton} type="submit">
                      Run Export
                    </button>
                    <Link className={styles.secondaryButton} href="/admin/attendance">
                      Back To Register
                    </Link>
                  </div>
                </form>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelPad}>
                <h2 className={styles.panelTitle}>Export Snapshot</h2>
                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Register Date</span>
                    <span className={styles.statValue}>{formatDateValue(activeDate)}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Selected Service</span>
                    <span className={styles.statValue}>{selectedService?.name ?? "Date-only"}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Department Filter</span>
                    <span className={styles.statValue}>{selectedDepartment?.name ?? "All"}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>People With Numbers</span>
                    <span className={styles.statValue}>{exportRows.length}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Unique Numbers</span>
                    <span className={styles.statValue}>{uniqueNumbers.length}</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className={styles.panel}>
            <div className={styles.panelPad}>
              <h2 className={styles.panelTitle}>Phone Number Export</h2>
              <p className={styles.panelText}>
                Only members marked present on {formatDateValue(activeDate)} are included here.
              </p>

              {exportRows.length === 0 ? (
                <div className={styles.emptyState}>No present members with phone numbers matched the current filters.</div>
              ) : (
                <>
                  <div className={styles.exportGrid}>
                    <section className={styles.exportCard}>
                      <h3 className={styles.exportTitle}>Comma-separated numbers</h3>
                      <textarea className={styles.exportTextarea} readOnly value={commaSeparatedNumbers} />
                    </section>

                    <section className={styles.exportCard}>
                      <h3 className={styles.exportTitle}>One number per line</h3>
                      <textarea className={styles.exportTextarea} readOnly value={lineSeparatedNumbers} />
                    </section>
                  </div>

                  <AdminPagination
                    currentPage={safePage}
                    pageSize={pageSize}
                    pathname="/admin/attendance/phone-export"
                    searchParams={{
                      date: activeDate,
                      department: requestedDepartment ?? "",
                      query,
                      service: requestedService ?? "",
                    }}
                    totalItems={exportRows.length}
                  />

                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Department</th>
                          <th>Phone Number</th>
                          <th>WhatsApp</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((row) => (
                          <tr key={`${row.fullName}-${row.phone}-${row.whatsapp}`}>
                            <td>
                              <span className={styles.memberName}>{row.fullName}</span>
                            </td>
                            <td>{row.departmentName}</td>
                            <td>{row.phone || "-"}</td>
                            <td>{row.whatsapp || "-"}</td>
                            <td>{row.email || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
