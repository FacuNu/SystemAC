import { NextResponse } from "next/server";
import {
  checkOutRequestSchema,
  checkOutResponseSchema,
} from "@/contracts/reports";
import { buildErrorResponse } from "@/lib/api";
import { closeCheckOutReport } from "@/lib/reports";

export async function POST(request: Request) {
  try {
    const body = checkOutRequestSchema.parse(await request.json());
    const report = await closeCheckOutReport(body);
    const message =
      report.status === "nullified"
        ? "Reporte nulo registrado correctamente."
        : "Egreso registrado correctamente.";

    return NextResponse.json(
      checkOutResponseSchema.parse({
        ok: true,
        message,
        report,
      }),
    );
  } catch (error) {
    return buildErrorResponse(error, "No se pudo registrar el egreso.");
  }
}
