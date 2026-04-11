import {
  checkInRequestSchema,
  checkOutRequestSchema,
  type CheckInRequest,
  type CheckOutRequest,
} from "@/contracts/reports";
import { ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/db";
import {
  calculateWorkedMinutes,
  ensureNullReportConfirmation,
  normalizeTaskText,
} from "@/lib/validations";
import type { Database } from "@/types/database";
import type { Employee, ReportSummary } from "@/types/domain";

type WorkReportRow = Database["public"]["Tables"]["work_reports"]["Row"];
type WorkReportStatus = Database["public"]["Enums"]["work_report_status"];
type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const REPORT_SELECT =
  "id, employee_id, work_date, check_in_at, check_out_at, check_in_lat, check_in_lng, check_in_accuracy, check_out_lat, check_out_lng, check_out_accuracy, task_text, null_report, total_minutes, status, created_at, updated_at";

function mapWorkReportToSummary(row: WorkReportRow): ReportSummary {
  return {
    id: row.id,
    employeeId: row.employee_id,
    workDate: row.work_date,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
    checkInLocation: {
      lat: row.check_in_lat,
      lng: row.check_in_lng,
      accuracy: row.check_in_accuracy,
    },
    checkOutLocation:
      row.check_out_lat === null ||
      row.check_out_lng === null ||
      row.check_out_accuracy === null
        ? null
        : {
            lat: row.check_out_lat,
            lng: row.check_out_lng,
            accuracy: row.check_out_accuracy,
          },
    taskText: row.task_text,
    nullReport: row.null_report,
    totalMinutes: row.total_minutes,
    status: row.status,
  };
}

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    fullName: row.full_name,
    employeeCode: row.employee_code,
    role: row.role,
    hourlyRate: row.hourly_rate,
    monthlySalary: row.monthly_salary ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function getWorkDateFromIso(timestamp: string) {
  return timestamp.slice(0, 10);
}

function getTodayWorkDate() {
  return getWorkDateFromIso(new Date().toISOString());
}

function getReportConflictMessage(error: {
  code?: string;
  message?: string;
  details?: string;
}) {
  const details = `${error.message ?? ""} ${error.details ?? ""}`;

  if (details.includes("work_reports_one_open_report_per_employee_idx")) {
    return {
      code: "REPORT_OPEN_CONFLICT",
      message: "Ya tenes una jornada abierta.",
    };
  }

  if (details.includes("work_reports_one_report_per_employee_per_day_uidx")) {
    return {
      code: "REPORT_ALREADY_EXISTS_FOR_DATE",
      message: "Ya existe una jornada registrada para hoy.",
    };
  }

  return {
    code: "REPORT_CONFLICT",
    message: "No se pudo guardar la jornada por un conflicto de datos.",
  };
}

function normalizeWriteError(error: {
  code?: string;
  message?: string;
  details?: string;
} | null) {
  if (!error) {
    return null;
  }

  if (error.code === "23505") {
    const conflict = getReportConflictMessage(error);

    return new ApiError(409, conflict.code, conflict.message);
  }

  return new ApiError(
    500,
    "REPORT_QUERY_FAILED",
    "No se pudo guardar el reporte en la base de datos.",
  );
}

async function getOpenReportRowByEmployee(employeeId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("work_reports")
    .select(REPORT_SELECT)
    .eq("employee_id", employeeId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "REPORT_QUERY_FAILED",
      "No se pudo consultar la jornada abierta.",
    );
  }

  return (data as WorkReportRow | null) ?? null;
}

async function getLatestReportRowByEmployeeAndDate(
  employeeId: string,
  workDate: string,
) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("work_reports")
    .select(REPORT_SELECT)
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "REPORT_QUERY_FAILED",
      "No se pudo consultar la jornada del dia.",
    );
  }

  return (data as WorkReportRow | null) ?? null;
}
export async function createCheckInReport(
  payload: CheckInRequest,
): Promise<ReportSummary> {
  const user = await requireRole("employee");
  const { location } = checkInRequestSchema.parse(payload);
  const serverTimestamp = new Date().toISOString();
  const workDate = getWorkDateFromIso(serverTimestamp);
  const existingOpenReport = await getOpenReportRowByEmployee(user.id);

  if (existingOpenReport) {
    throw new ApiError(
      409,
      "REPORT_OPEN_CONFLICT",
      "Ya tenes una jornada abierta. Debes cerrarla antes de marcar un nuevo ingreso.",
    );
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("work_reports")
    .insert({
      employee_id: user.id,
      work_date: workDate,
      check_in_at: serverTimestamp,
      check_in_lat: location.lat,
      check_in_lng: location.lng,
      check_in_accuracy: location.accuracy,
      check_out_at: null,
      check_out_lat: null,
      check_out_lng: null,
      check_out_accuracy: null,
      task_text: null,
      null_report: false,
      total_minutes: null,
      status: "open",
    })
    .select(REPORT_SELECT)
    .single();

  const normalizedError = normalizeWriteError(error);

  if (normalizedError) {
    if (normalizedError.code === "REPORT_OPEN_CONFLICT") {
      const report = await getOpenReportRowByEmployee(user.id);

      if (report) {
        return mapWorkReportToSummary(report);
      }
    }

    if (normalizedError.code === "REPORT_ALREADY_EXISTS_FOR_DATE") {
      throw new ApiError(
        409,
        "REPORT_DAILY_LIMIT_LEGACY",
        "La base todavia esta configurada para una sola jornada por dia. Falta aplicar la migracion nueva en Supabase.",
      );
    }

    throw normalizedError;
  }

  return mapWorkReportToSummary(data as WorkReportRow);
}

export async function closeCheckOutReport(
  payload: CheckOutRequest,
): Promise<ReportSummary> {
  const user = await requireRole("employee");
  const { location, taskText, confirmNullReport } =
    checkOutRequestSchema.parse(payload);
  const openReport = await getOpenReportRowByEmployee(user.id);

  if (!openReport) {
    throw new ApiError(
      409,
      "REPORT_OPEN_NOT_FOUND",
      "No tenes una jornada abierta para registrar el egreso.",
    );
  }

  const normalizedTaskText = normalizeTaskText(taskText);

  ensureNullReportConfirmation(normalizedTaskText, confirmNullReport);

  const serverTimestamp = new Date().toISOString();
  const totalMinutes = calculateWorkedMinutes(
    openReport.check_in_at,
    serverTimestamp,
  );
  const status: WorkReportStatus = normalizedTaskText ? "closed" : "nullified";
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("work_reports")
    .update({
      check_out_at: serverTimestamp,
      check_out_lat: location.lat,
      check_out_lng: location.lng,
      check_out_accuracy: location.accuracy,
      task_text: normalizedTaskText,
      null_report: !normalizedTaskText,
      total_minutes: totalMinutes,
      status,
    })
    .eq("id", openReport.id)
    .eq("status", "open")
    .select(REPORT_SELECT)
    .single();

  const normalizedError = normalizeWriteError(error);

  if (normalizedError) {
    throw normalizedError;
  }

  if (!data) {
    throw new ApiError(
      409,
      "REPORT_ALREADY_CLOSED",
      "La jornada ya fue actualizada por otra operacion.",
    );
  }

  return mapWorkReportToSummary(data as WorkReportRow);
}

export async function getOpenReportByEmployee(
  employeeId: string,
): Promise<ReportSummary | null> {
  const openReport = await getOpenReportRowByEmployee(employeeId);

  return openReport ? mapWorkReportToSummary(openReport) : null;
}

export async function getTodayReportByEmployee(
  employeeId: string,
): Promise<ReportSummary | null> {
  const todayReport = await getLatestReportRowByEmployeeAndDate(
    employeeId,
    getTodayWorkDate(),
  );

  return todayReport ? mapWorkReportToSummary(todayReport) : null;
}

export async function getReportsByDateRange(
  fromDate: string,
  toDate: string,
): Promise<ReportSummary[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("work_reports")
    .select(REPORT_SELECT)
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("work_date", { ascending: true })
    .order("check_in_at", { ascending: true });

  if (error) {
    throw new ApiError(
      500,
      "REPORT_QUERY_FAILED",
      "No se pudieron consultar los reportes del periodo.",
    );
  }

  return ((data as WorkReportRow[] | null) ?? []).map(mapWorkReportToSummary);
}

export async function getEmployeeReportsByDateRange(
  employeeId: string,
  fromDate: string,
  toDate: string,
): Promise<ReportSummary[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("work_reports")
    .select(REPORT_SELECT)
    .eq("employee_id", employeeId)
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("work_date", { ascending: true })
    .order("check_in_at", { ascending: true });

  if (error) {
    throw new ApiError(
      500,
      "REPORT_QUERY_FAILED",
      "No se pudieron consultar los reportes del empleado.",
    );
  }

  return ((data as WorkReportRow[] | null) ?? []).map(mapWorkReportToSummary);
}

export async function getEmployeeReportsLast24Hours(
  employeeId: string,
): Promise<ReportSummary[]> {
  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("work_reports")
    .select(REPORT_SELECT)
    .eq("employee_id", employeeId)
    .gte("check_in_at", since)
    .order("check_in_at", { ascending: false });

  if (error) {
    throw new ApiError(
      500,
      "REPORT_QUERY_FAILED",
      "No se pudieron consultar las jornadas recientes.",
    );
  }

  return ((data as WorkReportRow[] | null) ?? []).map(mapWorkReportToSummary);
}

export async function getEmployeesByRole(role: Employee["role"]) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("role", role)
    .order("full_name", { ascending: true });

  if (error) {
    throw new ApiError(
      500,
      "EMPLOYEE_QUERY_FAILED",
      "No se pudieron consultar los empleados.",
    );
  }

  return ((data as EmployeeRow[] | null) ?? []).map(mapEmployee);
}

export async function getEmployeeById(employeeId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "EMPLOYEE_QUERY_FAILED",
      "No se pudo consultar el empleado.",
    );
  }

  return data ? mapEmployee(data as EmployeeRow) : null;
}
