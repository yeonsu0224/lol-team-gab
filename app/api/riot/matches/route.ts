import { NextResponse } from "next/server";

import { apiErrorResponse, requiredSearchParam } from "@/lib/api/errors";
import { getMatchHistory, getRecentMatches } from "@/lib/riot/matches";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const puuid = requiredSearchParam(url, "puuid");
    return NextResponse.json(
      url.searchParams.get("recent") === "1"
        ? await getRecentMatches(puuid)
        : await getMatchHistory(puuid),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
