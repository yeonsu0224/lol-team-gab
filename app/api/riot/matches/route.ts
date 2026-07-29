import { NextResponse } from "next/server";

import { apiErrorResponse, requireQueryParam } from "@/lib/api/errors";
import { getRecentMatches } from "@/lib/riot/matches";

export async function GET(request: Request) {
  try {
    const puuid = requireQueryParam(
      request,
      "puuid",
      "플레이어 PUUID가 필요합니다.",
    );
    return NextResponse.json(await getRecentMatches(puuid));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
