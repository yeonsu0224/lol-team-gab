import "server-only";

import { ApiError } from "@/lib/api/errors";

const GEMINI_MODEL = "gemini-3.6-flash";

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiError(
      503,
      "GEMINI_API_KEY_MISSING",
      "Gemini API 키가 설정되지 않았습니다.",
      "gemini",
    );
  }
  return apiKey;
}

interface UpstreamError {
  status: number;
  code: string;
  message: string;
}

function mapUpstreamError(status: number): UpstreamError {
  switch (status) {
    case 401:
    case 403:
      // A rejected key is a server configuration problem, not a caller auth
      // failure, so this surfaces as 503 like a missing key does.
      return {
        status: 503,
        code: "GEMINI_UNAUTHORIZED",
        message:
          "Gemini API 키가 만료되었거나 유효하지 않습니다. 키를 갱신한 뒤 서버를 다시 시작해 주세요.",
      };
    case 429:
      return {
        status,
        code: "GEMINI_RATE_LIMITED",
        message: "Gemini 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
      };
    default:
      return {
        status,
        code: "GEMINI_API_ERROR",
        message: "Gemini 응답을 생성하지 못했습니다.",
      };
  }
}

export async function generateGeminiJson<T>(
  parts: GeminiPart[],
  responseSchema: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getApiKey(),
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = { status: response.status };
    }
    const mapped = mapUpstreamError(response.status);
    throw new ApiError(
      mapped.status,
      mapped.code,
      mapped.message,
      "gemini",
      details,
    );
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new ApiError(
      502,
      "GEMINI_EMPTY_RESPONSE",
      "Gemini가 분석 결과를 반환하지 않았습니다.",
      "gemini",
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new ApiError(
      502,
      "GEMINI_INVALID_RESPONSE",
      "Gemini 분석 결과의 형식이 올바르지 않습니다.",
      "gemini",
      undefined,
      { cause: error },
    );
  }
}
