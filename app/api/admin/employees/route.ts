import { NextResponse } from "next/server";
import {
  createEmployeeRequestSchema,
  employeeMutationResponseSchema,
} from "@/contracts/employees";
import { buildErrorResponse } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { createEmployee } from "@/lib/employees";
import { getEmployeesByRole } from "@/lib/reports";

export async function GET() {
  try {
    await requireRole("admin");

    return NextResponse.json({
      ok: true,
      employees: await getEmployeesByRole("employee"),
    });
  } catch (error) {
    return buildErrorResponse(error, "No se pudieron consultar los empleados.");
  }
}

export async function POST(request: Request) {
  try {
    const body = createEmployeeRequestSchema.parse(await request.json());
    const employee = await createEmployee(body);

    return NextResponse.json(
      employeeMutationResponseSchema.parse({
        ok: true,
        message: "Empleado creado correctamente.",
        employee,
      }),
    );
  } catch (error) {
    return buildErrorResponse(error, "No se pudo crear el empleado.");
  }
}
