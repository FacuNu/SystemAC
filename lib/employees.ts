import { createHash } from "crypto";
import { hash } from "bcryptjs";
import {
  createEmployeeRequestSchema,
  resetEmployeePasswordRequestSchema,
  updateEmployeeRequestSchema,
  type CreateEmployeeRequest,
  type ResetEmployeePasswordRequest,
  type UpdateEmployeeRequest,
} from "@/contracts/employees";
import { ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/db";
import type { Database } from "@/types/database";
import type { Employee } from "@/types/domain";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

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

function buildCompensationUpdate(
  compensationType: "hourly" | "monthly",
  amount: number,
) {
  return compensationType === "monthly"
    ? {
        hourly_rate: null,
        monthly_salary: amount,
      }
    : {
        hourly_rate: amount,
        monthly_salary: null,
      };
}

function normalizeEmployeeWriteError(error: {
  code?: string;
  message?: string;
  details?: string;
} | null) {
  if (!error) {
    return null;
  }

  const details = `${error.message ?? ""} ${error.details ?? ""}`;

  if (error.code === "23505" || details.includes("employees_employee_code_uidx")) {
    return new ApiError(
      409,
      "EMPLOYEE_CODE_CONFLICT",
      "Ya existe un empleado con ese codigo.",
    );
  }

  if (details.includes("monthly_salary")) {
    return new ApiError(
      500,
      "EMPLOYEE_MIGRATION_REQUIRED",
      "Falta aplicar la migracion de sueldo mensual en Supabase.",
    );
  }

  return new ApiError(
    500,
    "EMPLOYEE_WRITE_FAILED",
    "No se pudo guardar el empleado en la base de datos.",
  );
}

export async function createEmployee(payload: CreateEmployeeRequest) {
  await requireRole("admin");

  const parsed = createEmployeeRequestSchema.parse(payload);
  const supabase = getSupabaseServiceClient();
  const passwordHash = await hash(parsed.dni, 10);
  const dniHash = createHash("sha256").update(parsed.dni).digest("hex");
  const compensation = buildCompensationUpdate(
    parsed.compensationType,
    parsed.amount,
  );
  const insertPayload = {
    full_name: parsed.fullName,
    employee_code: parsed.employeeCode,
    password_hash: passwordHash,
    dni_hash: dniHash,
    role: "employee" as const,
    is_active: parsed.isActive,
    password_change_required: true,
    ...compensation,
  };
  const { data, error } = await supabase
    .from("employees")
    .insert(insertPayload)
    .select("*")
    .single();

  const normalizedError = normalizeEmployeeWriteError(error);

  if (normalizedError) {
    throw normalizedError;
  }

  return mapEmployee(data as EmployeeRow);
}

export async function resetEmployeePassword(
  employeeId: string,
  payload: ResetEmployeePasswordRequest,
) {
  await requireRole("admin");

  const parsed = resetEmployeePasswordRequestSchema.parse(payload);
  const passwordHash = await hash(parsed.newPassword, 10);
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("employees")
    .update({
      password_hash: passwordHash,
      password_change_required: true,
    })
    .eq("id", employeeId)
    .eq("role", "employee")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "EMPLOYEE_PASSWORD_RESET_FAILED",
      "No se pudo restablecer la contraseña del empleado.",
    );
  }

  if (!data) {
    throw new ApiError(404, "EMPLOYEE_NOT_FOUND", "No se encontro el empleado.");
  }

  return {
    ok: true as const,
    message:
      "Contraseña restablecida. El empleado debera cambiarla en su proximo ingreso.",
  };
}

export async function updateEmployee(
  employeeId: string,
  payload: UpdateEmployeeRequest,
) {
  await requireRole("admin");

  const parsed = updateEmployeeRequestSchema.parse(payload);
  const supabase = getSupabaseServiceClient();
  const compensation = buildCompensationUpdate(
    parsed.compensationType,
    parsed.amount,
  );
  const updatePayload = {
    full_name: parsed.fullName,
    employee_code: parsed.employeeCode,
    is_active: parsed.isActive,
    ...compensation,
  };
  const { data, error } = await supabase
    .from("employees")
    .update(updatePayload)
    .eq("id", employeeId)
    .eq("role", "employee")
    .select("*")
    .maybeSingle();

  const normalizedError = normalizeEmployeeWriteError(error);

  if (normalizedError) {
    throw normalizedError;
  }

  if (!data) {
    throw new ApiError(404, "EMPLOYEE_NOT_FOUND", "No se encontro el empleado.");
  }

  return mapEmployee(data as EmployeeRow);
}
