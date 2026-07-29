import { isPresent, minMaxNormalize, normalizeAgainst } from "@/lib/utils/normalize";

export const SCORE_WEIGHTS = {
  lp: 0.7,
  kda: 0.2,
  winRate: 0.1,
} as const;

export const OP_THRESHOLD_MULTIPLIER = 1.25;

export interface PersonalScoreInput {
  lpValue: number;
  mainRoleKda: number | null;
  adjustedWinRate: number;
}

export interface PersonalScoreResult {
  scores: number[];
  opFlags: boolean[];
  sessionMean: number;
}

/**
 * Combines normalized components, reweighting across only the present terms
 * so that a missing KDA does not silently count as zero (spec D-06/D-07).
 */
function weightedScore(
  normLp: number | null,
  normKda: number | null,
  winRate: number | null,
): number {
  const terms: Array<[number, number]> = [];
  if (isPresent(normLp)) terms.push([normLp, SCORE_WEIGHTS.lp]);
  if (isPresent(normKda)) terms.push([normKda, SCORE_WEIGHTS.kda]);
  if (isPresent(winRate)) terms.push([winRate, SCORE_WEIGHTS.winRate]);

  if (terms.length === 0) {
    return 0;
  }

  const weightSum = terms.reduce((sum, [, weight]) => sum + weight, 0);
  return terms.reduce((sum, [value, weight]) => sum + value * weight, 0) / weightSum;
}

function minMaxOf(values: number[]): { min: number; max: number } {
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Two-pass personal score (spec D-06):
 * 1. score everyone, 2. flag OP (≥ mean × 1.25),
 * 3. renormalize against the non-OP pool for the final balancing score.
 */
export function computePersonalScores(
  inputs: PersonalScoreInput[],
): PersonalScoreResult {
  if (inputs.length === 0) {
    return { scores: [], opFlags: [], sessionMean: 0 };
  }

  const normLpAll = minMaxNormalize(inputs.map((input) => input.lpValue));
  const normKdaAll = minMaxNormalize(inputs.map((input) => input.mainRoleKda));
  const firstPass = inputs.map((input, index) =>
    weightedScore(normLpAll[index], normKdaAll[index], input.adjustedWinRate),
  );

  const mean = firstPass.reduce((sum, value) => sum + value, 0) / firstPass.length;
  const opFlags = firstPass.map(
    (score) => score >= mean * OP_THRESHOLD_MULTIPLIER,
  );

  const nonOpIndexes = inputs
    .map((_, index) => index)
    .filter((index) => !opFlags[index]);
  const pool = nonOpIndexes.length > 0 ? nonOpIndexes : inputs.map((_, i) => i);

  const lpPool = minMaxOf(pool.map((index) => inputs[index].lpValue));
  const kdaValues = pool
    .map((index) => inputs[index].mainRoleKda)
    .filter((value): value is number => isPresent(value));
  const kdaPool = kdaValues.length > 0 ? minMaxOf(kdaValues) : null;

  const scores = inputs.map((input) => {
    const normLp = normalizeAgainst(input.lpValue, lpPool.min, lpPool.max);
    const normKda = kdaPool
      ? normalizeAgainst(input.mainRoleKda, kdaPool.min, kdaPool.max)
      : null;
    return weightedScore(normLp, normKda, input.adjustedWinRate);
  });

  return { scores, opFlags, sessionMean: mean };
}
