import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    status: number;
    retryable?: boolean;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly options?: { retryable?: boolean; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  const normalized = normalizeApiError(error);
  return NextResponse.json(
    {
      error: {
        code: normalized.code,
        message: normalized.message,
        status: normalized.status,
        retryable: normalized.options?.retryable,
        details: normalized.options?.details,
      },
    },
    { status: normalized.status },
  );
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  console.error("Unhandled API error", error);
  return new ApiError(500, "INTERNAL_ERROR", "요청을 처리하지 못했습니다.", {
    retryable: true,
  });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "올바른 JSON 요청이 필요합니다.");
  }
}

export function requiredSearchParam(url: URL, name: string): string {
  const value = url.searchParams.get(name)?.trim();
  if (!value) throw new ApiError(400, "MISSING_PARAMETER", `${name} 값이 필요합니다.`);
  return value;
}
