import { NextResponse } from "next/server";

import { apiErrorResponse, requiredSearchParam } from "@/lib/api/errors";
import { getPlayer } from "@/lib/riot/player";

export async function GET(request: Request) {
  try {
    const puuid = requiredSearchParam(new URL(request.url), "puuid");
    return NextResponse.json(await getPlayer(puuid));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
