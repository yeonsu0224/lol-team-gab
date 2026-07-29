import { MIN_SAMPLE_GAMES } from "@/lib/domain/honeyBee";
import { computeBadges } from "@/lib/domain/badges";
import {
  computePersonalScores,
  type PersonalScoreInput,
} from "@/lib/domain/personalScore";
import { adjustedWinRate } from "@/lib/domain/winRate";
import { isPresent } from "@/lib/utils/normalize";
import type { Participant, UnratedReason } from "@/lib/types";

export interface PreUnrated {
  unrated: boolean;
  reason?: UnratedReason;
}

/**
 * Registration-time preview of the unrated flag (spec D-07). Uses only pre-game
 * signals; the binding decision still happens per trial round (F-05). Missing
 * expectation is never coerced to 0.
 */
export function resolvePreUnrated(participant: Participant): PreUnrated {
  const { riotData, tierSource } = participant;
  if (tierSource === "manual" && !isPresent(riotData.preMainRoleKda)) {
    return { unrated: true, reason: "manual_tier" };
  }
  if (!isPresent(riotData.preMainRoleGames) || riotData.preMainRoleGames <= 0) {
    return { unrated: true, reason: "no_history" };
  }
  if (riotData.preMainRoleGames < MIN_SAMPLE_GAMES) {
    return { unrated: true, reason: "insufficient_sample" };
  }
  if (
    !isPresent(riotData.preMainRoleKda) ||
    !isPresent(riotData.preMainRoleDamage)
  ) {
    return { unrated: true, reason: "missing_stats" };
  }
  return { unrated: false };
}

function scoreInput(participant: Participant): PersonalScoreInput {
  const recent = participant.riotData.recentStats;
  const winRate =
    typeof participant.riotData.winRate === "number"
      ? participant.riotData.winRate
      : recent
        ? adjustedWinRate(recent.wins, recent.games)
        : 0.5;

  return {
    lpValue: participant.currentLpValue,
    mainRoleKda: participant.riotData.preMainRoleKda ?? null,
    adjustedWinRate: winRate,
  };
}

/**
 * Recomputes session-relative personal scores and OP/1~4 badges across all
 * participants (spec D-06). Returns new participant objects; display only.
 */
export function analyzeSession(participants: Participant[]): Participant[] {
  if (participants.length === 0) {
    return participants;
  }

  const { scores } = computePersonalScores(participants.map(scoreInput));
  const badges = computeBadges(scores);

  return participants.map((participant, index) => ({
    ...participant,
    personalScore: scores[index],
    internalTierBadge: badges[index].badge,
  }));
}
