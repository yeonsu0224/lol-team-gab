import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, parseJsonBody } from "@/lib/api/errors";
import { generateGeminiText, parseGeminiJson } from "@/lib/gemini/client";
import type { CommentMode } from "@/lib/types";

interface SummaryRequest {
  mode?: CommentMode;
  context: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<SummaryRequest>(request);
    if (!body.context || typeof body.context !== "object") {
      throw new ApiError(400, "INVALID_CONTEXT", "요약할 구조화 데이터가 필요합니다.");
    }
    const mode: CommentMode = body.mode === "friend" ? "friend" : "normal";
    const prompt = buildPrompt(mode, body.context);
    const result = parseGeminiJson<{ summary?: unknown }>(await generateGeminiText(prompt));
    if (typeof result.summary !== "string" || !result.summary.trim()) {
      throw new ApiError(502, "GEMINI_INVALID_RESPONSE", "요약 문장을 확인하지 못했습니다.");
    }
    return NextResponse.json({ summary: result.summary.trim(), mode });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

function buildPrompt(mode: CommentMode, context: unknown): string {
  const tone =
    mode === "friend"
      ? "친한 친구끼리 보는 가벼운 말투를 쓰되 욕설, 혐오, 인신공격은 하지 마세요."
      : "중립적이고 격려하는 말투를 사용하고 부정적인 개인 평가나 범인 지목을 하지 마세요.";
  return [
    "리그 오브 레전드 내전의 구조화 데이터를 한국어 2~4문장으로 요약하세요.",
    tone,
    "unrated=true인 참가자는 기대 이상/이하나 성과 평가에서 반드시 제외하세요.",
    "내부 점수와 계산식은 노출하지 말고 팀 평균, 전력 비율, 이동, 꿀벌, 성과 등급처럼 사용자가 이해할 표현만 쓰세요.",
    '반드시 {"summary":"..."} JSON 객체만 반환하세요.',
    `데이터: ${JSON.stringify(context)}`,
  ].join("\n");
}
