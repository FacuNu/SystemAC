import { NextResponse } from "next/server";
import {
  resetEmployeePasswordRequestSchema,
  resetEmployeePasswordResponseSchema,
} from "@/contracts/employees";
import { buildErrorResponse } from "@/lib/api";
import { resetEmployeePassword } from "@/lib/employees";

type EmployeeResetPasswordRouteProps = {
  params: Promise<{
    employeeId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: EmployeeResetPasswordRouteProps,
) {
  try {
    const { employeeId } = await params;
    const body = resetEmployeePasswordRequestSchema.parse(await request.json());
    const result = await resetEmployeePassword(employeeId, body);

    return NextResponse.json(
      resetEmployeePasswordResponseSchema.parse({
        ok: true,
        message: result.message,
      }),
    );
  } catch (error) {
    return buildErrorResponse(
      error,
      "No se pudo restablecer la contraseña del empleado.",
    );
  }
}
