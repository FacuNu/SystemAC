import { compare, hash } from "bcryptjs";
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  type ChangePasswordRequest,
  type LoginRequest,
} from "@/contracts/auth";
import { ApiError } from "@/lib/api";
import { getSupabaseServiceClient } from "@/lib/db";
import {
  createSessionToken,
  getSessionUserFromCookies,
} from "@/lib/session";
import type { EmployeeRole, SessionUser } from "@/types/domain";

type EmployeeAuthRow = {
  id: string;
  full_name: string;
  employee_code: string;
  password_hash: string;
  role: EmployeeRole;
  password_change_required: boolean;
  is_active: boolean;
};

function buildRedirectTo(role: EmployeeRole, mustChangePassword: boolean) {
  if (mustChangePassword) {
    return "/cambiar-contrasena";
  }

  return role === "admin" ? "/admin" : "/panel";
}

function mapEmployeeToSessionUser(employee: EmployeeAuthRow): SessionUser {
  return {
    id: employee.id,
    fullName: employee.full_name,
    employeeCode: employee.employee_code,
    role: employee.role,
    mustChangePassword: employee.password_change_required,
  };
}

function normalizeEmployeeCode(value: string) {
  return value.trim().toUpperCase();
}

export function isAuthError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code.startsWith("AUTH_");
}

export async function login(credentials: LoginRequest) {
  const { employeeCode, password } = loginRequestSchema.parse(credentials);
  const supabase = getSupabaseServiceClient();
  const normalizedEmployeeCode = normalizeEmployeeCode(employeeCode);
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, full_name, employee_code, password_hash, role, password_change_required, is_active",
    )
    .eq("employee_code", normalizedEmployeeCode)
    .maybeSingle<EmployeeAuthRow>();

  if (error) {
    throw new ApiError(
      500,
      "AUTH_QUERY_FAILED",
      "No se pudo validar el usuario.",
    );
  }

  if (!data) {
    throw new ApiError(
      401,
      "AUTH_INVALID_CREDENTIALS",
      "ID o contraseña incorrectos.",
    );
  }

  if (!data.is_active) {
    throw new ApiError(403, "AUTH_USER_INACTIVE", "El usuario esta inactivo.");
  }

  const isPasswordValid = await compare(password, data.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(
      401,
      "AUTH_INVALID_CREDENTIALS",
      "ID o contraseña incorrectos.",
    );
  }

  const user = mapEmployeeToSessionUser(data);

  return {
    ok: true,
    message: "Login correcto.",
    redirectTo: buildRedirectTo(user.role, user.mustChangePassword),
    sessionToken: await createSessionToken(user),
    user,
  };
}

export async function changeOwnPassword(payload: ChangePasswordRequest) {
  const user = await requireAuth();

  if (!user.mustChangePassword) {
    throw new ApiError(
      403,
      "AUTH_PASSWORD_CHANGE_NOT_REQUIRED",
      "Tu usuario no requiere cambio de contraseña.",
    );
  }

  const parsed = changePasswordRequestSchema.parse(payload);
  const passwordHash = await hash(parsed.newPassword, 10);
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("employees")
    .update({
      password_hash: passwordHash,
      password_change_required: false,
    })
    .eq("id", user.id);

  if (error) {
    throw new ApiError(
      500,
      "AUTH_PASSWORD_CHANGE_FAILED",
      "No se pudo actualizar la contraseña.",
    );
  }

  const updatedUser: SessionUser = {
    ...user,
    mustChangePassword: false,
  };

  return {
    ok: true,
    message: "Contraseña actualizada correctamente.",
    redirectTo: buildRedirectTo(updatedUser.role, false),
    sessionToken: await createSessionToken(updatedUser),
  };
}

export async function logout() {
  return {
    ok: true,
    message: "Sesion cerrada.",
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUserFromCookies();
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(
      401,
      "AUTH_UNAUTHORIZED",
      "Se requiere una sesion valida.",
    );
  }

  return user;
}

export async function requireRole(role: EmployeeRole): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role !== role) {
    throw new ApiError(
      403,
      "AUTH_FORBIDDEN",
      "No tenes permisos para acceder a este recurso.",
    );
  }

  return user;
}
