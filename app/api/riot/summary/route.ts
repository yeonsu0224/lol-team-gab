import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { generateGeminiJson } from "@/lib/gemini/client";
import type { CommentMode, PerformanceGrade, TeamSide } from "@/lib/types";

interface SummaryPlayer {
  riotId: string;
  team: TeamSide;
  honeyBeeBadge?: string;
  performanceGrade: PerformanceGrade | null;
  unrated: boolean;
  roundBelowExpect?: boolean;
}

interface SummaryPayload {
  context: "team" | "trial" | "rebalance";
  teams: {
    blue: { averageTier: string; powerPct: number; synergy?: string };
    red: { averageTier: string; powerPct: number; synergy?: string };
  };
  changes?: Array<{
    outPuuid: string;
    inPuuid: string;
    toTeam: TeamSide;
    reason: string;
  }>;
  players?: SummaryPlayer[];
}

interface SummaryResult {
  summary: string;
  bullets: string[];
}

const summarySchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    bullets: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
  },
  required: ["summary", "bullets"],
};

function isSummaryPayload(value: unknown): value is SummaryPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<SummaryPayload>;
  return (
    ["team", "trial", "rebalance"].includes(candidate.context ?? "") &&
    typeof candidate.teams?.blue?.averageTier === "string" &&
    Number.isFinite(candidate.teams.blue.powerPct) &&
    typeof candidate.teams?.red?.averageTier === "string" &&
    Number.isFinite(candidate.teams.red.powerPct) &&
    (candidate.players === undefined || Array.isArray(candidate.players)) &&
    (candidate.changes === undefined || Array.isArray(candidate.changes))
  );
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(
        400,
        "INVALID_JSON",
        "요약할 데이터를 JSON 형식으로 보내 주세요.",
      );
    }

    const candidate = body as {
      mode?: CommentMode;
      payload?: unknown;
    };
    const mode: CommentMode = candidate.mode ?? "normal";
    if (mode !== "normal" && mode !== "friend") {
      throw new ApiError(
        400,
        "INVALID_COMMENT_MODE",
        "요약 모드는 normal 또는 friend여야 합니다.",
      );
    }
    if (!isSummaryPayload(candidate.payload)) {
      throw new ApiError(
        400,
        "INVALID_SUMMARY_PAYLOAD",
        "팀 평균 티어와 전력 비율이 포함된 요약 데이터가 필요합니다.",
      );
    }

    const payload = {
      ...candidate.payload,
      players: candidate.payload.players?.filter((player) => !player.unrated),
    };
    const toneInstruction =
      mode === "friend"
        ? "찐친 모드다. 기대 이하 선수에 대한 장난스러운 코멘트는 허용하지만 모욕·혐오 표현은 금지한다."
        : "일반 모드다. 특정 개인에 대한 부정적 평가, 범인 지목, 기대 이하 언급을 절대 하지 말고 팀 단위로만 건설적으로 설명한다.";

    const result = await generateGeminiJson<SummaryResult>(
      [
        {
          text: `너는 리그 오브 레전드 내전 팀 구성 도우미다.
${toneInstruction}
입력에서 제외된 unrated 참가자를 추측하거나 언급하지 마라.
전력 비율, 평균 티어, 팀 이동, 꿀벌, 성과 등급 중 실제 제공된 정보만 사용해 한국어로 짧게 요약하라.

입력:
${JSON.stringify(payload)}`,
        },
      ],
      summarySchema,
    );

    return NextResponse.json({ mode, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
