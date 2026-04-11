import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(
      currentUser.mustChangePassword
        ? "/cambiar-contrasena"
        : currentUser.role === "admin"
          ? "/admin"
          : "/panel",
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl">
        <Card className="border-surface-line/60 bg-white/75">
          <PageHeading
            eyebrow="Acceso"
            title="Ingreso al sistema"
            description=""
          />
          <LoginForm />
        </Card>
      </div>
    </AppShell>
  );
}
