import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { generateGemini } from "@/lib/gemini/client";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { image?: string; mimeType?: string };
    if (!body.image || !body.mimeType) {
      throw new ApiError("분석할 이미지가 필요합니다.", 400, "IMAGE_REQUIRED");
    }
    const raw = await generateGemini([
      {
        text: "LoL 점수판에서 플레이어 이름, 챔피언, 라인, KDA, 챔피언 피해량을 추출해 JSON {players:[{riotId,championName,role,kda,damage}]}만 반환해.",
      },
      { inlineData: { mimeType: body.mimeType, data: body.image } },
    ]);
    return NextResponse.json(JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")));
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
