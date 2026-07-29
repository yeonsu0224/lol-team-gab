import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { getMatch } from "@/lib/riot/matches";

interface MatchRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: MatchRouteContext) {
  try {
    const { id } = await context.params;
    if (!id.trim()) {
      throw new ApiError(400, "INVALID_MATCH_ID", "경기 ID가 필요합니다.");
    }
    return NextResponse.json(await getMatch(id));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
