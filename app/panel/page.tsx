import { LogIn, LogOut } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { requireRole } from "@/lib/auth";
import {
  getEmployeeReportsLast24Hours,
  getOpenReportByEmployee,
} from "@/lib/reports";
import {
  formatDateTimeLabel,
  formatReportStatus,
  formatWorkedHoursLabel,
} from "./report-utils";

export default async function PanelPage() {
  const user = await requireRole("employee");
  const [openReport, recentReports] = await Promise.all([
    getOpenReportByEmployee(user.id),
    getEmployeeReportsLast24Hours(user.id),
  ]);
  const currentReport = openReport ?? recentReports[0] ?? null;
  const panelTitle = openReport ? "Jornada abierta" : "Sin jornada abierta";
  const panelDescription = openReport
    ? "Ya registraste un ingreso. Para terminar la jornada usa Egreso."
    : currentReport
      ? "No tienes una jornada abierta. Si necesitas seguir trabajando, puedes iniciar una nueva."
      : "Todavia no registraste ingreso. Usa Ingreso para abrir la jornada.";

  return (
    <AppShell>
      <Card className="bg-white/75">
        <PageHeading
          eyebrow="Empleado"
          title={`Panel de ${user.fullName}`}
          description="Marca tu ingreso o egreso segun el estado actual de tu jornada."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ButtonLink
            disabled={Boolean(openReport)}
            href="/panel/ingreso"
            variant="primary"
          >
            <LogIn className="size-4" />
            Ingreso
          </ButtonLink>
          <ButtonLink
            disabled={!openReport}
            href="/panel/egreso"
            variant="secondary"
          >
            <LogOut className="size-4" />
            Egreso
          </ButtonLink>
        </div>
      </Card>

      <Card className="bg-surface/90">
        <PageHeading
          eyebrow="Estado actual"
          title={panelTitle}
          description={panelDescription}
        />
        <div className="mt-8 grid gap-4 text-sm text-surface-ink/80 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-surface-line bg-white/70 p-4">
            <p className="text-surface-ink/55">ID de empleado</p>
            <p className="mt-2 font-semibold text-surface-ink">
              {user.employeeCode}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-surface-line bg-white/70 p-4">
            <p className="text-surface-ink/55">Estado</p>
            <p className="mt-2 font-semibold text-surface-ink">
              {currentReport ? formatReportStatus(currentReport.status) : "Sin jornada"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-surface-line bg-white/70 p-4">
            <p className="text-surface-ink/55">Ingreso registrado</p>
            <p className="mt-2 font-semibold text-surface-ink">
              {formatDateTimeLabel(currentReport?.checkInAt ?? null)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/75">
        <PageHeading
          eyebrow="Historial reciente"
          title="Jornadas de hoy"
          description="Se muestran las jornadas registradas en las ultimas 24 horas."
        />
        <div className="mt-8 grid gap-4">
          {recentReports.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-surface-line bg-white/70 p-4 text-sm text-surface-ink/72">
              Todavia no hay jornadas registradas en las ultimas 24 horas.
            </div>
          ) : (
            recentReports.map((report) => (
              <div
                key={report.id}
                className="grid gap-4 rounded-[1.5rem] border border-surface-line bg-white/70 p-4 text-sm text-surface-ink/80 md:grid-cols-5"
              >
                <div>
                  <p className="text-surface-ink/55">Ingreso de jornada</p>
                  <p className="mt-2 font-semibold text-surface-ink">
                    {formatDateTimeLabel(report.checkInAt)}
                  </p>
                </div>
                <div>
                  <p className="text-surface-ink/55">Estado</p>
                  <p className="mt-2 font-semibold text-surface-ink">
                    {formatReportStatus(report.status)}
                  </p>
                </div>
                <div>
                  <p className="text-surface-ink/55">Total de horas</p>
                  <p className="mt-2 font-semibold text-surface-ink">
                    {formatWorkedHoursLabel(report.totalMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-surface-ink/55">Tarea detallada</p>
                  <p className="mt-2 font-semibold text-surface-ink">
                    {report.taskText?.trim() ? report.taskText : "Sin tareas cargadas"}
                  </p>
                </div>
                <div>
                  <p className="text-surface-ink/55">Egreso</p>
                  <p className="mt-2 font-semibold text-surface-ink">
                    {formatDateTimeLabel(report.checkOutAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </AppShell>
  );
}
