import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireQuery } from "@/lib/api/errors";
import { findDemoAccount, findDemoAccountByQuery, isDemoMode } from "@/lib/demo/mode";
import { lpValueToTier, tierToLpValue } from "@/lib/domain/lp";
import { localizeApiMessage } from "@/lib/i18n/apiMessages";
import { localeFromRequest } from "@/lib/i18n/locale";
import { getAccount, getPlayer } from "@/lib/riot/api";

export async function GET(request: Request) {
  try {
    const locale = localeFromRequest(request);
    const query = requireQuery(request.url, "q");
    const separator = query.lastIndexOf("#");
    if (separator <= 0 || separator === query.length - 1) {
      throw new ApiError(localizeApiMessage("RIOT_ID_TAG_REQUIRED", locale), 400, "RIOT_ID_TAG_REQUIRED");
    }

    const demoAccount = findDemoAccountByQuery(query)
      ?? findDemoAccount(query.slice(0, separator), query.slice(separator + 1));
    if (demoAccount) {
      return NextResponse.json({
        accounts: [{
          puuid: demoAccount.puuid,
          gameName: demoAccount.gameName,
          tagLine: demoAccount.tagLine,
          profileIconId: demoAccount.profileIconId,
          tier: demoAccount.tier,
        }],
      });
    }

    if (isDemoMode()) {
      throw new ApiError(localizeApiMessage("DEMO_PLAYER_ONLY", locale), 400, "DEMO_PLAYER_ONLY");
    }

    try {
      const gameName = query.slice(0, separator).trim();
      const tagLine = query.slice(separator + 1).trim();
      const account = await getAccount(gameName, tagLine);
      const { summoner, entries } = await getPlayer(account.puuid);
      const solo = entries.find(({ queueType }) => queueType === "RANKED_SOLO_5x5");
      const flex = entries.find(({ queueType }) => queueType === "RANKED_FLEX_SR");
      const ranked = solo ?? flex;
      return NextResponse.json({
        accounts: [{
          ...account,
          profileIconId: summoner.profileIconId,
          tier: ranked
            ? lpValueToTier(tierToLpValue(ranked.tier, ranked.rank, ranked.leaguePoints))
            : null,
        }],
      });
    } catch (cause) {
      if (cause instanceof ApiError && (cause.code === "RIOT_UNAUTHORIZED" || cause.code === "RIOT_API_KEY_MISSING")) {
        throw new ApiError(localizeApiMessage("DEMO_PLAYER_ONLY", locale), 400, "DEMO_PLAYER_ONLY");
      }
      throw cause;
    }
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
