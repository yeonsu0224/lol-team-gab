import { platformRequest, regionalRequest } from "./http";
import type {
  RiotAccount,
  RiotLeagueEntry,
  RiotMastery,
  RiotMatch,
  RiotSummoner,
} from "./types";

export function getAccount(gameName: string, tagLine: string) {
  return regionalRequest<RiotAccount>(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  );
}

export async function getPlayer(puuid: string) {
  const summoner = await platformRequest<RiotSummoner>(
    `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
  );
  const [entries, masteries] = await Promise.all([
    platformRequest<RiotLeagueEntry[]>(
      `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
    ),
    platformRequest<RiotMastery[]>(
      `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}/top?count=5`,
    ).catch(() => []),
  ]);
  return { summoner, entries, masteries };
}

export function getMatchIds(puuid: string, count = 20) {
  return regionalRequest<string[]>(
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${Math.min(20, count)}`,
  );
}

export function getMatch(id: string) {
  return regionalRequest<RiotMatch>(`/lol/match/v5/matches/${encodeURIComponent(id)}`);
}
