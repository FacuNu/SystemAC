import { NextResponse } from "next/server";
import { buildErrorResponse } from "@/lib/api";
import { logout } from "@/lib/auth";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    const result = await logout();
    const response = NextResponse.json(result);

    clearSessionCookie(response);

    return response;
  } catch (error) {
    return buildErrorResponse(error, "No se pudo cerrar la sesion.");
  }
}
