export function minMaxNormalize(values: ReadonlyArray<number | null | undefined>): Array<number | null> {
  const present = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (!present.length) return values.map(() => null);
  const min = Math.min(...present);
  const max = Math.max(...present);
  return values.map((value) => {
    if (value == null || !Number.isFinite(value)) return null;
    return min === max ? 0.5 : (value - min) / (max - min);
  });
}

export function normalizeAgainst(
  value: number | null | undefined,
  pool: ReadonlyArray<number | null | undefined>,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const present = pool.filter((item): item is number => item != null && Number.isFinite(item));
  if (!present.length) return null;
  const min = Math.min(...present);
  const max = Math.max(...present);
  return min === max ? 0.5 : (value - min) / (max - min);
}
