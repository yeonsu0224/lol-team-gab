import { tierToLpValue } from "@/lib/domain/lp";
import type { MainRole } from "@/lib/types";
import type { RiotLeagueEntry, RiotMastery, RiotMatch, RiotSummoner } from "@/lib/riot/types";

export interface PlayerSummary {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  rank: null | {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    lpValue: number;
    source: "solo" | "flex";
  };
  masteries: RiotMastery[];
  mainRole?: MainRole;
  preMainRoleGames?: number;
  preMainRoleKda?: number | null;
  preMainRoleDamage?: number | null;
  recentStats: {
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
  };
}

export function buildPlayerSummary(
  puuid: string,
  summoner: RiotSummoner,
  entries: RiotLeagueEntry[],
  masteries: RiotMastery[],
  matches: Array<RiotMatch | null>,
): PlayerSummary {
  const rows = matches
    .filter((match): match is RiotMatch => match !== null)
    .map((match) => match.info.participants.find((item) => item.puuid === puuid))
    .filter((row): row is NonNullable<typeof row> => row !== undefined);
  const roles = rows.map(({ teamPosition }) => roleOf(teamPosition)).filter((role): role is MainRole => role !== undefined);
  const mainRole = mostCommon(roles);
  const mainRows = mainRole ? rows.filter(({ teamPosition }) => roleOf(teamPosition) === mainRole) : rows;
  const solo = entries.find(({ queueType }) => queueType === "RANKED_SOLO_5x5");
  const flex = entries.find(({ queueType }) => queueType === "RANKED_FLEX_SR");
  const rank = solo ?? flex;
  return {
    puuid,
    profileIconId: summoner.profileIconId,
    summonerLevel: summoner.summonerLevel,
    rank: rank
      ? {
          tier: rank.tier,
          rank: rank.rank,
          lp: rank.leaguePoints,
          wins: rank.wins,
          losses: rank.losses,
          lpValue: tierToLpValue(rank.tier, rank.rank, rank.leaguePoints),
          source: solo ? "solo" : "flex",
        }
      : null,
    masteries,
    mainRole,
    preMainRoleGames: mainRows.length,
    preMainRoleKda: mainRows.length
      ? average(mainRows.map(({ kills, deaths, assists }) => (kills + assists) / Math.max(1, deaths)))
      : null,
    preMainRoleDamage: mainRows.length
      ? average(mainRows.map(({ totalDamageDealtToChampions }) => totalDamageDealtToChampions))
      : null,
    recentStats: {
      games: rows.length,
      wins: rows.filter(({ win }) => win).length,
      kills: sum(rows.map(({ kills }) => kills)),
      deaths: sum(rows.map(({ deaths }) => deaths)),
      assists: sum(rows.map(({ assists }) => assists)),
      damageDealt: sum(rows.map(({ totalDamageDealtToChampions }) => totalDamageDealtToChampions)),
    },
  };
}

function roleOf(value?: string): MainRole | undefined {
  const normalized = value === "MIDDLE" ? "MIDDLE" : value === "BOTTOM" ? "BOTTOM" : value;
  return ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"].includes(normalized ?? "")
    ? (normalized as MainRole)
    : undefined;
}

function mostCommon(values: MainRole[]): MainRole | undefined {
  return [...values].sort(
    (a, b) => values.filter((item) => item === b).length - values.filter((item) => item === a).length,
  )[0];
}

function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
