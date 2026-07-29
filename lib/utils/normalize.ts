/**
 * Min-max normalization that skips null/undefined/NaN values.
 * Missing entries are excluded from the pool and returned as `null`
 * (never coerced to 0 — see spec D-06/D-07).
 */
export function minMaxNormalize(
  values: Array<number | null | undefined>,
): Array<number | null> {
  const pool = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  if (pool.length === 0) {
    return values.map(() => null);
  }

  const min = Math.min(...pool);
  const max = Math.max(...pool);

  return values.map((value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }
    if (min === max) {
      return 0.5;
    }
    return (value - min) / (max - min);
  });
}

/** Normalizes a single value against a known min/max, skipping missing input. */
export function normalizeAgainst(
  value: number | null | undefined,
  min: number,
  max: number,
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  if (min === max) {
    return 0.5;
  }
  return (value - min) / (max - min);
}

export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
