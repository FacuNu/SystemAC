import type { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/types/domain";

type SessionPayload = SessionUser & {
  exp: number;
  iat: number;
  v: 1;
};

export const sessionConfig = {
  cookieName: SESSION_COOKIE_NAME,
  maxAgeSeconds: 60 * 60 * 12,
} as const;

function getSessionSecret() {
  const secret = env.SESSION_SECRET?.trim();

  if (!secret) {
    throw new ApiError(
      500,
      "SESSION_SECRET_MISSING",
      "Falta SESSION_SECRET en el entorno.",
    );
  }

  return secret;
}

function getSubtleCrypto() {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new ApiError(
      500,
      "CRYPTO_UNAVAILABLE",
      "No hay soporte criptografico disponible para la sesion.",
    );
  }

  return subtle;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

async function createSignature(value: string) {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await subtle.sign("HMAC", key, encoder.encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: sessionConfig.maxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function createSessionToken(user: SessionUser) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    exp: issuedAt + sessionConfig.maxAgeSeconds,
    iat: issuedAt,
    v: 1,
  };
  const encodedPayload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  if (!env.SESSION_SECRET?.trim()) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await createSignature(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload)),
    ) as SessionPayload;

    if (payload.v !== 1 || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      fullName: payload.fullName,
      employeeCode: payload.employeeCode,
      role: payload.role,
      mustChangePassword: Boolean(payload.mustChangePassword),
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUserFromCookies() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionConfig.cookieName)?.value;

  return verifySessionToken(token);
}

export async function getSessionUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(sessionConfig.cookieName)?.value;

  return verifySessionToken(token);
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionConfig.cookieName, token, getSessionCookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionConfig.cookieName, "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
