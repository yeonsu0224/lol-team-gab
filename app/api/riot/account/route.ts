import { NextResponse } from "next/server";

import {
  ApiError,
  apiErrorResponse,
  requireQueryParam,
} from "@/lib/api/errors";
import { getAccountByRiotId, parseRiotId } from "@/lib/riot/account";

export async function GET(request: Request) {
  try {
    const riotId = requireQueryParam(
      request,
      "riotId",
      "Riot ID를 게임명#태그 형식으로 입력해 주세요.",
    );
    const parsed = parseRiotId(riotId);
    if (!parsed) {
      throw new ApiError(
        400,
        "INVALID_RIOT_ID",
        "Riot ID를 게임명#태그 형식으로 입력해 주세요.",
      );
    }

    return NextResponse.json(
      await getAccountByRiotId(parsed.gameName, parsed.tagLine),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
