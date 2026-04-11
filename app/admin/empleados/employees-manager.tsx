"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/types/domain";

type EmployeesManagerProps = {
  employees: Employee[];
};

type MutationResponse =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      code: string;
    };

type CompensationType = "hourly" | "monthly";

function getEmployeeCompensation(employee: Employee) {
  if (employee.monthlySalary !== null) {
    return {
      compensationType: "monthly" as const,
      amount: employee.monthlySalary.toFixed(2),
    };
  }

  return {
    compensationType: "hourly" as const,
    amount: employee.hourlyRate?.toFixed(2) ?? "",
  };
}

function formatCompensationPreview(
  compensationType: CompensationType,
  amount: string,
) {
  if (!amount) {
    return "Sin configuracion";
  }

  const parsedAmount = Number(amount);

  if (Number.isNaN(parsedAmount)) {
    return "Sin configuracion";
  }

  return compensationType === "monthly"
    ? `Sueldo mensual: $${parsedAmount.toFixed(2)}`
    : `Pago por hora: $${parsedAmount.toFixed(2)}`;
}

function EmployeeRowEditor({ employee }: { employee: Employee }) {
  const router = useRouter();
  const initialCompensation = getEmployeeCompensation(employee);
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState(employee.fullName);
  const [employeeCode, setEmployeeCode] = useState(employee.employeeCode);
  const [isActive, setIsActive] = useState(employee.isActive);
  const [compensationType, setCompensationType] = useState<CompensationType>(
    initialCompensation.compensationType,
  );
  const [amount, setAmount] = useState(initialCompensation.amount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          employeeCode,
          compensationType,
          amount,
          isActive,
        }),
      });
      const payload = (await response.json()) as MutationResponse;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message);
        return;
      }

      setSuccessMessage(payload.message);
      router.refresh();
    } catch {
      setErrorMessage("No se pudo actualizar el empleado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setIsResettingPassword(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/admin/employees/${employee.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPassword: temporaryPassword,
          }),
        },
      );
      const payload = (await response.json()) as MutationResponse;

      if (!response.ok || !payload.ok) {
        setResetErrorMessage(payload.message);
        return;
      }

      setResetSuccessMessage(payload.message);
      setShowPasswordReset(false);
      setTemporaryPassword("");
    } catch {
      setResetErrorMessage("No se pudo restablecer la contraseña.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <form
      className="overflow-hidden rounded-[1.5rem] border border-surface-line bg-white/70"
      onSubmit={handleSubmit}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-surface/55"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-surface-ink">{fullName}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="mt-1 text-xs text-surface-ink/55">
            {employeeCode} · {formatCompensationPreview(compensationType, amount)}
          </p>
        </div>
        <span className="text-sm font-semibold text-surface-accent">
          {isOpen ? "Ocultar detalles" : "Editar"}
        </span>
      </button>

      {isOpen ? (
        <div className="grid gap-4 border-t border-surface-line px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-surface-ink">
                Nombre completo
              </label>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-surface-ink">
                Codigo
              </label>
              <input
                value={employeeCode}
                onChange={(event) => setEmployeeCode(event.target.value.toUpperCase())}
                className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <label className="text-sm font-semibold text-surface-ink">
                Modalidad
              </label>
              <select
                value={compensationType}
                onChange={(event) =>
                  setCompensationType(event.target.value as CompensationType)
                }
                className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
              >
                <option value="hourly">Pago por hora</option>
                <option value="monthly">Sueldo mensual</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-surface-ink">
                {compensationType === "monthly" ? "Sueldo mensual" : "Valor hora"}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                required
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-surface-ink/72">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Empleado activo
          </label>
          {errorMessage ? (
            <p className="rounded-2xl border border-surface-danger/20 bg-surface-danger/10 px-4 py-3 text-sm text-surface-danger">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {successMessage}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setShowPasswordReset((current) => !current);
                setResetErrorMessage(null);
                setResetSuccessMessage(null);
              }}
              type="button"
              variant="ghost"
            >
              {showPasswordReset ? "Cancelar reset" : "Restablecer contraseña"}
            </Button>
          </div>
          {showPasswordReset ? (
            <div className="grid gap-3 rounded-[1.25rem] border border-surface-line bg-surface px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-surface-ink">
                  Restablecer contraseña
                </p>
                <p className="mt-1 text-sm text-surface-ink/72">
                  Define una contraseña temporal. El empleado debera cambiarla en su proximo ingreso.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="text-sm font-semibold text-surface-ink">
                    Contraseña temporal
                  </label>
                  <input
                    value={temporaryPassword}
                    onChange={(event) => setTemporaryPassword(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                    minLength={8}
                    type="password"
                  />
                </div>
                <Button
                  disabled={isResettingPassword || temporaryPassword.length < 8}
                  onClick={handlePasswordReset}
                  type="button"
                  variant="secondary"
                >
                  {isResettingPassword ? "Restableciendo..." : "Confirmar reset"}
                </Button>
              </div>
              {resetErrorMessage ? (
                <p className="rounded-2xl border border-surface-danger/20 bg-surface-danger/10 px-4 py-3 text-sm text-surface-danger">
                  {resetErrorMessage}
                </p>
              ) : null}
              {resetSuccessMessage ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {resetSuccessMessage}
                </p>
              ) : null}
            </div>
          ) : resetSuccessMessage ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {resetSuccessMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

export function EmployeesManager({ employees }: EmployeesManagerProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [dni, setDni] = useState("");
  const [compensationType, setCompensationType] =
    useState<CompensationType>("hourly");
  const [amount, setAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          employeeCode,
          dni,
          compensationType,
          amount,
          isActive,
        }),
      });
      const payload = (await response.json()) as MutationResponse;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message);
        return;
      }

      setSuccessMessage(payload.message);
      setFullName("");
      setEmployeeCode("");
      setDni("");
      setAmount("");
      setCompensationType("hourly");
      setIsActive(true);
      setShowCreateForm(false);
      router.refresh();
    } catch {
      setErrorMessage("No se pudo crear el empleado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-surface-ink">
              Alta de empleado
            </h2>
            <p className="mt-2 text-sm text-surface-ink/72">
              El empleado ingresara con su codigo y la contraseña inicial basada en el DNI.
            </p>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm((current) => !current);
              setErrorMessage(null);
            }}
            type="button"
            variant="primary"
          >
            Agregar empleado
          </Button>
        </div>

        {showCreateForm ? (
          <form
            className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5"
            onSubmit={handleCreate}
          >
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-surface-ink">
                    Nombre completo
                  </label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-surface-ink">
                    Usuario
                  </label>
                  <input
                    value={employeeCode}
                    onChange={(event) => setEmployeeCode(event.target.value.toUpperCase())}
                    className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[0.9fr_0.9fr_1.2fr] md:items-end">
                <div>
                  <label className="text-sm font-semibold text-surface-ink">DNI</label>
                  <input
                    value={dni}
                    onChange={(event) => setDni(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-surface-ink">
                    Modalidad
                  </label>
                  <select
                    value={compensationType}
                    onChange={(event) =>
                      setCompensationType(event.target.value as CompensationType)
                    }
                    className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                  >
                    <option value="hourly">Pago por hora</option>
                    <option value="monthly">Sueldo mensual</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-surface-ink">
                    {compensationType === "monthly" ? "Sueldo mensual" : "Valor hora"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
                    required
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-surface-ink/72">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                Crear empleado activo
              </label>
              {errorMessage ? (
                <p className="rounded-2xl border border-surface-danger/20 bg-surface-danger/10 px-4 py-3 text-sm text-surface-danger">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {successMessage}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setErrorMessage(null);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Cancelar alta
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Confirmar alta"}
                </Button>
              </div>
            </div>
          </form>
        ) : successMessage ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {successMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-surface-ink">
            Empleados actuales
          </h2>
          <p className="mt-2 text-sm text-surface-ink/72">
            Cada ficha muestra un resumen compacto. Abrela para editar nombre, codigo, estado y modalidad de cobro.
          </p>
        </div>
        {employees.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-surface-line bg-surface px-5 py-6 text-sm text-surface-ink/72">
            Todavia no hay empleados cargados.
          </div>
        ) : (
          employees.map((employee) => (
            <EmployeeRowEditor key={employee.id} employee={employee} />
          ))
        )}
      </div>
    </div>
  );
}
