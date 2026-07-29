import {
  lpDivisionsBetween,
  lpValueToTierDisplay,
} from "@/lib/constants/lpTable";
import type {
  Participant,
  TargetRound,
  TeamProposal,
} from "@/lib/types";

import { balanceTeams } from "./teamBalance";
import { computePowerRatio } from "./powerRatio";
import { computeSynergy, type SynergyMember } from "./synergy";
import { computeTeamChanges, type TeamSnapshot } from "./teamChange";

function averageLpValue(team: Participant[]): number {
  if (team.length === 0) {
    return 0;
  }
  const sum = team.reduce(
    (total, participant) => total + participant.currentLpValue,
    0,
  );
  return sum / team.length;
}

function scoreSum(team: Participant[]): number {
  return team.reduce((total, participant) => total + participant.personalScore, 0);
}

function toSynergyMembers(team: Participant[]): SynergyMember[] {
  return team.map((participant) => ({
    mainRole: participant.synergyFactors.mainRole,
    topChampions: participant.synergyFactors.topChampions,
  }));
}

/**
 * Recomputes the display metrics (avg tier, power ratio, synergy, tier diff)
 * for a fixed pair of teams. Used after manual swaps — membership is preserved,
 * only the summary numbers refresh (spec F-04, D-12).
 */
export function proposalFromTeams(
  blueTeam: Participant[],
  redTeam: Participant[],
  type: "pre" | "rebalance" = "pre",
): TeamProposal {
  const blueAvg = averageLpValue(blueTeam);
  const redAvg = averageLpValue(redTeam);
  const { bluePowerPct, redPowerPct } = computePowerRatio(
    scoreSum(blueTeam),
    scoreSum(redTeam),
  );

  return {
    type,
    blueTeam,
    redTeam,
    blueAvgTier: lpValueToTierDisplay(blueAvg),
    redAvgTier: lpValueToTierDisplay(redAvg),
    tierDiffDivisions: lpDivisionsBetween(blueAvg, redAvg),
    bluePowerPct,
    redPowerPct,
    blueSynergy: computeSynergy(toSynergyMembers(blueTeam)).grade,
    redSynergy: computeSynergy(toSynergyMembers(redTeam)).grade,
  };
}

/**
 * Builds the pre-game team proposal from participants (spec F-04 + D-06).
 * Balancing uses personalScore; the proposal is a suggestion, not enforced.
 */
export function buildPreTeamProposal(
  participants: Participant[],
): TeamProposal {
  const byPuuid = new Map(
    participants.map((participant) => [participant.puuid, participant]),
  );
  const result = balanceTeams(
    participants.map((participant) => ({
      id: participant.puuid,
      score: participant.personalScore,
    })),
  );

  const resolve = (id: string): Participant => {
    const participant = byPuuid.get(id);
    if (!participant) {
      throw new Error(`Participant not found for balancing id: ${id}`);
    }
    return participant;
  };

  const blueTeam = result.blue.map((player) => resolve(player.id));
  const redTeam = result.red.map((player) => resolve(player.id));

  return proposalFromTeams(blueTeam, redTeam, "pre");
}

/**
 * Builds a rebalance proposal for the next round (spec F-06). Balancing uses
 * the accumulated-LP-driven personalScore, then diffs against the previous
 * round's teams to surface A↔G trades and highlight moved players.
 */
export function buildRebalanceProposal(
  participants: Participant[],
  targetRound: TargetRound,
  previous: TeamSnapshot,
): TeamProposal {
  const base = buildPreTeamProposal(participants);
  const proposed: TeamSnapshot = {
    bluePuuids: base.blueTeam.map((participant) => participant.puuid),
    redPuuids: base.redTeam.map((participant) => participant.puuid),
  };
  const { changes } = computeTeamChanges(previous, proposed);

  return {
    ...base,
    type: "rebalance",
    targetRound,
    changes,
  };
}

/** Swaps one blue and one red member, preserving team sizes. */
export function swapMembers(
  proposal: TeamProposal,
  bluePuuid: string,
  redPuuid: string,
): TeamProposal {
  const blueTeam = proposal.blueTeam.map((participant) =>
    participant.puuid === bluePuuid
      ? proposal.redTeam.find((member) => member.puuid === redPuuid) ??
        participant
      : participant,
  );
  const redTeam = proposal.redTeam.map((participant) =>
    participant.puuid === redPuuid
      ? proposal.blueTeam.find((member) => member.puuid === bluePuuid) ??
        participant
      : participant,
  );
  return proposalFromTeams(blueTeam, redTeam, proposal.type);
}
