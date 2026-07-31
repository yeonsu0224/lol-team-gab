import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireQuery } from "@/lib/api/errors";
import { getDemoPlayer, isDemoMode, isDemoPuuid } from "@/lib/demo/mode";
import { localizeApiMessage } from "@/lib/i18n/apiMessages";
import { localeFromRequest } from "@/lib/i18n/locale";
import { getMatch, getMatchIds, getPlayer } from "@/lib/riot/api";
import { buildPlayerSummary } from "@/lib/riot/playerSummary";

export async function GET(request: Request) {
  try {
    const locale = localeFromRequest(request);
    const puuid = requireQuery(request.url, "puuid");

    if (isDemoPuuid(puuid)) {
      const player = getDemoPlayer(puuid);
      if (!player) {
        throw new ApiError(localizeApiMessage("DEMO_PLAYER_ONLY", locale), 400, "DEMO_PLAYER_ONLY");
      }
      return NextResponse.json(player);
    }

    if (isDemoMode()) {
      throw new ApiError(localizeApiMessage("DEMO_PLAYER_ONLY", locale), 400, "DEMO_PLAYER_ONLY");
    }

    const [{ summoner, entries, masteries }, ids] = await Promise.all([
      getPlayer(puuid),
      getMatchIds(puuid, 20),
    ]);
    const matches = await Promise.all(ids.slice(0, 12).map((id) => getMatch(id).catch(() => null)));
    return NextResponse.json(buildPlayerSummary(puuid, summoner, entries, masteries, matches));
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
