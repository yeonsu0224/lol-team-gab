export type InternalTierBadge = "OP" | 1 | 2 | 3 | 4;

export interface BadgeInput {
  puuid: string;
  personalScore: number;
  isOp?: boolean;
}

export function assignInternalTierBadges(
  players: ReadonlyArray<BadgeInput>,
): Record<string, InternalTierBadge> {
  if (!players.length) return {};
  const mean = players.reduce((sum, player) => sum + player.personalScore, 0) / players.length;
  const opIds = new Set(
    players
      .filter((player) => player.isOp ?? player.personalScore >= mean * 1.25)
      .map(({ puuid }) => puuid),
  );
  const ranked = players
    .filter(({ puuid }) => !opIds.has(puuid))
    .sort((a, b) => b.personalScore - a.personalScore || a.puuid.localeCompare(b.puuid));

  const result: Record<string, InternalTierBadge> = {};
  for (const id of opIds) result[id] = "OP";
  ranked.forEach(({ puuid }, index) => {
    result[puuid] = Math.min(4, Math.floor((index * 4) / ranked.length) + 1) as 1 | 2 | 3 | 4;
  });
  return result;
}
