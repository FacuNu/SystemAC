import { ArrowLeft, CircleAlert, LogIn } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { requireRole } from "@/lib/auth";
import { getOpenReportByEmployee, getTodayReportByEmployee } from "@/lib/reports";
import { CheckInForm } from "../check-in-form";
import { formatDateTimeLabel, formatLocationLabel } from "../report-utils";

export default async function CheckInPage() {
  const user = await requireRole("employee");
  const [openReport, todayReport] = await Promise.all([
    getOpenReportByEmployee(user.id),
    getTodayReportByEmployee(user.id),
  ]);

  return (
    <AppShell>
      <Card className="bg-white/75">
        <PageHeading
          eyebrow="Ingreso"
          title="Registrar ingreso"
          description="Captura tu geolocalizacion actual, revisa el resumen previo y confirma la apertura de la jornada."
        />
        <div className="mt-6">
          <ButtonLink href="/panel" variant="ghost">
            <ArrowLeft className="size-4" />
            Volver al panel
          </ButtonLink>
        </div>
        {openReport ? (
          <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-4" />
              <div className="grid gap-2">
                <p className="font-semibold">Ya existe una jornada abierta</p>
                <p>
                  No puedes registrar un nuevo ingreso hasta cerrar la jornada en
                  curso.
                </p>
              </div>
            </div>
            <div className="grid gap-2 rounded-[1.5rem] border border-amber-200 bg-white/60 p-4">
              <p>
                <span className="font-semibold">Ingreso actual:</span>{" "}
                {formatDateTimeLabel(openReport.checkInAt)}
              </p>
              <p>
                <span className="font-semibold">Ubicacion:</span>{" "}
                {formatLocationLabel(openReport.checkInLocation)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/panel/egreso" variant="primary">
                <LogIn className="size-4" />
                Ir a egreso
              </ButtonLink>
              <ButtonLink href="/panel" variant="secondary">
                Volver al panel
              </ButtonLink>
            </div>
          </div>
        ) : (
          <CheckInForm />
        )}
      </Card>
    </AppShell>
  );
}
