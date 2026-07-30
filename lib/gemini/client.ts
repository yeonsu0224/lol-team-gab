import { ApiError } from "@/lib/api/errors";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export async function generateGemini(
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ApiError("GEMINI_API_KEY가 설정되지 않았습니다.", 503, "GEMINI_API_KEY_MISSING");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.45, responseMimeType: "application/json" },
      }),
    },
  );
  if (response.status === 401 || response.status === 403) {
    throw new ApiError(
      "Gemini API 키가 유효하지 않습니다. 키를 확인하고 서버를 재시작해 주세요.",
      503,
      "GEMINI_UNAUTHORIZED",
    );
  }
  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(`Gemini 요청 실패 (${response.status})`, 502, "GEMINI_API_ERROR", body);
  }
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ApiError("Gemini 응답이 비어 있습니다.", 502, "GEMINI_EMPTY_RESPONSE");
  return text;
}
