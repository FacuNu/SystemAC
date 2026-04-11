"use client";

import { LocateFixed, LogIn, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTimeLabel, requestCurrentLocation } from "./report-utils";
import type { GeoPoint, ReportSummary } from "@/types/domain";

type CheckInApiResponse =
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

type PreparedCheckIn = {
  location: GeoPoint;
  capturedAt: string;
};

export function CheckInForm() {
  const router = useRouter();
  const [preparedCheckIn, setPreparedCheckIn] = useState<PreparedCheckIn | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestLocation(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsLocating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nextPreparedCheckIn = await requestCurrentLocation();

      setPreparedCheckIn(nextPreparedCheckIn);
    } catch (error) {
      setPreparedCheckIn(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo obtener la geolocalizacion.",
      );
    } finally {
      setIsLocating(false);
    }
  }

  async function handleSubmit(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!preparedCheckIn) {
      setErrorMessage("Primero debes obtener tu geolocalizacion.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/reports/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: preparedCheckIn.location,
          clientTimestamp: preparedCheckIn.capturedAt,
        }),
      });
      const payload = (await response.json()) as CheckInApiResponse;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message);
        return;
      }

      setReport(payload.report);
      setSuccessMessage(payload.message);
      setShowSuccessPopup(true);
    } catch {
      setErrorMessage("No se pudo registrar el ingreso. Intentalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6">
      <div className="grid gap-4 rounded-[1.75rem] border border-surface-line bg-white/70 p-5">
        <div className="flex items-center gap-3 text-sm text-surface-ink/75">
          <LocateFixed className="size-4 text-surface-accent" />
          La geolocalizacion se toma desde el navegador al momento de preparar el ingreso.
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={isLocating || isSubmitting}
            onClick={handleRequestLocation}
            variant="secondary"
          >
            {isLocating
              ? "Obteniendo ubicacion..."
              : preparedCheckIn
                ? "Ubicacion lista"
                : "Obtener ubicacion"}
            <RefreshCcw className="size-4" />
          </Button>
          {preparedCheckIn ? (
            <Button
              disabled={isSubmitting}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? "Registrando ingreso..." : "Confirmar ingreso"}
              <LogIn className="size-4" />
            </Button>
          ) : null}
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
              Ingreso confirmado
            </p>
            <p className="mt-4 text-xl font-semibold text-surface-ink">
              {successMessage}
            </p>
            <p className="mt-3 text-sm text-surface-ink/72">
              La jornada quedo iniciada a las{" "}
              <span className="font-semibold text-surface-ink">
                {formatDateTimeLabel(report.checkInAt)}
              </span>
              .
            </p>
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
