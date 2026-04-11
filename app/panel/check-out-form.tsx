"use client";

import { ClipboardList, LocateFixed, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import type { GeoPoint, ReportSummary } from "@/types/domain";
import {
  formatDateTimeLabel,
  formatWorkedHoursLabel,
  getElapsedWorkedMinutes,
  requestCurrentLocation,
} from "./report-utils";

type CheckOutApiResponse =
  | {
      ok: true;
      message: string;
      report: ReportSummary | null;
    }
  | {
      ok: false;
      message: string;
      code: string;
    };

type PreparedCheckOut = {
  location: GeoPoint;
  capturedAt: string;
};

type CheckOutFormProps = {
  openReport: ReportSummary;
};

export function CheckOutForm({ openReport }: CheckOutFormProps) {
  const router = useRouter();
  const [preparedCheckOut, setPreparedCheckOut] =
    useState<PreparedCheckOut | null>(null);
  const [taskText, setTaskText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const elapsedWorkedMinutes = getElapsedWorkedMinutes(openReport.checkInAt);

  function handleTaskTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setTaskText(event.target.value);
  }

  async function handleRequestLocation(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsLocating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nextPreparedCheckOut = await requestCurrentLocation();

      setPreparedCheckOut(nextPreparedCheckOut);
    } catch (error) {
      setPreparedCheckOut(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo obtener la geolocalizacion.",
      );
    } finally {
      setIsLocating(false);
    }
  }

  async function submitCheckOut() {
    if (!preparedCheckOut) {
      setErrorMessage("Primero debes obtener tu geolocalizacion de egreso.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/reports/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: preparedCheckOut.location,
          taskText,
          confirmNullReport: false,
          clientTimestamp: preparedCheckOut.capturedAt,
        }),
      });
      const payload = (await response.json()) as CheckOutApiResponse;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message);
        return;
      }

      setReport(payload.report);
      setSuccessMessage(payload.message);
      setShowSuccessPopup(true);
    } catch {
      setErrorMessage("No se pudo registrar el egreso. Intentalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!preparedCheckOut) {
      setErrorMessage("Primero debes obtener tu geolocalizacion de egreso.");
      return;
    }

    if (!taskText.trim()) {
      setErrorMessage("Debes completar las tareas realizadas para registrar el egreso.");
      return;
    }

    await submitCheckOut();
  }

  return (
    <div className="mt-8 grid gap-6">
      <div className="grid gap-4 rounded-[1.75rem] border border-surface-line bg-white/70 p-5 text-sm text-surface-ink/80">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-surface-ink/55">Ingreso</p>
            <p className="font-medium text-surface-ink">
              {formatDateTimeLabel(openReport.checkInAt)}
            </p>
          </div>
          <div>
            <p className="text-surface-ink/55">Total de horas</p>
            <p className="font-medium text-surface-ink">
              {formatWorkedHoursLabel(elapsedWorkedMinutes)}
            </p>
          </div>
        </div>
      </div>

      <label className="grid gap-2 text-sm font-medium text-surface-ink/80">
        Tareas realizadas
        <textarea
          className="min-h-40 rounded-[1.5rem] border border-surface-line bg-surface px-4 py-3 outline-none transition focus:border-surface-accent"
          name="taskText"
          onChange={handleTaskTextChange}
          placeholder="Describe brevemente las tareas del dia."
          required
          value={taskText}
        />
      </label>

      <div className="grid gap-4 rounded-[1.75rem] border border-surface-line bg-surface p-5">
        <div className="flex items-center gap-3 text-sm text-surface-ink/75">
          <LocateFixed className="size-4 text-surface-accent" />
          Antes de cerrar la jornada debes capturar la ubicacion de egreso.
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={isLocating || isSubmitting}
            onClick={handleRequestLocation}
            variant="secondary"
          >
            {isLocating
              ? "Obteniendo ubicacion..."
              : preparedCheckOut
                ? "Ubicacion lista"
                : "Obtener ubicacion"}
            <RefreshCcw className="size-4" />
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? "Registrando egreso..." : "Confirmar egreso"}
            <ClipboardList className="size-4" />
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-surface-danger/20 bg-surface-danger/10 px-4 py-3 text-sm text-surface-danger">
          {errorMessage}
        </p>
      ) : null}

      {showSuccessPopup && successMessage && report ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-ink/45 px-4">
          <div className="w-full max-w-md rounded-[2rem] border border-emerald-200 bg-white p-6 text-center shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Egreso confirmado
            </p>
            <p className="mt-4 text-xl font-semibold text-surface-ink">
              {successMessage}
            </p>
            <p className="mt-3 text-sm text-surface-ink/72">
              La jornada quedo cerrada a las{" "}
              <span className="font-semibold text-surface-ink">
                {formatDateTimeLabel(report.checkOutAt)}
              </span>
              .
            </p>
            <div className="mt-5 rounded-[1.25rem] bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Total de horas
              </p>
              <p className="mt-2 text-lg font-semibold text-surface-ink">
                {formatWorkedHoursLabel(report.totalMinutes)}
              </p>
            </div>
            <div className="mt-6 flex justify-center">
              <Button type="button" onClick={() => router.push("/panel")}>
                Ir al panel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
