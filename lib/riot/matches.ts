import "server-only";

import type { MainRole } from "@/lib/types";
import { encodePath, regionalRequest } from "./api";
import type { RiotMatch, RiotMatchParticipant } from "./types";

const MATCH_LIMIT = 20;
const RANKED_SOLO_QUEUE = 420;
const RANKED_FLEX_QUEUE = 440;
const ROLES: MainRole[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export interface MatchSummary {
  matchId: string;
  gameCreation: number;
  queueId: number;
  win: boolean;
  role: MainRole | null;
  kda: number;
  damageDealt: number;
}

export interface MatchHistoryResponse {
  matches: MatchSummary[];
  hasHistory: boolean;
  mainRole: MainRole | null;
  preMainRoleGames: number;
  preMainRoleKda: number | null;
  preMainRoleDamage: number | null;
}

export async function getMatch(matchId: string): Promise<RiotMatch> {
  return regionalRequest<RiotMatch>(`/lol/match/v5/matches/${encodePath(matchId)}`);
}

export async function getMatchHistory(puuid: string): Promise<MatchHistoryResponse> {
  const soloIds = await getMatchIds(puuid, RANKED_SOLO_QUEUE, MATCH_LIMIT);
  const flexIds =
    soloIds.length < MATCH_LIMIT
      ? await getMatchIds(puuid, RANKED_FLEX_QUEUE, MATCH_LIMIT - soloIds.length)
      : [];
  const ids = [...new Set([...soloIds, ...flexIds])].slice(0, MATCH_LIMIT);

  const summaries: MatchSummary[] = [];
  for (const id of ids) {
    const match = await getMatch(id);
    const player = match.info.participants.find((entry) => entry.puuid === puuid);
    if (player) summaries.push(toSummary(match, player));
  }

  const mainRole = selectMainRole(summaries);
  const mainRoleMatches = mainRole ? summaries.filter(({ role }) => role === mainRole) : [];
  return {
    matches: summaries,
    hasHistory: summaries.length > 0,
    mainRole,
    preMainRoleGames: mainRoleMatches.length,
    preMainRoleKda: average(mainRoleMatches.map(({ kda }) => kda)),
    preMainRoleDamage: average(mainRoleMatches.map(({ damageDealt }) => damageDealt)),
  };
}

export async function getRecentMatches(puuid: string): Promise<MatchHistoryResponse> {
  const ids = await regionalRequest<string[]>(
    `/lol/match/v5/matches/by-puuid/${encodePath(puuid)}/ids?start=0&count=${MATCH_LIMIT}`,
  );
  const summaries: MatchSummary[] = [];
  for (const id of ids.slice(0, MATCH_LIMIT)) {
    const match = await getMatch(id);
    const player = match.info.participants.find((entry) => entry.puuid === puuid);
    if (player) summaries.push(toSummary(match, player));
  }
  const mainRole = selectMainRole(summaries);
  const mainRoleMatches = mainRole ? summaries.filter(({ role }) => role === mainRole) : [];
  return {
    matches: summaries,
    hasHistory: summaries.length > 0,
    mainRole,
    preMainRoleGames: mainRoleMatches.length,
    preMainRoleKda: average(mainRoleMatches.map(({ kda }) => kda)),
    preMainRoleDamage: average(mainRoleMatches.map(({ damageDealt }) => damageDealt)),
  };
}

async function getMatchIds(puuid: string, queue: number, count: number): Promise<string[]> {
  if (count <= 0) return [];
  return regionalRequest<string[]>(
    `/lol/match/v5/matches/by-puuid/${encodePath(puuid)}/ids?queue=${queue}&start=0&count=${count}`,
  );
}

function toSummary(match: RiotMatch, player: RiotMatchParticipant): MatchSummary {
  const deaths = Math.max(player.deaths, 1);
  return {
    matchId: match.metadata.matchId,
    gameCreation: match.info.gameCreation,
    queueId: match.info.queueId,
    win: player.win,
    role: ROLES.includes(player.teamPosition as MainRole)
      ? (player.teamPosition as MainRole)
      : null,
    kda: (player.kills + player.assists) / deaths,
    damageDealt: player.totalDamageDealtToChampions,
  };
}

function selectMainRole(matches: MatchSummary[]): MainRole | null {
  const counts = new Map<MainRole, number>();
  for (const { role } of matches) {
    if (role) counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  return (
    [...counts.entries()].sort(
      ([roleA, countA], [roleB, countB]) =>
        countB - countA || ROLES.indexOf(roleA) - ROLES.indexOf(roleB),
    )[0]?.[0] ?? null
  );
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
