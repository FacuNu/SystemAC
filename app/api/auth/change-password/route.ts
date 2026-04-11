import { NextResponse } from "next/server";
import {
  changePasswordRequestSchema,
  changePasswordResponseSchema,
} from "@/contracts/auth";
import { buildErrorResponse } from "@/lib/api";
import { changeOwnPassword } from "@/lib/auth";
import { applySessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = changePasswordRequestSchema.parse(await request.json());
    const result = await changeOwnPassword(body);
    const response = NextResponse.json(
      changePasswordResponseSchema.parse({
        ok: true,
        message: result.message,
        redirectTo: result.redirectTo,
      }),
    );

    applySessionCookie(response, result.sessionToken);

    return response;
  } catch (error) {
    return buildErrorResponse(error, "No se pudo actualizar la contraseña.");
  }
}
