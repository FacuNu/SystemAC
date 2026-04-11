"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type LoginApiSuccess = {
  ok: true;
  message: string;
  redirectTo: string | null;
  user: {
    id: string;
    fullName: string;
    employeeCode: string;
    role: "admin" | "employee";
    mustChangePassword: boolean;
  } | null;
};

type LoginApiError = {
  ok: false;
  message: string;
  code: string;
};

export function LoginForm() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeCode,
          password,
        }),
      });
      const payload = (await response.json()) as LoginApiSuccess | LoginApiError;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message);
        return;
      }

      router.replace(payload.redirectTo ?? "/panel");
      router.refresh();
    } catch {
      setErrorMessage("No se pudo iniciar sesion. Intentalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-surface-ink/80">
        Usuario
        <input
          autoComplete="username"
          className="rounded-2xl border border-surface-line bg-surface px-4 py-3 outline-none transition focus:border-surface-accent"
          name="employeeCode"
          onChange={(event) => setEmployeeCode(event.target.value.toUpperCase())}
          required
          value={employeeCode}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-surface-ink/80">
        Contraseña
        <input
          autoComplete="current-password"
          className="rounded-2xl border border-surface-line bg-surface px-4 py-3 outline-none transition focus:border-surface-accent"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {errorMessage ? (
        <p className="rounded-2xl border border-surface-danger/20 bg-surface-danger/10 px-4 py-3 text-sm text-surface-danger">
          {errorMessage}
        </p>
      ) : null}
      <Button className="mt-2 justify-center" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Ingresando..." : "Ingresar"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
