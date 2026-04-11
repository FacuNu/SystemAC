import { ArrowLeft, CircleAlert, LogIn } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { requireRole } from "@/lib/auth";
import { getOpenReportByEmployee } from "@/lib/reports";
import { CheckOutForm } from "../check-out-form";

export default async function CheckOutPage() {
  const user = await requireRole("employee");
  const openReport = await getOpenReportByEmployee(user.id);

  return (
    <AppShell>
      <Card className="bg-white/75">
        <PageHeading
          eyebrow="Egreso"
          title="Registrar egreso"
          description="Cierra la jornada abierta con tu geolocalizacion actual y el detalle de tareas realizadas."
        />
        <div className="mt-6">
          <ButtonLink href="/panel" variant="ghost">
            <ArrowLeft className="size-4" />
            Volver al panel
          </ButtonLink>
        </div>
        {!openReport ? (
          <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-4" />
              <div className="grid gap-2">
                <p className="font-semibold">No hay jornada abierta</p>
                <p>
                  Para registrar el egreso primero debes abrir una jornada desde
                  Ingreso.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/panel/ingreso" variant="primary">
                <LogIn className="size-4" />
                Ir a ingreso
              </ButtonLink>
              <ButtonLink href="/panel" variant="secondary">
                Volver al panel
              </ButtonLink>
            </div>
          </div>
        ) : (
          <CheckOutForm openReport={openReport} />
        )}
      </Card>
    </AppShell>
  );
}
