import { ReportExportForm } from "@/app/admin/reportes/report-export-form";
import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

function getDefaultDateRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  return {
    fromDate: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    toDate: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10),
  };
}

type AdminReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const params = (await searchParams) ?? {};
  const defaultRange = getDefaultDateRange();
  const fromDate =
    typeof params.fromDate === "string" ? params.fromDate : defaultRange.fromDate;
  const toDate =
    typeof params.toDate === "string" ? params.toDate : defaultRange.toDate;

  return (
    <AppShell>
      <Card className="bg-white/72">
        <PageHeading
          eyebrow="Reportes"
          title="Exportacion mensual XLSX"
          description="Selecciona el periodo y genera el archivo con la hoja Detalle y la hoja Resumen desde backend."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ReportExportForm defaultFromDate={fromDate} defaultToDate={toDate} />
          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5">
              <h2 className="font-display text-xl font-semibold text-surface-ink">
                Que incluye
              </h2>
              <div className="mt-4 grid gap-3 text-sm text-surface-ink/72">
                <p>
                  Detalle: empleado, horarios, tareas, geolocalizacion, null
                  report y estado.
                </p>
                <p>
                  Resumen: horas validas, dias validos, reportes nulos,
                  modalidad de cobro, valor configurado y sueldo estimado.
                </p>
                <p>
                  Los reportes nulos quedan visibles, pero no suman horas ni
                  sueldo.
                </p>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5">
              <h2 className="font-display text-xl font-semibold text-surface-ink">
                Accesos rapidos
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <ButtonLink
                  href={`/admin/sueldos?fromDate=${fromDate}&toDate=${toDate}`}
                  variant="secondary"
                >
                  Ver sueldos del periodo
                </ButtonLink>
                <ButtonLink href="/admin/empleados" variant="secondary">
                  Gestionar empleados
                </ButtonLink>
                <ButtonLink href="/admin" variant="ghost">
                  Volver al panel
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
