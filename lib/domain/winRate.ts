const PRIOR_GAMES = 20;
const PRIOR_WIN_RATE = 0.5;

export function adjustedWinRate(wins: number, games: number): number {
  const safeGames = Math.max(0, games);
  const safeWins = Math.min(Math.max(0, wins), safeGames);
  return (safeWins + PRIOR_GAMES * PRIOR_WIN_RATE) / (safeGames + PRIOR_GAMES);
}
