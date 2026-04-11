import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default function AdminPage() {
  return (
    <AppShell>
      <Card className="bg-white/72">
        <PageHeading
          eyebrow="Gestion"
          title="Panel administrativo"
          description="Acceso central a empleados, reportes mensuales, resumentes salariales y flujo administrativo."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5">
            <h2 className="font-display text-xl font-semibold text-surface-ink">
              Empleados
            </h2>
            <p className="mt-2 text-sm leading-6 text-surface-ink/72">
              Alta de empleados, configuracion de sueldo mensual o pago por
              hora y control de estado activo.
            </p>
            <div className="mt-5">
              <ButtonLink href="/admin/empleados">Gestionar empleados</ButtonLink>
            </div>
          </article>
          <article className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5">
            <h2 className="font-display text-xl font-semibold text-surface-ink">
              Reportes mensuales
            </h2>
            <p className="mt-2 text-sm leading-6 text-surface-ink/72">
              Selecciona un rango, genera el XLSX y obtene las hojas Detalle y
              Resumen desde backend.
            </p>
            <div className="mt-5">
              <ButtonLink href="/admin/reportes">Abrir reportes</ButtonLink>
            </div>
          </article>
          <article className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5">
            <h2 className="font-display text-xl font-semibold text-surface-ink">
              Sueldos
            </h2>
            <p className="mt-2 text-sm leading-6 text-surface-ink/72">
              Revisa horas validas, modalidad de cobro, sueldo estimado y
              detalle por empleado para el periodo elegido.
            </p>
            <div className="mt-5">
              <ButtonLink href="/admin/sueldos" variant="secondary">
                Ver sueldos
              </ButtonLink>
            </div>
          </article>
          <article className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5">
            <h2 className="font-display text-xl font-semibold text-surface-ink">
              Envio por mail
            </h2>
            <p className="mt-2 text-sm leading-6 text-surface-ink/72">
              La API de correo sigue separada, pero el acceso administrativo ya
              queda visible desde el panel.
            </p>
            <div className="mt-5">
              <ButtonLink href="/api/admin/send-report-email" variant="ghost">
                API mail
              </ButtonLink>
            </div>
          </article>
        </div>
      </Card>
    </AppShell>
  );
}
