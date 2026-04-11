import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { getEmployeesByRole, getReportsByDateRange } from "@/lib/reports";
import { buildSalarySummary } from "@/lib/salary";
import type { SalarySummary } from "@/types/domain";

function getDefaultDateRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  return {
    fromDate: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    toDate: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10),
  };
}

function formatHours(hours: number) {
  return `${hours.toFixed(2)} h`;
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

function formatCompensation(summary: SalarySummary) {
  if (summary.compensationType === "monthly") {
    return `Sueldo mensual · ${formatMoney(summary.monthlySalary)}`;
  }

  if (summary.compensationType === "hourly") {
    return `Pago por hora · ${formatMoney(summary.hourlyRate)}`;
  }

  return "Sin modalidad definida";
}

type AdminSalariesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSalariesPage({
  searchParams,
}: AdminSalariesPageProps) {
  const params = (await searchParams) ?? {};
  const defaultRange = getDefaultDateRange();
  const fromDate =
    typeof params.fromDate === "string" ? params.fromDate : defaultRange.fromDate;
  const toDate =
    typeof params.toDate === "string" ? params.toDate : defaultRange.toDate;
  const [employees, reports] = await Promise.all([
    getEmployeesByRole("employee"),
    getReportsByDateRange(fromDate, toDate),
  ]);
  const reportsByEmployeeId = new Map<string, typeof reports>();

  for (const report of reports) {
    const employeeReports = reportsByEmployeeId.get(report.employeeId) ?? [];
    employeeReports.push(report);
    reportsByEmployeeId.set(report.employeeId, employeeReports);
  }

  const summary = employees.map((employee) =>
    buildSalarySummary(
      employee.id,
      employee.fullName,
      employee.hourlyRate,
      employee.monthlySalary,
      reportsByEmployeeId.get(employee.id) ?? [],
    ),
  );

  return (
    <AppShell>
      <Card className="bg-white/72">
        <PageHeading
          eyebrow="Sueldos"
          title="Resumen salarial del periodo"
          description="Horas validas, modalidad de cobro y sueldo estimado calculados server-side para cada empleado."
        />
        <form className="mt-8 grid gap-4 rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label
              className="text-sm font-semibold text-surface-ink"
              htmlFor="fromDate"
            >
              Fecha desde
            </label>
            <input
              id="fromDate"
              name="fromDate"
              type="date"
              defaultValue={fromDate}
              className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
            />
          </div>
          <div>
            <label
              className="text-sm font-semibold text-surface-ink"
              htmlFor="toDate"
            >
              Fecha hasta
            </label>
            <input
              id="toDate"
              name="toDate"
              type="date"
              defaultValue={toDate}
              className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-surface-ink px-5 py-3 text-sm font-semibold text-surface transition hover:bg-surface-ink/92 md:w-auto"
          >
            Aplicar periodo
          </button>
        </form>
        {summary.length === 0 ? (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-surface-line bg-surface px-5 py-6 text-sm text-surface-ink/72">
            No hay empleados para mostrar en este periodo.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:hidden">
              {summary.map((item) => (
                <div
                  key={item.employeeId}
                  className="rounded-[1.5rem] border border-surface-line bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-surface-ink">
                        {item.employeeName}
                      </p>
                      <p className="mt-1 text-xs text-surface-ink/55">
                        {item.validDayCount} dias validos · {item.nullReportCount} nulos
                      </p>
                    </div>
                    <ButtonLink
                      href={`/admin/sueldos/${item.employeeId}?fromDate=${fromDate}&toDate=${toDate}`}
                      variant="secondary"
                    >
                      Ver detalle
                    </ButtonLink>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-surface-ink/76">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                        Horas totales
                      </p>
                      <p className="mt-1 font-semibold text-surface-ink">
                        {formatHours(item.validWorkedHours)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                        Modalidad
                      </p>
                      <p className="mt-1 font-semibold text-surface-ink">
                        {formatCompensation(item)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-surface-ink/52">
                        Sueldo estimado
                      </p>
                      <p className="mt-1 font-semibold text-surface-ink">
                        {formatMoney(item.estimatedSalary)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 hidden overflow-x-auto md:block">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.24em] text-surface-ink/52">
                  <th className="px-4">Empleado</th>
                  <th className="px-4">Horas totales</th>
                  <th className="px-4">Modalidad</th>
                  <th className="px-4">Sueldo estimado</th>
                  <th className="px-4">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((item) => (
                  <tr key={item.employeeId} className="bg-surface">
                    <td className="rounded-l-[1.5rem] px-4 py-4 text-sm font-semibold text-surface-ink">
                      <div>{item.employeeName}</div>
                      <div className="mt-1 text-xs font-normal text-surface-ink/55">
                        {item.validDayCount} dias validos · {item.nullReportCount} nulos
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-surface-ink/76">
                      {formatHours(item.validWorkedHours)}
                    </td>
                    <td className="px-4 py-4 text-sm text-surface-ink/76">
                      {formatCompensation(item)}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-surface-ink">
                      {formatMoney(item.estimatedSalary)}
                    </td>
                    <td className="rounded-r-[1.5rem] px-4 py-4 text-sm">
                      <ButtonLink
                        href={`/admin/sueldos/${item.employeeId}?fromDate=${fromDate}&toDate=${toDate}`}
                        variant="secondary"
                      >
                        Ver detalle
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink
            href={`/admin/reportes?fromDate=${fromDate}&toDate=${toDate}`}
            variant="secondary"
          >
            Ir a reportes del periodo
          </ButtonLink>
          <ButtonLink href="/admin/empleados" variant="secondary">
            Gestionar empleados
          </ButtonLink>
          <ButtonLink href="/admin" variant="ghost">
            Volver al panel
          </ButtonLink>
        </div>
      </Card>
    </AppShell>
  );
}
