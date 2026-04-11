import Link from "next/link";
import { Shield, TimerReset } from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getCurrentUser } from "@/lib/auth";

function getHomeHref(role: "admin" | "employee" | undefined) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "employee") {
    return "/panel";
  }

  return "/login";
}

export async function SiteHeader() {
  const currentUser = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-line/80 bg-white/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href={getHomeHref(currentUser?.role)}>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-surface-ink text-surface shadow-panel">
            <TimerReset className="size-5" />
          </div>
          <p className="font-display text-lg font-semibold leading-none tracking-tight">
            REPORTE HORARIO
          </p>
        </Link>

        <div className="hidden items-center gap-3 text-xs text-surface-ink/55 lg:flex">
          {currentUser ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2">
              <Shield className="size-4 text-surface-accent" />
              {currentUser.employeeCode}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {currentUser ? <LogoutButton compact /> : null}
        </div>
      </div>
    </header>
  );
}
