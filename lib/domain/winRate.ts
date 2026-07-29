const PRIOR_GAMES = 20;
const PRIOR_WIN_RATE = 0.5;

/**
 * Confidence-adjusted win rate (F-03).
 * `(wins + 20 × 0.5) / (games + 20)` — few games stay near 0.5.
 */
export function adjustedWinRate(wins: number, games: number): number {
  const safeWins = Math.max(0, wins);
  const safeGames = Math.max(0, games);
  return (
    (safeWins + PRIOR_GAMES * PRIOR_WIN_RATE) / (safeGames + PRIOR_GAMES)
  );
}
