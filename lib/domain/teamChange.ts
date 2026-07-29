import type { TeamChange } from "@/lib/types";

export interface TeamSnapshot {
  bluePuuids: string[];
  redPuuids: string[];
}

export interface TeamChangeResult {
  changes: TeamChange[];
  changedPuuids: Set<string>;
}

export type TradeReasonBuilder = (trade: {
  outPuuid: string;
  inPuuid: string;
  toTeam: "blue" | "red";
}) => string;

const DEFAULT_REASON: TradeReasonBuilder = () => "전력 균형을 맞추기 위한 트레이드";

/**
 * Diffs the previous round's teams against a new proposal and expresses the
 * moves as A↔G trades (spec F-06). Each swap is emitted once from the blue
 * team's perspective; `changedPuuids` flags everyone who moved for highlighting.
 */
export function computeTeamChanges(
  previous: TeamSnapshot,
  proposed: TeamSnapshot,
  reasonFor: TradeReasonBuilder = DEFAULT_REASON,
): TeamChangeResult {
  const proposedBlue = new Set(proposed.bluePuuids);
  const proposedRed = new Set(proposed.redPuuids);

  const leftBlue = previous.bluePuuids.filter((puuid) =>
    proposedRed.has(puuid),
  );
  const leftRed = previous.redPuuids.filter((puuid) =>
    proposedBlue.has(puuid),
  );

  const changedPuuids = new Set<string>([...leftBlue, ...leftRed]);
  const changes: TeamChange[] = [];
  const swaps = Math.min(leftBlue.length, leftRed.length);

  for (let index = 0; index < swaps; index += 1) {
    const outPuuid = leftBlue[index];
    const inPuuid = leftRed[index];
    changes.push({
      outPuuid,
      inPuuid,
      toTeam: "blue",
      reason: reasonFor({ outPuuid, inPuuid, toTeam: "blue" }),
    });
  }

  // Any unmatched moves (roster additions/removals) still surface as changes.
  for (let index = swaps; index < leftBlue.length; index += 1) {
    const outPuuid = leftBlue[index];
    changes.push({
      outPuuid,
      inPuuid: outPuuid,
      toTeam: "red",
      reason: reasonFor({ outPuuid, inPuuid: outPuuid, toTeam: "red" }),
    });
  }
  for (let index = swaps; index < leftRed.length; index += 1) {
    const inPuuid = leftRed[index];
    changes.push({
      outPuuid: inPuuid,
      inPuuid,
      toTeam: "blue",
      reason: reasonFor({ outPuuid: inPuuid, inPuuid, toTeam: "blue" }),
    });
  }

  return { changes, changedPuuids };
}
