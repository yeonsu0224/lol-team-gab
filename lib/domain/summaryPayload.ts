import { SYNERGY_LABEL_KO } from "@/lib/constants/synergy";
import { resolvePreUnrated } from "@/lib/player/analysis";
import type {
  Participant,
  PerformanceGrade,
  RoundNumber,
  TeamProposal,
  TeamSide,
} from "@/lib/types";

export interface SummaryPlayer {
  riotId: string;
  team: TeamSide;
  honeyBeeBadge?: string;
  performanceGrade: PerformanceGrade | null;
  unrated: boolean;
  roundBelowExpect?: boolean;
}

export interface SummaryPayload {
  context: "team" | "trial" | "rebalance";
  teams: {
    blue: { averageTier: string; powerPct: number; synergy?: string };
    red: { averageTier: string; powerPct: number; synergy?: string };
  };
  changes?: Array<{
    outPuuid: string;
    inPuuid: string;
    toTeam: TeamSide;
    reason: string;
  }>;
  players?: SummaryPlayer[];
}

export interface AssistantResult {
  mode: "normal" | "friend";
  summary: string;
  bullets: string[];
}

function teamsBlock(proposal: TeamProposal) {
  return {
    blue: {
      averageTier: proposal.blueAvgTier.label,
      powerPct: proposal.bluePowerPct,
      synergy: SYNERGY_LABEL_KO[proposal.blueSynergy],
    },
    red: {
      averageTier: proposal.redAvgTier.label,
      powerPct: proposal.redPowerPct,
      synergy: SYNERGY_LABEL_KO[proposal.redSynergy],
    },
  };
}

function playersBlock(
  proposal: TeamProposal,
  lastRound: RoundNumber | null,
): SummaryPlayer[] {
  const build = (member: Participant, team: TeamSide): SummaryPlayer => {
    if (lastRound === null) {
      // Pre-game: no round performance yet; only flag unrated for exclusion.
      return {
        riotId: member.riotId,
        team,
        performanceGrade: null,
        unrated: resolvePreUnrated(member).unrated,
      };
    }
    const perf = member.trialPerformanceByRound?.[lastRound];
    return {
      riotId: member.riotId,
      team,
      honeyBeeBadge: member.honeyBeeBadge,
      performanceGrade: perf?.performanceGrade ?? null,
      unrated: perf?.unrated ?? true,
      roundBelowExpect: perf?.roundBelowExpect ?? false,
    };
  };

  return [
    ...proposal.blueTeam.map((member) => build(member, "blue")),
    ...proposal.redTeam.map((member) => build(member, "red")),
  ];
}

/** Team-proposal (pre-game) summary payload (spec F-08). */
export function buildTeamSummaryPayload(proposal: TeamProposal): SummaryPayload {
  return {
    context: "team",
    teams: teamsBlock(proposal),
    players: playersBlock(proposal, null),
  };
}

/**
 * Rebalance/trial summary payload for the round just played (spec F-08).
 * Unrated players are filtered server-side; grades/honeybee drive highlights.
 */
export function buildRebalanceSummaryPayload(
  proposal: TeamProposal,
  lastRound: RoundNumber,
): SummaryPayload {
  return {
    context: "rebalance",
    teams: teamsBlock(proposal),
    changes: proposal.changes,
    players: playersBlock(proposal, lastRound),
  };
}
