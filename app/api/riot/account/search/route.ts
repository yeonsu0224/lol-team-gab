import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireQuery } from "@/lib/api/errors";
import { lpValueToTier, tierToLpValue } from "@/lib/domain/lp";
import { getAccount, getPlayer } from "@/lib/riot/api";

export async function GET(request: Request) {
  try {
    const query = requireQuery(request.url, "q");
    const separator = query.lastIndexOf("#");
    if (separator <= 0 || separator === query.length - 1) {
      throw new ApiError(
        "원격 검색에는 게임명#태그를 정확히 입력해 주세요. 태그 없는 검색은 이전 플레이어 목록에서만 제공됩니다.",
        400,
        "RIOT_ID_TAG_REQUIRED",
      );
    }
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
    return apiErrorResponse(cause);
  }
}
