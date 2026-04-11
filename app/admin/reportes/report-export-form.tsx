"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type ReportExportFormProps = {
  defaultFromDate: string;
  defaultToDate: string;
};

export function ReportExportForm({
  defaultFromDate,
  defaultToDate,
}: ReportExportFormProps) {
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/monthly-xlsx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromDate,
          toDate,
          format: "xlsx",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };

        throw new Error(
          payload.message ?? "No se pudo generar el reporte mensual.",
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const fileNameMatch = disposition?.match(/filename="([^"]+)"/);
      const fileName =
        fileNameMatch?.[1] ?? `reporte-mensual-${fromDate}_a_${toDate}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo generar el reporte mensual.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-[1.75rem] border border-surface-line bg-surface px-5 py-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5">
        <div>
          <label
            className="text-sm font-semibold text-surface-ink"
            htmlFor="fromDate"
          >
            Fecha desde
          </label>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
            required
          />
        </div>
        <div>
          <label
            className="text-sm font-semibold text-surface-ink"
            htmlFor="toDate"
          >
            Fecha hasta
          </label>
          <input
            id="toDate"
            name="toDate"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-surface-line bg-white px-4 py-3 text-sm text-surface-ink outline-none transition focus:border-surface-accent"
            required
          />
        </div>
        {errorMessage ? (
          <div className="rounded-2xl border border-surface-danger/20 bg-orange-50 px-4 py-3 text-sm text-surface-danger">
            {errorMessage}
          </div>
        ) : null}
        <Button className="justify-center" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generando XLSX..." : "Generar XLSX"}
        </Button>
      </div>
    </form>
  );
}
