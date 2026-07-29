export interface BalancePlayer {
  id: string;
  score: number;
}

export interface RivalPair {
  high: BalancePlayer;
  low: BalancePlayer;
}

export interface TeamBalanceResult {
  blue: BalancePlayer[];
  red: BalancePlayer[];
  blueSum: number;
  redSum: number;
  ideal: number;
  scoreDiff: number;
  rivalPairs: RivalPair[];
  rivalsSplit: number;
}

export const SUPPORTED_TEAM_SIZES = [8, 10] as const;

export function isSupportedTeamCount(count: number): boolean {
  return (SUPPORTED_TEAM_SIZES as readonly number[]).includes(count);
}

/** Sort ascending by score and pair adjacent players (spec D-06 Step 1). */
export function buildRivalPairs(players: BalancePlayer[]): RivalPair[] {
  const sorted = [...players].sort((a, b) => a.score - b.score);
  const pairs: RivalPair[] = [];
  for (let index = 0; index < sorted.length; index += 2) {
    const first = sorted[index];
    const second = sorted[index + 1];
    const [high, low] =
      first.score >= second.score ? [first, second] : [second, first];
    pairs.push({ high, low });
  }
  return pairs;
}

/**
 * Exhaustive 2^k assignment (spec D-06 Step 2). For each rival pair, the high
 * player goes to blue or red; the low takes the other side. Best split
 * minimizes |blue − red|, then proximity to the ideal, then rival separation.
 */
export function balanceTeams(players: BalancePlayer[]): TeamBalanceResult {
  if (!isSupportedTeamCount(players.length)) {
    throw new Error(
      `Team balancing supports ${SUPPORTED_TEAM_SIZES.join("/")} players, received ${players.length}`,
    );
  }

  const pairs = buildRivalPairs(players);
  const totalScore = players.reduce((sum, player) => sum + player.score, 0);
  const ideal = totalScore / 2;
  const pairCount = pairs.length;

  let best: TeamBalanceResult | null = null;

  for (let mask = 0; mask < 1 << pairCount; mask += 1) {
    const blue: BalancePlayer[] = [];
    const red: BalancePlayer[] = [];

    for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
      const { high, low } = pairs[pairIndex];
      const highToBlue = (mask & (1 << pairIndex)) !== 0;
      if (highToBlue) {
        blue.push(high);
        red.push(low);
      } else {
        red.push(high);
        blue.push(low);
      }
    }

    const blueSum = blue.reduce((sum, player) => sum + player.score, 0);
    const redSum = red.reduce((sum, player) => sum + player.score, 0);
    const scoreDiff = Math.abs(blueSum - redSum);
    // Rivals are always on opposite teams in this construction, so this is the
    // full pair count; kept for parity with the spec's tie-break definition.
    const rivalsSplit = pairCount;

    const candidate: TeamBalanceResult = {
      blue,
      red,
      blueSum,
      redSum,
      ideal,
      scoreDiff,
      rivalPairs: pairs,
      rivalsSplit,
    };

    if (best === null || isBetter(candidate, best)) {
      best = candidate;
    }
  }

  return best as TeamBalanceResult;
}

function isBetter(
  candidate: TeamBalanceResult,
  current: TeamBalanceResult,
): boolean {
  if (candidate.scoreDiff !== current.scoreDiff) {
    return candidate.scoreDiff < current.scoreDiff;
  }
  const candidateIdealGap = Math.abs(candidate.blueSum - candidate.ideal);
  const currentIdealGap = Math.abs(current.blueSum - current.ideal);
  if (candidateIdealGap !== currentIdealGap) {
    return candidateIdealGap < currentIdealGap;
  }
  return candidate.rivalsSplit > current.rivalsSplit;
}
