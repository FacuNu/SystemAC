import type { GeoPoint, ReportSummary } from "@/types/domain";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "full",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateLabel(value: string | null) {
  if (!value) {
    return "Pendiente";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return "Pendiente";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatTimeLabel(value: string | null) {
  if (!value) {
    return "Pendiente";
  }

  return timeFormatter.format(new Date(value));
}

export function formatWorkedHoursLabel(totalMinutes: number | null) {
  if (totalMinutes === null) {
    return "Pendiente";
  }

  return `${(totalMinutes / 60).toFixed(2)} hs`;
}

export function getElapsedWorkedMinutes(checkInAt: string | null) {
  if (!checkInAt) {
    return null;
  }

  const checkInDate = new Date(checkInAt);

  if (Number.isNaN(checkInDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - checkInDate.getTime()) / 60000));
}

export function formatLocationLabel(location: GeoPoint | null) {
  if (!location) {
    return "Ubicacion pendiente";
  }

  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)} · ±${location.accuracy.toFixed(1)} m`;
}

export function formatReportStatus(status: ReportSummary["status"]) {
  switch (status) {
    case "open":
      return "Jornada abierta";
    case "closed":
      return "Jornada cerrada";
    case "nullified":
      return "Reporte nulo";
    default:
      return status;
  }
}

export function getGeolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Necesitas habilitar la geolocalizacion para continuar.";
    case error.POSITION_UNAVAILABLE:
      return "No se pudo obtener tu ubicacion actual. Intentalo nuevamente.";
    case error.TIMEOUT:
      return "La geolocalizacion demoro demasiado. Volve a intentarlo.";
    default:
      return "No se pudo obtener la geolocalizacion.";
  }
}

export function requestCurrentLocation() {
  return new Promise<{ location: GeoPoint; capturedAt: string }>(
    (resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(
          new Error(
            "Tu navegador no soporta geolocalizacion. Usa un navegador compatible.",
          ),
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            capturedAt: new Date().toISOString(),
          });
        },
        (error) => reject(new Error(getGeolocationErrorMessage(error))),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    },
  );
}
