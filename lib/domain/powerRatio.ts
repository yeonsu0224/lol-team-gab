export interface PowerRatio {
  bluePowerPct: number;
  redPowerPct: number;
}

export function calculatePowerRatio(bluePower: number, redPower: number): PowerRatio {
  const blue = Math.max(0, bluePower);
  const red = Math.max(0, redPower);
  const total = blue + red;
  if (total === 0) return { bluePowerPct: 50, redPowerPct: 50 };
  const bluePowerPct = Math.round((blue / total) * 100);
  return { bluePowerPct, redPowerPct: 100 - bluePowerPct };
}

export function calculateTeamPowerRatio<T>(
  blueTeam: ReadonlyArray<T>,
  redTeam: ReadonlyArray<T>,
  score: (player: T) => number,
): PowerRatio {
  return calculatePowerRatio(
    blueTeam.reduce((sum, player) => sum + score(player), 0),
    redTeam.reduce((sum, player) => sum + score(player), 0),
  );
}
