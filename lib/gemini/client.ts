import "server-only";

import { ApiError } from "@/lib/api/errors";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { code?: number; message?: string; status?: string };
}

export async function generateGeminiText(prompt: string): Promise<string> {
  return generate([{ text: prompt }]);
}

export async function generateGeminiVision(
  prompt: string,
  image: { mimeType: string; data: string },
): Promise<string> {
  return generate([{ text: prompt }, { inlineData: image }]);
}

export function parseGeminiJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new ApiError(502, "GEMINI_INVALID_RESPONSE", "Gemini 응답을 해석하지 못했습니다.", {
      retryable: true,
    });
  }
}

async function generate(parts: GeminiPart[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "GEMINI_KEY_MISSING", "GEMINI_API_KEY가 설정되지 않았습니다.");
  }
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  let response: Response;
  try {
    response = await fetch(`${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.35, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new ApiError(502, "GEMINI_NETWORK_ERROR", "Gemini API에 연결하지 못했습니다.", {
      retryable: true,
    });
  }

  const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (!response.ok) {
    const denied = response.status === 401 || response.status === 403;
    throw new ApiError(
      response.status,
      denied ? "GEMINI_KEY_REJECTED" : `GEMINI_${response.status}`,
      denied
        ? "Gemini API 키가 만료되었거나 거부되었습니다. 키를 갱신하고 서버를 재시작해 주세요."
        : payload.error?.message || "Gemini 요청에 실패했습니다.",
      { retryable: response.status === 429 || response.status >= 500 },
    );
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new ApiError(502, "GEMINI_EMPTY_RESPONSE", "Gemini가 빈 응답을 반환했습니다.", {
      retryable: true,
    });
  }
  return text;
}
