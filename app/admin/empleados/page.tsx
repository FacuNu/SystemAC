import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { getEmployeesByRole } from "@/lib/reports";
import { EmployeesManager } from "./employees-manager";

export default async function AdminEmployeesPage() {
  const employees = await getEmployeesByRole("employee");

  return (
    <AppShell>
      <Card className="bg-white/72">
        <PageHeading
          eyebrow="Empleados"
          title="Gestion de empleados"
          description="Da de alta empleados y administra sus datos operativos desde fichas compactas con edicion desplegable."
        />
        <div className="mt-8 grid gap-6">
          <EmployeesManager employees={employees} />
          <div className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5">
            <h2 className="font-display text-xl font-semibold text-surface-ink">
              Accesos rapidos
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/admin/sueldos" variant="secondary">
                Ver sueldos
              </ButtonLink>
              <ButtonLink href="/admin" variant="ghost">
                Volver al inicio admin
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
