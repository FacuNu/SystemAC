import type {
  CompensationType,
  ReportSummary,
  SalarySummary,
} from "@/types/domain";

function isValidWorkedReport(report: ReportSummary) {
  return !report.nullReport && report.totalMinutes !== null;
}

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateWorkedHours(reports: ReportSummary[]) {
  const validWorkedMinutes = reports.reduce((total, report) => {
    if (!isValidWorkedReport(report)) {
      return total;
    }

    return total + (report.totalMinutes ?? 0);
  }, 0);

  return roundHours(validWorkedMinutes / 60);
}

export function calculateEstimatedSalary(
  workedHours: number,
  hourlyRate: number | null,
  monthlySalary: number | null,
) {
  if (monthlySalary !== null) {
    return monthlySalary;
  }

  if (hourlyRate === null) {
    return null;
  }

  return Math.round(workedHours * hourlyRate * 100) / 100;
}

export function getCompensationType(
  hourlyRate: number | null,
  monthlySalary: number | null,
): CompensationType {
  if (monthlySalary !== null) {
    return "monthly";
  }

  if (hourlyRate !== null) {
    return "hourly";
  }

  return "unset";
}

export function buildSalarySummary(
  employeeId: string,
  employeeName: string,
  hourlyRate: number | null,
  monthlySalary: number | null,
  reports: ReportSummary[],
): SalarySummary {
  const validWorkedMinutes = reports.reduce((total, report) => {
    if (!isValidWorkedReport(report)) {
      return total;
    }

    return total + (report.totalMinutes ?? 0);
  }, 0);
  const validDayCount = reports.filter(isValidWorkedReport).length;
  const nullReportCount = reports.filter((report) => report.nullReport).length;
  const validWorkedHours = calculateWorkedHours(reports);

  return {
    employeeId,
    employeeName,
    validWorkedMinutes,
    validWorkedHours,
    nullReportCount,
    validDayCount,
    compensationType: getCompensationType(hourlyRate, monthlySalary),
    hourlyRate,
    monthlySalary,
    estimatedSalary: calculateEstimatedSalary(
      validWorkedHours,
      hourlyRate,
      monthlySalary,
    ),
  };
}
