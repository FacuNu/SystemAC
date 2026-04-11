import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session";

function buildRedirectResponse(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const user = await getSessionUserFromRequest(request);

  if (pathname === "/cambiar-contrasena") {
    if (!user) {
      return buildRedirectResponse(request, "/login");
    }

    if (!user.mustChangePassword) {
      return buildRedirectResponse(
        request,
        user.role === "admin" ? "/admin" : "/panel",
      );
    }

    return NextResponse.next();
  }

  if (pathname === "/login" && user) {
    return buildRedirectResponse(
      request,
      user.mustChangePassword
        ? "/cambiar-contrasena"
        : user.role === "admin"
          ? "/admin"
          : "/panel",
    );
  }

  if (pathname.startsWith("/panel")) {
    if (!user) {
      return buildRedirectResponse(request, "/login");
    }

    if (user.mustChangePassword) {
      return buildRedirectResponse(request, "/cambiar-contrasena");
    }

    if (user.role !== "employee") {
      return buildRedirectResponse(request, "/admin");
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return buildRedirectResponse(request, "/login");
    }

    if (user.mustChangePassword) {
      return buildRedirectResponse(request, "/cambiar-contrasena");
    }

    if (user.role !== "admin") {
      return buildRedirectResponse(request, "/panel");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/cambiar-contrasena", "/panel/:path*", "/admin/:path*"],
};
