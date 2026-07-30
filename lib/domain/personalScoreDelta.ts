export function calculatePersonalScoreDelta(previous: number, current: number): number {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return 0;
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export function calculateScoreDeltas(
  previous: Readonly<Record<string, number>>,
  current: Readonly<Record<string, number>>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(current).map(([puuid, score]) => [
      puuid,
      calculatePersonalScoreDelta(previous[puuid] ?? score, score),
    ]),
  );
}
