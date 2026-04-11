"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type ChangePasswordApiSuccess = {
  ok: true;
  message: string;
  redirectTo: string | null;
};

type ChangePasswordApiError = {
  ok: false;
  message: string;
  code: string;
};

export function ChangePasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });
      const payload = (await response.json()) as
        | ChangePasswordApiSuccess
        | ChangePasswordApiError;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message);
        return;
      }

      router.replace(payload.redirectTo ?? "/panel");
      router.refresh();
    } catch {
      setErrorMessage("No se pudo cambiar la contraseña. Intentalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-surface-ink/80">
        Nueva contraseña
        <input
          autoComplete="new-password"
          className="rounded-2xl border border-surface-line bg-surface px-4 py-3 outline-none transition focus:border-surface-accent"
          name="newPassword"
          onChange={(event) => setNewPassword(event.target.value)}
          required
          type="password"
          value={newPassword}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-surface-ink/80">
        Confirmar contraseña
        <input
          autoComplete="new-password"
          className="rounded-2xl border border-surface-line bg-surface px-4 py-3 outline-none transition focus:border-surface-accent"
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </label>
      {errorMessage ? (
        <p className="rounded-2xl border border-surface-danger/20 bg-surface-danger/10 px-4 py-3 text-sm text-surface-danger">
          {errorMessage}
        </p>
      ) : null}
      <Button className="mt-2 justify-center" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Actualizando..." : "Guardar nueva contraseña"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
