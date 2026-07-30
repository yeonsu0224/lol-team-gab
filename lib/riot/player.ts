import "server-only";

import type { RiotLeagueEntry, RiotMastery, RiotSummoner } from "./types";
import { encodePath, platformRequest } from "./api";

export interface PlayerResponse {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  rank: {
    source: "solo" | "flex" | "unranked";
    tier: string | null;
    rank: string | null;
    lp: number | null;
    wins: number | null;
    losses: number | null;
  };
  masteries: RiotMastery[];
}

export async function getPlayer(puuid: string): Promise<PlayerResponse> {
  const summoner = await platformRequest<RiotSummoner>(
    `/lol/summoner/v4/summoners/by-puuid/${encodePath(puuid)}`,
  );
  const [entries, masteries] = await Promise.all([
    platformRequest<RiotLeagueEntry[]>(
      `/lol/league/v4/entries/by-puuid/${encodePath(puuid)}`,
    ),
    platformRequest<RiotMastery[]>(
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodePath(puuid)}/top?count=5`,
    ).catch(() => []),
  ]);

  const solo = entries.find(({ queueType }) => queueType === "RANKED_SOLO_5x5");
  const flex = entries.find(({ queueType }) => queueType === "RANKED_FLEX_SR");
  const selected = solo ?? flex;

  return {
    puuid,
    profileIconId: summoner.profileIconId,
    summonerLevel: summoner.summonerLevel,
    rank: selected
      ? {
          source: solo ? "solo" : "flex",
          tier: selected.tier,
          rank: selected.rank,
          lp: selected.leaguePoints,
          wins: selected.wins,
          losses: selected.losses,
        }
      : {
          source: "unranked",
          tier: null,
          rank: null,
          lp: null,
          wins: null,
          losses: null,
        },
    masteries,
  };
}
