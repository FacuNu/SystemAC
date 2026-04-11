import { ApiError } from "@/lib/api";
import { dateRangeSchema, geoPointSchema } from "@/contracts/shared";

export const sharedValidations = {
  dateRangeSchema,
  geoPointSchema,
};

export function normalizeTaskText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function ensureNullReportConfirmation(
  taskText: string | null,
  confirmNullReport: boolean,
) {
  if (!taskText && !confirmNullReport) {
    throw new ApiError(
      422,
      "REPORT_NULL_CONFIRMATION_REQUIRED",
      "Si no cargas tareas, debes confirmar el reporte nulo.",
    );
  }
}

export function calculateWorkedMinutes(
  checkInAt: string | Date,
  checkOutAt: string | Date,
) {
  const checkInDate = new Date(checkInAt);
  const checkOutDate = new Date(checkOutAt);

  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime())
  ) {
    throw new ApiError(
      422,
      "REPORT_INVALID_TIMESTAMP",
      "No se pudo validar la fecha de la jornada.",
    );
  }

  const differenceInMilliseconds =
    checkOutDate.getTime() - checkInDate.getTime();

  if (differenceInMilliseconds < 0) {
    throw new ApiError(
      422,
      "REPORT_CHECKOUT_BEFORE_CHECKIN",
      "El egreso no puede ser anterior al ingreso.",
    );
  }

  return Math.floor(differenceInMilliseconds / 60000);
}
