import { NextResponse } from "next/server";
import {
  checkInRequestSchema,
  checkInResponseSchema,
} from "@/contracts/reports";
import { buildErrorResponse } from "@/lib/api";
import { createCheckInReport } from "@/lib/reports";

export async function POST(request: Request) {
  try {
    const body = checkInRequestSchema.parse(await request.json());
    const report = await createCheckInReport(body);

    return NextResponse.json(
      checkInResponseSchema.parse({
        ok: true,
        message: "Inicio de jornada exitoso.",
        report,
      }),
    );
  } catch (error) {
    return buildErrorResponse(error, "No se pudo registrar el ingreso.");
  }
}
