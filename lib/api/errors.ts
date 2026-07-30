import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code = "INTERNAL_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(cause: unknown) {
  const error = cause instanceof ApiError
    ? cause
    : new ApiError(cause instanceof Error ? cause.message : "요청을 처리하지 못했습니다.");
  return NextResponse.json(
    { error: { message: error.message, code: error.code, details: error.details } },
    { status: error.status },
  );
}

export function requireQuery(url: string, key: string): string {
  const value = new URL(url).searchParams.get(key)?.trim();
  if (!value) throw new ApiError(`${key} 값이 필요합니다.`, 400, "INVALID_REQUEST");
  return value;
}
