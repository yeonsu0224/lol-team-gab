export interface PowerRatio {
  bluePowerPct: number;
  redPowerPct: number;
}

/**
 * Normalizes two team power sums to percentages that add up to 100 (spec D-12).
 * Rounding is corrected so blue + red === 100. Display only.
 */
export function computePowerRatio(
  blueSum: number,
  redSum: number,
): PowerRatio {
  const total = blueSum + redSum;
  if (total <= 0) {
    return { bluePowerPct: 50, redPowerPct: 50 };
  }

  const bluePowerPct = Math.round((blueSum / total) * 100);
  return {
    bluePowerPct,
    redPowerPct: 100 - bluePowerPct,
  };
}
