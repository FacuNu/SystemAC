import * as XLSX from "xlsx";
import type { ReportSummary, SalarySummary } from "@/types/domain";

export type MonthlyWorkbookData = {
  reports: ReportSummary[];
  summary: SalarySummary[];
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatHours(totalMinutes: number | null, nullReport: boolean) {
  if (totalMinutes === null) {
    return "";
  }

  if (nullReport) {
    return "0.00";
  }

  return (Math.round((totalMinutes / 60) * 100) / 100).toFixed(2);
}

function buildDetailRows(reports: ReportSummary[], summary: SalarySummary[]) {
  const employeeNameById = new Map(
    summary.map((item) => [item.employeeId, item.employeeName]),
  );

  return reports.map((report) => [
    employeeNameById.get(report.employeeId) ?? report.employeeId,
    report.workDate,
    formatDateTime(report.checkInAt),
    formatDateTime(report.checkOutAt),
    formatHours(report.totalMinutes, report.nullReport),
    report.taskText ?? "",
    report.checkInLocation?.lat ?? "",
    report.checkInLocation?.lng ?? "",
    report.checkOutLocation?.lat ?? "",
    report.checkOutLocation?.lng ?? "",
    report.checkInLocation?.accuracy ?? "",
    report.checkOutLocation?.accuracy ?? "",
    report.nullReport ? "Si" : "No",
    report.status,
  ]);
}

function buildSummaryRows(summary: SalarySummary[]) {
  return summary.map((item) => [
    item.employeeName,
    item.validWorkedHours.toFixed(2),
    item.validDayCount,
    item.nullReportCount,
    item.compensationType === "monthly"
      ? "Sueldo mensual"
      : item.compensationType === "hourly"
        ? "Pago por hora"
        : "Sin definir",
    item.hourlyRate ?? "",
    item.monthlySalary ?? "",
    item.estimatedSalary ?? "",
  ]);
}

export async function buildMonthlyWorkbook(data: MonthlyWorkbookData) {
  const workbook = XLSX.utils.book_new();
  const detailSheet = XLSX.utils.aoa_to_sheet([
    [
      "Empleado",
      "Fecha",
      "Ingreso",
      "Egreso",
      "Horas trabajadas",
      "Tareas",
      "Lat ingreso",
      "Lng ingreso",
      "Lat egreso",
      "Lng egreso",
      "Accuracy ingreso",
      "Accuracy egreso",
      "Null report",
      "Estado",
    ],
    ...buildDetailRows(data.reports, data.summary),
  ]);
  const summarySheet = XLSX.utils.aoa_to_sheet([
    [
      "Empleado",
      "Total horas validas",
      "Cantidad de dias validos",
      "Cantidad de reportes nulos",
      "Modalidad",
      "Valor hora",
      "Sueldo mensual",
      "Sueldo estimado",
    ],
    ...buildSummaryRows(data.summary),
  ]);

  detailSheet["!cols"] = [
    { wch: 24 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 42 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
  ];
  summarySheet["!cols"] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  return workbook;
}

export async function serializeWorkbookToBuffer(workbook: XLSX.WorkBook) {
  const output = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}
