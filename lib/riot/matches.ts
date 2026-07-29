import "server-only";

import type { MainRole } from "@/lib/types";

import { encodeRiotPath, riotFetch } from "./http";
import type {
  MatchParticipantSummary,
  RiotMatch,
  RiotMatchParticipant,
} from "./types";

const MAIN_ROLES: MainRole[] = [
  "TOP",
  "JUNGLE",
  "MIDDLE",
  "BOTTOM",
  "UTILITY",
];

function asMainRole(value: string): MainRole | null {
  return MAIN_ROLES.includes(value as MainRole) ? (value as MainRole) : null;
}

function summarizeParticipant(
  participant: RiotMatchParticipant,
): MatchParticipantSummary {
  const role =
    asMainRole(participant.teamPosition) ??
    asMainRole(participant.individualPosition);

  return {
    puuid: participant.puuid,
    riotId:
      participant.riotIdGameName && participant.riotIdTagline
        ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
        : null,
    team: participant.teamId === 100 ? "blue" : "red",
    win: participant.win,
    championId: participant.championId,
    championName: participant.championName,
    role,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    kda:
      (participant.kills + participant.assists) /
      Math.max(1, participant.deaths),
    damageDealt: participant.totalDamageDealtToChampions,
    cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    visionScore: participant.visionScore,
  };
}

export async function getMatch(matchId: string) {
  const match = await riotFetch<RiotMatch>(
    "asia",
    `/lol/match/v5/matches/${encodeRiotPath(matchId)}`,
  );

  return {
    matchId: match.metadata.matchId,
    gameCreation: match.info.gameCreation,
    gameDuration: match.info.gameDuration,
    gameMode: match.info.gameMode,
    queueId: match.info.queueId,
    participants: match.info.participants.map(summarizeParticipant),
  };
}

async function getRankedMatchIds(puuid: string): Promise<string[]> {
  const encodedPuuid = encodeRiotPath(puuid);
  const soloIds = await riotFetch<string[]>(
    "asia",
    `/lol/match/v5/matches/by-puuid/${encodedPuuid}/ids?queue=420&start=0&count=20`,
  );

  if (soloIds.length >= 20) {
    return soloIds;
  }

  const flexIds = await riotFetch<string[]>(
    "asia",
    `/lol/match/v5/matches/by-puuid/${encodedPuuid}/ids?queue=440&start=0&count=${20 - soloIds.length}`,
  );
  return [...soloIds, ...flexIds];
}

export async function getRecentMatches(puuid: string) {
  const matchIds = await getRankedMatchIds(puuid);
  const matches = [];

  for (const matchId of matchIds) {
    matches.push(await getMatch(matchId));
  }

  const playerMatches = matches.flatMap((match) => {
    const participant = match.participants.find(
      (candidate) => candidate.puuid === puuid,
    );
    return participant ? [{ matchId: match.matchId, ...participant }] : [];
  });

  const roleCounts = new Map<MainRole, number>();
  for (const match of playerMatches) {
    if (match.role) {
      roleCounts.set(match.role, (roleCounts.get(match.role) ?? 0) + 1);
    }
  }

  const mainRole =
    [...roleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mainRoleMatches = mainRole
    ? playerMatches.filter((match) => match.role === mainRole)
    : [];
  const average = (
    values: number[],
  ): number | null =>
    values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  return {
    matches: playerMatches,
    totalGames: playerMatches.length,
    wins: playerMatches.filter((match) => match.win).length,
    mainRole,
    preMainRoleGames: mainRole ? mainRoleMatches.length : null,
    preMainRoleKda: average(mainRoleMatches.map((match) => match.kda)),
    preMainRoleDamage: average(
      mainRoleMatches.map((match) => match.damageDealt),
    ),
  };
}
