import { isPresent } from "@/lib/utils/normalize";

export const PRE_WEIGHT = 0.7;
export const TRIAL_WEIGHT = 0.3;
export const DIVISION_LP = 100;
export const MAX_DIVISION_SWING = 2;
export const TEAM_ONLY_SWING = 0.5;

/**
 * Maps a performance ratio (trialScore / expectScore) to an adjusted LP target
 * bounded to ±MAX_DIVISION_SWING divisions (spec D-02).
 */
export function adjustedLpFromPerformance(
  prevLp: number,
  ratio: number,
): number {
  const rawDivisions = (ratio - 1) * MAX_DIVISION_SWING;
  const divisions = Math.max(
    -MAX_DIVISION_SWING,
    Math.min(MAX_DIVISION_SWING, rawDivisions),
  );
  return prevLp + divisions * DIVISION_LP;
}

/** Win/loss-only adjustment: ±0.5 division at the team level (spec D-02). */
export function adjustedLpFromResult(prevLp: number, won: boolean): number {
  return prevLp + (won ? TEAM_ONLY_SWING : -TEAM_ONLY_SWING) * DIVISION_LP;
}

/** Blends the previous LP with the trial-adjusted LP at 70:30 (spec D-02). */
export function blendLp(prevLp: number, adjustedLp: number): number {
  return prevLp * PRE_WEIGHT + adjustedLp * TRIAL_WEIGHT;
}

export interface TrialRoundInput {
  prevLp: number;
  won: boolean;
  /** trialScore / expectScore for the round; null when unrated or stat-less. */
  performanceRatio: number | null;
  /** Whether individual KDA/damage stats are available this round. */
  hasStats: boolean;
}

/**
 * Accumulated LP after a trial round (spec D-02). Uses the individual
 * performance adjustment when stats are available, otherwise the team-only
 * win/loss swing, then blends 70:30 against the previous LP.
 */
export function applyTrialRound(input: TrialRoundInput): number {
  const adjustedLp =
    input.hasStats && isPresent(input.performanceRatio)
      ? adjustedLpFromPerformance(input.prevLp, input.performanceRatio)
      : adjustedLpFromResult(input.prevLp, input.won);

  return blendLp(input.prevLp, adjustedLp);
}
