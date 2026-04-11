import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { getEmployeeById, getEmployeeReportsByDateRange } from "@/lib/reports";
import { buildSalarySummary } from "@/lib/salary";
import { ReportMapModal } from "./report-map-modal";

function getDefaultDateRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  return {
    fromDate: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    toDate: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10),
  };
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Pendiente";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatHours(totalMinutes: number | null, nullReport: boolean) {
  if (totalMinutes === null) {
    return "Pendiente";
  }

  if (nullReport) {
    return "0.00 h";
  }

  return `${(Math.round((totalMinutes / 60) * 100) / 100).toFixed(2)} h`;
}

function formatMoney(value: number | null, fallback = "Sin definir") {
  if (value === null) {
    return fallback;
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatStatusLabel(status: "open" | "closed" | "nullified") {
  switch (status) {
    case "open":
      return "Pendiente";
    case "closed":
      return "Finalizada";
    case "nullified":
      return "Finalizada";
    default:
      return status;
  }
}

function getStatusBadgeClassName(status: "open" | "closed" | "nullified") {
  return status === "open"
    ? "bg-amber-100 text-amber-800"
    : "bg-emerald-100 text-emerald-800";
}

type EmployeeSalaryDetailPageProps = {
  params: Promise<{
    employeeId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmployeeSalaryDetailPage({
  params,
  searchParams,
}: EmployeeSalaryDetailPageProps) {
  const { employeeId } = await params;
  const query = (await searchParams) ?? {};
  const defaultRange = getDefaultDateRange();
  const fromDate =
    typeof query.fromDate === "string" ? query.fromDate : defaultRange.fromDate;
  const toDate =
    typeof query.toDate === "string" ? query.toDate : defaultRange.toDate;
  const [employee, reports] = await Promise.all([
    getEmployeeById(employeeId),
    getEmployeeReportsByDateRange(employeeId, fromDate, toDate),
  ]);

  if (!employee || employee.role !== "employee") {
    notFound();
  }

  const summary = buildSalarySummary(
    employee.id,
    employee.fullName,
    employee.hourlyRate,
    employee.monthlySalary,
    reports,
  );
  const reportsWithTasksCount = reports.filter((report) =>
    Boolean(report.taskText?.trim()),
  ).length;

  return (
    <AppShell>
      <Card className="bg-white/72">
        <PageHeading
          eyebrow="Sueldos / Detalle"
          title={employee.fullName}
          description={`Periodo ${fromDate} a ${toDate}. Los reportes nulos se muestran, pero no se acumulan en horas trabajadas ni sueldo.`}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] bg-surface px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-accent">
              Horas
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-surface-ink">
              {summary.validWorkedHours.toFixed(2)}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-surface px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-accent">
              Tareas
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-surface-ink">
              {reportsWithTasksCount}
            </p>
            <p className="mt-2 text-sm text-surface-ink/72">
              jornadas con tareas cargadas
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-surface px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-accent">
              Modalidad
            </p>
            <p className="mt-3 text-sm font-semibold text-surface-ink">
              {summary.compensationType === "monthly"
                ? "Sueldo mensual"
                : summary.compensationType === "hourly"
                  ? "Pago por hora"
                  : "Sin definir"}
            </p>
            <p className="mt-2 text-sm text-surface-ink/72">
              {summary.compensationType === "monthly"
                ? formatMoney(summary.monthlySalary)
                : formatMoney(summary.hourlyRate)}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-surface px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-accent">
              Sueldo estimado
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-surface-ink">
              {formatMoney(summary.estimatedSalary)}
            </p>
          </div>
        </div>
        {reports.length === 0 ? (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-surface-line bg-surface px-5 py-6 text-sm text-surface-ink/72">
            No hay jornadas registradas para este empleado en el periodo seleccionado.
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {reports.map((report) => {
              const checkInLocation = report.checkInLocation;
              const checkOutLocation = report.checkOutLocation;
              const canShowMap =
                report.status !== "open" &&
                checkInLocation !== null &&
                checkOutLocation !== null;

              return (
                <div
                  key={report.id}
                  className="rounded-[1.5rem] border border-surface-line bg-surface"
                >
                  <div className="px-4 py-4">
                    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] lg:items-start">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                          Fecha
                        </p>
                        <p className="mt-1 font-semibold text-surface-ink">
                          {formatDate(report.workDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                          Ingreso
                        </p>
                        <p className="mt-1 font-semibold text-surface-ink">
                          {formatDateTime(report.checkInAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                          Egreso
                        </p>
                        <p className="mt-1 font-semibold text-surface-ink">
                          {formatDateTime(report.checkOutAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                          Horas
                        </p>
                        <p className="mt-1 font-semibold text-surface-ink">
                          {formatHours(report.totalMinutes, report.nullReport)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        {canShowMap ? (
                          <ReportMapModal
                            checkInLocation={checkInLocation}
                            checkOutLocation={checkOutLocation}
                          />
                        ) : null}
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(
                            report.status,
                          )}`}
                        >
                          {formatStatusLabel(report.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-surface-line px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                      Tareas
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-surface-ink">
                      {report.taskText?.trim() ? report.taskText : "Sin tareas"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink
            href={`/admin/sueldos?fromDate=${fromDate}&toDate=${toDate}`}
            variant="secondary"
          >
            Volver a sueldos
          </ButtonLink>
          <ButtonLink href="/admin/empleados" variant="secondary">
            Gestionar empleados
          </ButtonLink>
          <ButtonLink href="/admin/reportes" variant="ghost">
            Ir a reportes
          </ButtonLink>
        </div>
      </Card>
    </AppShell>
  );
}
