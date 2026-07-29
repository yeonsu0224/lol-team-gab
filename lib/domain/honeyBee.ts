import type {
  HoneyBeeBadge,
  TierSource,
  UnratedReason,
} from "@/lib/types";
import { isPresent, minMaxNormalize } from "@/lib/utils/normalize";

export const MIN_SAMPLE_GAMES = 3;

export interface TrialStatInput {
  kda: number | null;
  damageDealt: number | null;
}

/**
 * Per-round trial score = normKda × 0.5 + normDamage × 0.5, normalized within
 * the round's participants (spec D-07). A player missing either stat (win/loss
 * only) yields `null`.
 */
export function computeTrialScores(
  stats: TrialStatInput[],
): Array<number | null> {
  const normKda = minMaxNormalize(stats.map((stat) => stat.kda));
  const normDamage = minMaxNormalize(stats.map((stat) => stat.damageDealt));

  return stats.map((_, index) => {
    const kda = normKda[index];
    const damage = normDamage[index];
    if (!isPresent(kda) || !isPresent(damage)) {
      return null;
    }
    return kda * 0.5 + damage * 0.5;
  });
}

export interface TierExpectInput {
  playerLp: number;
  teamKda: number | null;
  teamDamage: number | null;
}

/**
 * Tier-based expectation (기대치 B): the player's share of the team LP predicts
 * a share of the team's total KDA/damage. Returned on the same 0~1 scale as the
 * trial score by normalizing within the round.
 */
export function computeTierExpectScores(
  inputs: TierExpectInput[],
): Array<number | null> {
  const teamLpSum = inputs.reduce((sum, input) => sum + input.playerLp, 0);
  if (teamLpSum <= 0) {
    return inputs.map(() => null);
  }

  const expectedKda = inputs.map((input) =>
    isPresent(input.teamKda)
      ? (input.playerLp / teamLpSum) * input.teamKda
      : null,
  );
  const expectedDamage = inputs.map((input) =>
    isPresent(input.teamDamage)
      ? (input.playerLp / teamLpSum) * input.teamDamage
      : null,
  );

  const normKda = minMaxNormalize(expectedKda);
  const normDamage = minMaxNormalize(expectedDamage);

  return inputs.map((_, index) => {
    const kda = normKda[index];
    const damage = normDamage[index];
    if (!isPresent(kda) || !isPresent(damage)) {
      return null;
    }
    return kda * 0.5 + damage * 0.5;
  });
}

export interface UnratedInput {
  preMainRoleGames: number | null;
  preMainRoleKda: number | null;
  preMainRoleDamage: number | null;
  preStatScore: number | null;
  tierExpectScore: number | null;
  tierSource: TierSource;
}

export interface UnratedResult {
  unrated: boolean;
  reason?: UnratedReason;
}

/**
 * Determines whether a player's expectation is trustworthy (spec D-07).
 * Missing expectation is never coerced to 0 — it becomes `unrated`.
 */
export function resolveUnrated(input: UnratedInput): UnratedResult {
  if (input.tierSource === "manual" && !isPresent(input.preMainRoleKda)) {
    return { unrated: true, reason: "manual_tier" };
  }
  if (!isPresent(input.preMainRoleGames) || input.preMainRoleGames <= 0) {
    return { unrated: true, reason: "no_history" };
  }
  if (input.preMainRoleGames < MIN_SAMPLE_GAMES) {
    return { unrated: true, reason: "insufficient_sample" };
  }
  if (
    !isPresent(input.preMainRoleKda) ||
    !isPresent(input.preMainRoleDamage)
  ) {
    return { unrated: true, reason: "missing_stats" };
  }
  if (!isPresent(input.preStatScore) || !isPresent(input.tierExpectScore)) {
    return { unrated: true, reason: "missing_stats" };
  }
  return { unrated: false };
}

export interface RoundEvaluationInput {
  trialScore: number | null;
  preStatScore: number | null;
  tierExpectScore: number | null;
  unrated: boolean;
}

export interface RoundEvaluation {
  roundHoneyBee: boolean;
  roundBelowExpect: boolean;
}

/**
 * Honeybee (strictly above both expectations) and its symmetric below-expect
 * counterpart. Both require a rated player with a trial score (spec D-07).
 */
export function evaluateRound(input: RoundEvaluationInput): RoundEvaluation {
  if (
    input.unrated ||
    !isPresent(input.trialScore) ||
    !isPresent(input.preStatScore) ||
    !isPresent(input.tierExpectScore)
  ) {
    return { roundHoneyBee: false, roundBelowExpect: false };
  }

  const roundHoneyBee =
    input.trialScore > input.preStatScore &&
    input.trialScore > input.tierExpectScore;
  const roundBelowExpect =
    input.trialScore <= input.preStatScore &&
    input.trialScore <= input.tierExpectScore;

  return { roundHoneyBee, roundBelowExpect };
}

export interface StreakInput {
  unrated: boolean;
  hasStats: boolean;
  roundHoneyBee: boolean;
}

/**
 * Streak update rules (spec D-07):
 * - unrated → maintain (no increment/reset)
 * - win/loss only (no stats) → reset to 0
 * - honeybee → +1, otherwise (missed) → reset to 0
 */
export function updateStreak(
  previousStreak: number,
  input: StreakInput,
): number {
  if (input.unrated) {
    return previousStreak;
  }
  if (!input.hasStats) {
    return 0;
  }
  return input.roundHoneyBee ? previousStreak + 1 : 0;
}

export function streakToBadge(streak: number): HoneyBeeBadge {
  if (streak <= 0) return "none";
  if (streak === 1) return "bee";
  if (streak === 2) return "glitterBee";
  return "rainbowBee";
}
