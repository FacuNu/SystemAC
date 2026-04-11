import { monthlyXlsxRequestSchema } from "@/contracts/admin";
import { buildErrorResponse } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import {
  buildMonthlyWorkbook,
  serializeWorkbookToBuffer,
} from "@/lib/excel";
import { getEmployeesByRole, getReportsByDateRange } from "@/lib/reports";
import { buildSalarySummary } from "@/lib/salary";

function buildFileName(fromDate: string, toDate: string) {
  return `reporte-mensual-${fromDate}_a_${toDate}.xlsx`;
}

export async function POST(request: Request) {
  try {
    await requireRole("admin");

    const payload = monthlyXlsxRequestSchema.parse(await request.json());
    const [reports, employees] = await Promise.all([
      getReportsByDateRange(payload.fromDate, payload.toDate),
      getEmployeesByRole("employee"),
    ]);
    const reportsByEmployeeId = new Map<string, typeof reports>();

    for (const report of reports) {
      const employeeReports = reportsByEmployeeId.get(report.employeeId) ?? [];
      employeeReports.push(report);
      reportsByEmployeeId.set(report.employeeId, employeeReports);
    }

    const summary = employees.map((employee) =>
      buildSalarySummary(
        employee.id,
        employee.fullName,
        employee.hourlyRate,
        employee.monthlySalary,
        reportsByEmployeeId.get(employee.id) ?? [],
      ),
    );
    const workbook = await buildMonthlyWorkbook({ reports, summary });
    const buffer = await serializeWorkbookToBuffer(workbook);
    const fileName = buildFileName(payload.fromDate, payload.toDate);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    return buildErrorResponse(
      error,
      "No se pudo generar el archivo XLSX del periodo.",
    );
  }
}
