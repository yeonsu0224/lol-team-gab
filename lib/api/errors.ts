import { NextResponse } from "next/server";

export type ApiProvider = "app" | "riot" | "ddragon" | "gemini";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    provider: ApiProvider;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly provider: ApiProvider = "app",
    public readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          provider: error.provider,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        provider: "app",
      },
    },
    { status: 500 },
  );
}

export function requireQueryParam(
  request: Request,
  name: string,
  message: string,
): string {
  const value = new URL(request.url).searchParams.get(name)?.trim();
  if (!value) {
    throw new ApiError(400, "INVALID_REQUEST", message);
  }
  return value;
}
