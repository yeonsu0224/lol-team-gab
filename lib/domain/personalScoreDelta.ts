/**
 * Percentage change of a player's personal score versus the previous round
 * (spec F-06 / D-11). Only the percentage is surfaced — never the raw score.
 * Returns `null` when the previous score is unavailable or non-positive.
 */
export function computePersonalScoreDelta(
  previousScore: number | null | undefined,
  currentScore: number,
): number | null {
  if (
    typeof previousScore !== "number" ||
    !Number.isFinite(previousScore) ||
    previousScore <= 0
  ) {
    return null;
  }
  return ((currentScore - previousScore) / previousScore) * 100;
}

export interface ScoreDeltaDisplay {
  direction: "up" | "down" | "flat";
  percentAbs: number;
}

export function formatScoreDelta(delta: number | null): ScoreDeltaDisplay | null {
  if (delta === null) {
    return null;
  }
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) {
    return { direction: "flat", percentAbs: 0 };
  }
  return {
    direction: rounded > 0 ? "up" : "down",
    percentAbs: Math.abs(rounded),
  };
}
