import "server-only";

import { encodeRiotPath, riotFetch } from "./http";
import type {
  RiotChampionMastery,
  RiotLeagueEntry,
  RiotSummoner,
} from "./types";

export async function getPlayerProfile(puuid: string) {
  const encodedPuuid = encodeRiotPath(puuid);
  const [summoner, leagues, masteries] = await Promise.all([
    riotFetch<RiotSummoner>(
      "kr",
      `/lol/summoner/v4/summoners/by-puuid/${encodedPuuid}`,
    ),
    riotFetch<RiotLeagueEntry[]>(
      "kr",
      `/lol/league/v4/entries/by-puuid/${encodedPuuid}`,
    ),
    riotFetch<RiotChampionMastery[]>(
      "kr",
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodedPuuid}/top?count=3`,
    ),
  ]);

  const solo = leagues.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
  const flex = leagues.find((entry) => entry.queueType === "RANKED_FLEX_SR");
  const selected = solo ?? flex;
  const games = selected ? selected.wins + selected.losses : 0;

  return {
    puuid,
    profileIconId: summoner.profileIconId,
    summonerLevel: summoner.summonerLevel,
    rank: selected
      ? {
          tier: selected.tier,
          rank: selected.rank,
          lp: selected.leaguePoints,
          wins: selected.wins,
          losses: selected.losses,
          winRate: games > 0 ? selected.wins / games : null,
          source: solo ? ("solo" as const) : ("flex" as const),
        }
      : null,
    masteries: masteries.map((mastery) => ({
      championId: mastery.championId,
      championLevel: mastery.championLevel,
      championPoints: mastery.championPoints,
    })),
  };
}
