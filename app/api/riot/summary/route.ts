import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { generateGemini } from "@/lib/gemini/client";

const ON_TOPIC =
  /내전|리그|롤\b|lol|팀|밸런스|플레이어|소환사|티어|꿀벌|mvp|kda|딜|라인|챔피언|재밸런스|점수|승|패|전력|등급|기대|분석|구성|배정|근거|왜|어떻|누구|어느/i;

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      mode?: "normal" | "friend";
      surface?: string;
      context?: unknown;
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      question?: string;
    };
    const question = body.question?.trim();
    if (question && !ON_TOPIC.test(question)) {
      return NextResponse.json({
        summary: "",
        suggestions: ["팀 밸런스가 왜 이렇게 나왔나요?", "이번 판 MVP는 누구인가요?", "기대 이상 플레이어를 알려주세요"],
        answer: "내전과 리그 오브 레전드 플레이어·팀에 대한 질문만 답할 수 있어요.",
        refused: true,
        notablePlayers: [],
      });
    }

    const prompt = [
      "너는 LoL 내전 총무를 돕는 한국어 분석 어시스턴트다.",
      "내전·리그 오브 레전드 플레이어·팀 밸런스와 무관한 질문이면 refused:true 와 짧은 거절 문구만 답한다.",
      "반드시 JSON으로 답한다: {summary:string, notablePlayers:[{riotId:string,reason:string}], suggestions:string[], answer?:string, refused?:boolean}.",
      "suggestions는 현재 맥락에 맞는 짧은 예시 질문 정확히 3개다.",
      "notablePlayers는 구조화 데이터에 근거한 0~2명이며 unrated는 성과 후보에서 제외한다.",
      "answer/summary는 간단한 마크다운(굵게·목록)을 써도 된다.",
      body.mode === "friend"
        ? "찐친 모드지만 혐오·욕설·인신공격은 금지한다."
        : "일반 모드이므로 부정적 개인 평가는 금지하고 칭찬·중립적으로 쓴다.",
      `화면: ${body.surface ?? "unknown"}`,
      `질문: ${question ?? "현재 화면을 요약해줘"}`,
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
