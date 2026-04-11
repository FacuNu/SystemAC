export const APP_NAME = "REPORTE HORARIO";
export const APP_DESCRIPTION =
  "Aplicación interna para registrar jornadas laborales, reportes y administración mensual.";

export const SESSION_COOKIE_NAME = "rh_session";

export const REPORT_STATUSES = ["open", "closed", "nullified"] as const;
export const EMPLOYEE_ROLES = ["admin", "employee"] as const;
