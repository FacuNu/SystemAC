import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = {
  ok: false;
  message: string;
  code: string;
};

function buildErrorBody(message: string, code: string): ErrorBody {
  return {
    ok: false,
    message,
    code,
  };
}

export function buildErrorResponse(
  error: unknown,
  fallbackMessage = "Ocurrio un error interno.",
) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];

    return NextResponse.json(
      buildErrorBody(issue?.message ?? "Request invalido.", "INVALID_REQUEST"),
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(buildErrorBody(error.message, error.code), {
      status: error.status,
    });
  }

  console.error(error);

  return NextResponse.json(
    buildErrorBody(fallbackMessage, "INTERNAL_ERROR"),
    { status: 500 },
  );
}

export function buildNotImplementedResponse(message: string) {
  return NextResponse.json(buildErrorBody(message, "NOT_IMPLEMENTED"), {
    status: 501,
  });
}
