const DIVISION_LP = 100;

export function trialAdjustmentDivisions(
  actualShare: number,
  expectedShare: number,
): -2 | -1 | 0 | 1 | 2 {
  if (expectedShare <= 0 || !Number.isFinite(actualShare) || !Number.isFinite(expectedShare)) {
    return 0;
  }
  const ratio = actualShare / expectedShare;
  if (ratio >= 1.25) return 2;
  if (ratio >= 1.1) return 1;
  if (ratio <= 0.75) return -2;
  if (ratio <= 0.9) return -1;
  return 0;
}

export function adjustedTrialLp(
  previousLp: number,
  input:
    | { kind: "performance"; actualShare: number; expectedShare: number }
    | { kind: "winner-only"; won: boolean },
): number {
  const divisions =
    input.kind === "winner-only"
      ? input.won
        ? 0.5
        : -0.5
      : trialAdjustmentDivisions(input.actualShare, input.expectedShare);
  return Math.max(0, previousLp + divisions * DIVISION_LP);
}

export function applyTrialRound(previousLp: number, adjustedLp: number): number {
  return Math.max(0, Math.round(previousLp * 0.7 + adjustedLp * 0.3));
}

export function buildLpSnapshot(
  previous: Readonly<Record<string, number>>,
  adjusted: Readonly<Record<string, number>>,
): Record<string, number> {
  const snapshot: Record<string, number> = {};
  for (const [puuid, previousLp] of Object.entries(previous)) {
    snapshot[puuid] = applyTrialRound(previousLp, adjusted[puuid] ?? previousLp);
  }
  return snapshot;
}
