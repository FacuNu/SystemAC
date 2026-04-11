import { NextResponse } from "next/server";
import { loginRequestSchema } from "@/contracts/auth";
import { login } from "@/lib/auth";
import { buildErrorResponse } from "@/lib/api";
import { applySessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = loginRequestSchema.parse(await request.json());
    const result = await login(body);
    const response = NextResponse.json({
      ok: result.ok,
      message: result.message,
      redirectTo: result.redirectTo,
      user: result.user,
    });

    applySessionCookie(response, result.sessionToken);

    return response;
  } catch (error) {
    return buildErrorResponse(error, "No se pudo iniciar sesion.");
  }
}
