import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { generateGemini } from "@/lib/gemini/client";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      mode?: "normal" | "friend";
      surface?: string;
      context?: unknown;
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      question?: string;
    };
    const prompt = [
      "너는 LoL 내전 총무를 돕는 한국어 분석 어시스턴트다.",
      "반드시 JSON으로 답한다: {summary:string, notablePlayers:[{riotId:string,reason:string}], suggestions:string[], answer?:string}.",
      "suggestions는 현재 맥락에 맞는 짧은 예시 질문 정확히 3개다.",
      "notablePlayers는 구조화 데이터에 근거한 0~2명이며 unrated는 성과 후보에서 제외한다.",
      body.mode === "friend"
        ? "찐친 모드지만 혐오·욕설·인신공격은 금지한다."
        : "일반 모드이므로 부정적 개인 평가는 금지하고 칭찬·중립적으로 쓴다.",
      `화면: ${body.surface ?? "unknown"}`,
      `질문: ${body.question ?? "현재 화면을 요약해줘"}`,
      `최근 대화: ${JSON.stringify(body.messages?.slice(-6) ?? [])}`,
      `구조화 데이터: ${JSON.stringify(body.context ?? {})}`,
    ].join("\n");
    const raw = await generateGemini([{ text: prompt }]);
    let value: unknown;
    try {
      value = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
    } catch {
      throw new ApiError("AI 응답 형식을 해석하지 못했습니다.", 502, "GEMINI_INVALID_RESPONSE");
    }
    return NextResponse.json(value);
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
