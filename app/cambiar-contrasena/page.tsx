import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!currentUser.mustChangePassword) {
    redirect(currentUser.role === "admin" ? "/admin" : "/panel");
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl">
        <Card className="border-surface-line/60 bg-white/75">
          <PageHeading
            eyebrow="Seguridad"
            title="Actualiza tu contraseña"
            description="Por seguridad, en tu primer ingreso o luego de un restablecimiento debes definir una nueva contraseña antes de continuar."
          />
          <ChangePasswordForm />
        </Card>
      </div>
    </AppShell>
  );
}
