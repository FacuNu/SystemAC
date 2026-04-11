import { NextResponse } from "next/server";
import {
  employeeMutationResponseSchema,
  updateEmployeeRequestSchema,
} from "@/contracts/employees";
import { buildErrorResponse } from "@/lib/api";
import { updateEmployee } from "@/lib/employees";

type EmployeeRouteProps = {
  params: Promise<{
    employeeId: string;
  }>;
};

export async function PATCH(request: Request, { params }: EmployeeRouteProps) {
  try {
    const { employeeId } = await params;
    const body = updateEmployeeRequestSchema.parse(await request.json());
    const employee = await updateEmployee(employeeId, body);

    return NextResponse.json(
      employeeMutationResponseSchema.parse({
        ok: true,
        message: "Empleado actualizado correctamente.",
        employee,
      }),
    );
  } catch (error) {
    return buildErrorResponse(error, "No se pudo actualizar el empleado.");
  }
}
