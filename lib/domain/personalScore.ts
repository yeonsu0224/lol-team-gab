import { normalizeAgainst } from "../utils/normalize.ts";

export interface PersonalScoreInput {
  puuid: string;
  preLpValue: number;
  currentLpValue?: number;
  mainRoleKda?: number | null;
  adjustedWinRate: number;
}

export interface PersonalScoreResult {
  puuid: string;
  personalScore: number;
  isOp: boolean;
}

export function calculatePersonalScores(
  players: ReadonlyArray<PersonalScoreInput>,
  useCurrentLp = false,
): PersonalScoreResult[] {
  if (!players.length) return [];
  const firstPass = scoreWithPool(players, players, useCurrentLp);
  const mean = firstPass.reduce((sum, item) => sum + item.score, 0) / firstPass.length;
  const opIds = new Set(
    firstPass.filter(({ score }) => score >= mean * 1.25).map(({ player }) => player.puuid),
  );
  const nonOpPool = players.filter(({ puuid }) => !opIds.has(puuid));
  const normalizationPool = nonOpPool.length ? nonOpPool : players;
  return scoreWithPool(players, normalizationPool, useCurrentLp).map(({ player, score }) => ({
    puuid: player.puuid,
    personalScore: score,
    isOp: opIds.has(player.puuid),
  }));
}

function scoreWithPool(
  players: ReadonlyArray<PersonalScoreInput>,
  pool: ReadonlyArray<PersonalScoreInput>,
  useCurrentLp: boolean,
) {
  const lpPool = pool.map((player) => lpOf(player, useCurrentLp));
  const kdaPool = pool.map(({ mainRoleKda }) => mainRoleKda);
  return players.map((player) => {
    const normalizedLp = normalizeAgainst(lpOf(player, useCurrentLp), lpPool) ?? 0.5;
    const normalizedKda = normalizeAgainst(player.mainRoleKda, kdaPool) ?? 0.5;
    const winRate = Math.min(1, Math.max(0, player.adjustedWinRate));
    return {
      player,
      score: normalizedLp * 0.7 + normalizedKda * 0.2 + winRate * 0.1,
    };
  });
}

function lpOf(player: PersonalScoreInput, useCurrentLp: boolean): number {
  return useCurrentLp && player.currentLpValue != null
    ? player.currentLpValue
    : player.preLpValue;
}
