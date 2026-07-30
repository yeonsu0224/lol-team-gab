import { NextResponse } from "next/server";

import { apiErrorResponse, requireQuery } from "@/lib/api/errors";
import { getMatch, getMatchIds } from "@/lib/riot/api";

export async function GET(request: Request) {
  try {
    const puuid = requireQuery(request.url, "puuid");
    const ids = await getMatchIds(puuid, 10);
    const matches = await Promise.all(ids.map((id) => getMatch(id)));
    return NextResponse.json({ matches });
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
