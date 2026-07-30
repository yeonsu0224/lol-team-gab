export interface BalancePlayer {
  puuid: string;
  personalScore: number;
}

export interface BalancedTeams<T extends BalancePlayer> {
  blueTeam: T[];
  redTeam: T[];
  blueScore: number;
  redScore: number;
  idealScore: number;
  scoreDifference: number;
  rivalPairs: Array<[string, string]>;
  targetRound?: 2 | 3 | 4;
}

export function balanceTeams<T extends BalancePlayer>(
  players: ReadonlyArray<T>,
  targetRound?: 2 | 3 | 4,
): BalancedTeams<T> {
  if (players.length !== 8 && players.length !== 10) {
    throw new Error("팀 배정은 8명 또는 10명일 때만 가능합니다.");
  }
  const sorted = [...players].sort(
    (a, b) => a.personalScore - b.personalScore || a.puuid.localeCompare(b.puuid),
  );
  const pairs = Array.from({ length: sorted.length / 2 }, (_, index) => {
    const low = sorted[index * 2];
    const high = sorted[index * 2 + 1];
    return { low, high };
  });
  const total = sorted.reduce((sum, player) => sum + player.personalScore, 0);
  const idealScore = total / 2;

  let best:
    | { blueTeam: T[]; redTeam: T[]; blueScore: number; redScore: number; mask: number }
    | undefined;
  for (let mask = 0; mask < 2 ** pairs.length; mask += 1) {
    const blueTeam: T[] = [];
    const redTeam: T[] = [];
    pairs.forEach(({ high, low }, index) => {
      const highToBlue = (mask & (1 << index)) === 0;
      blueTeam.push(highToBlue ? high : low);
      redTeam.push(highToBlue ? low : high);
    });
    const blueScore = sumScores(blueTeam);
    const redScore = total - blueScore;
    const candidate = { blueTeam, redTeam, blueScore, redScore, mask };
    if (!best || compareCandidate(candidate, best, idealScore) < 0) best = candidate;
  }

  if (!best) throw new Error("팀 배정 결과를 만들지 못했습니다.");
  return {
    ...best,
    idealScore,
    scoreDifference: Math.abs(best.blueScore - best.redScore),
    rivalPairs: pairs.map(({ high, low }) => [high.puuid, low.puuid]),
    targetRound,
  };
}

function sumScores(players: ReadonlyArray<BalancePlayer>): number {
  return players.reduce((sum, player) => sum + player.personalScore, 0);
}

function compareCandidate(
  left: { blueScore: number; redScore: number; mask: number },
  right: { blueScore: number; redScore: number; mask: number },
  ideal: number,
): number {
  const difference =
    Math.abs(left.blueScore - left.redScore) - Math.abs(right.blueScore - right.redScore);
  if (Math.abs(difference) > Number.EPSILON) return difference;
  const idealDistance = Math.abs(left.blueScore - ideal) - Math.abs(right.blueScore - ideal);
  if (Math.abs(idealDistance) > Number.EPSILON) return idealDistance;
  return left.mask - right.mask;
}
