import { analyzeSession } from "@/lib/player/analysis";
import type {
  Participant,
  RoundNumber,
  RoundRecord,
  Session,
  TargetRound,
  TeamSide,
  TrialPerformance,
  TrialResult,
} from "@/lib/types";
import { isPresent } from "@/lib/utils/normalize";

import {
  computeTierExpectScores,
  computeTrialScores,
  evaluateRound,
  resolveUnrated,
  streakToBadge,
  updateStreak,
} from "./honeyBee";
import { computePerformanceGrade } from "./performanceGrade";
import { computePersonalScoreDelta } from "./personalScoreDelta";
import { applyTrialRound } from "./trialAdjust";
import { buildRebalanceProposal } from "./teamProposal";

function resetParticipant(participant: Participant): Participant {
  return {
    ...participant,
    currentLpValue: participant.preLpValue,
    honeyBeeStreak: 0,
    honeyBeeBadge: "none",
    honeyBeeHistory: [],
    trialPerformanceByRound: {},
    personalScoreDeltaByRound: {},
  };
}

interface RoundOutcome {
  participants: Participant[];
}

/**
 * Applies a single trial round to the given participant states (spec D-02,
 * D-07, D-11). Returns updated participants with accumulated LP, honeybee
 * streak/badge/history and the round's TrialPerformance. Pure.
 */
function evaluateRoundPipeline(
  participants: Participant[],
  trial: TrialResult,
): RoundOutcome {
  const round = trial.round;
  const roster = [...trial.blueTeam, ...trial.redTeam].map(
    (participant) => participant.puuid,
  );
  const rosterSet = new Set(roster);
  const teamOf = new Map<string, TeamSide>();
  for (const member of trial.blueTeam) {
    teamOf.set(member.puuid, "blue");
  }
  for (const member of trial.redTeam) {
    teamOf.set(member.puuid, "red");
  }

  const statByPuuid = new Map(
    trial.playerStats.map((stat) => [stat.puuid, stat]),
  );
  const currentByPuuid = new Map(
    participants.map((participant) => [participant.puuid, participant]),
  );

  // Round participants in a stable order for normalization pools.
  const roundParticipants = roster
    .map((puuid) => currentByPuuid.get(puuid))
    .filter((participant): participant is Participant => Boolean(participant));

  const teamStatTotals: Record<TeamSide, { kda: number; damage: number }> = {
    blue: { kda: 0, damage: 0 },
    red: { kda: 0, damage: 0 },
  };
  for (const stat of trial.playerStats) {
    const side = teamOf.get(stat.puuid);
    if (!side) {
      continue;
    }
    if (isPresent(stat.kda)) {
      teamStatTotals[side].kda += stat.kda;
    }
    if (isPresent(stat.damageDealt)) {
      teamStatTotals[side].damage += stat.damageDealt;
    }
  }

  const preStatScores = computeTrialScores(
    roundParticipants.map((participant) => ({
      kda: participant.riotData.preMainRoleKda ?? null,
      damageDealt: participant.riotData.preMainRoleDamage ?? null,
    })),
  );
  const trialScores = computeTrialScores(
    roundParticipants.map((participant) => {
      const stat = statByPuuid.get(participant.puuid);
      return {
        kda: stat?.kda ?? null,
        damageDealt: stat?.damageDealt ?? null,
      };
    }),
  );
  const tierExpectScores = computeTierExpectScores(
    roundParticipants.map((participant) => {
      const side = teamOf.get(participant.puuid)!;
      return {
        playerLp: participant.currentLpValue,
        teamKda: teamStatTotals[side].kda,
        teamDamage: teamStatTotals[side].damage,
      };
    }),
  );

  const performanceByPuuid = new Map<string, TrialPerformance>();
  const nextLpByPuuid = new Map<string, number>();
  const nextStreakByPuuid = new Map<string, number>();

  roundParticipants.forEach((participant, index) => {
    const stat = statByPuuid.get(participant.puuid);
    const kda = stat?.kda ?? null;
    const damageDealt = stat?.damageDealt ?? null;
    const preStatScore = preStatScores[index];
    const tierExpectScore = tierExpectScores[index];
    const trialScore = trialScores[index];
    const side = teamOf.get(participant.puuid)!;
    const won = side === trial.winnerTeam;
    const hasStats = isPresent(trialScore);

    const { unrated, reason } = resolveUnrated({
      preMainRoleGames: participant.riotData.preMainRoleGames ?? null,
      preMainRoleKda: participant.riotData.preMainRoleKda ?? null,
      preMainRoleDamage: participant.riotData.preMainRoleDamage ?? null,
      preStatScore,
      tierExpectScore,
      tierSource: participant.tierSource,
    });

    const { roundHoneyBee, roundBelowExpect } = evaluateRound({
      trialScore,
      preStatScore,
      tierExpectScore,
      unrated,
    });

    const expectScore =
      isPresent(preStatScore) && isPresent(tierExpectScore)
        ? (preStatScore + tierExpectScore) / 2
        : null;
    const performanceRatio =
      hasStats && isPresent(expectScore) && expectScore > 0
        ? (trialScore as number) / expectScore
        : null;

    const nextLp = applyTrialRound({
      prevLp: participant.currentLpValue,
      won,
      performanceRatio,
      hasStats,
    });
    const nextStreak = updateStreak(participant.honeyBeeStreak, {
      unrated,
      hasStats,
      roundHoneyBee,
    });
    const performanceGrade = computePerformanceGrade({
      trialScore,
      preStatScore,
      tierExpectScore,
      unrated,
    });

    performanceByPuuid.set(participant.puuid, {
      kda: kda ?? 0,
      damageDealt: damageDealt ?? 0,
      preStatScore,
      tierExpectScore,
      trialScore: trialScore ?? 0,
      unrated,
      unratedReason: reason,
      roundHoneyBee,
      roundBelowExpect,
      performanceGrade,
    });
    nextLpByPuuid.set(participant.puuid, nextLp);
    nextStreakByPuuid.set(participant.puuid, nextStreak);
  });

  const updated = participants.map((participant) => {
    if (!rosterSet.has(participant.puuid)) {
      return participant;
    }
    const nextStreak =
      nextStreakByPuuid.get(participant.puuid) ?? participant.honeyBeeStreak;
    const performance = performanceByPuuid.get(participant.puuid);
    return {
      ...participant,
      currentLpValue:
        nextLpByPuuid.get(participant.puuid) ?? participant.currentLpValue,
      honeyBeeStreak: nextStreak,
      honeyBeeBadge: streakToBadge(nextStreak),
      honeyBeeHistory: [
        ...participant.honeyBeeHistory,
        performance?.roundHoneyBee ?? false,
      ],
      trialPerformanceByRound: {
        ...participant.trialPerformanceByRound,
        ...(performance ? { [round]: performance } : {}),
      },
    };
  });

  return { participants: updated };
}

function sortedRounds(rounds: RoundRecord[]): RoundRecord[] {
  return [...rounds].sort(
    (a, b) => a.trialResult.round - b.trialResult.round,
  );
}

/**
 * Recomputes all participant states and round records by replaying every
 * stored trial result from the pre-game baseline. Makes editing an earlier
 * round idempotent and consistent (spec F-05/F-06).
 */
export function replaySession(session: Session): Session {
  let participants = analyzeSession(session.participants.map(resetParticipant));
  const rounds = sortedRounds(session.rounds);
  const rebuiltRounds: RoundRecord[] = [];

  for (const record of rounds) {
    const previousScores = new Map(
      participants.map((participant) => [
        participant.puuid,
        participant.personalScore,
      ]),
    );

    const outcome = evaluateRoundPipeline(participants, record.trialResult);
    participants = analyzeSession(outcome.participants);

    participants = participants.map((participant) => {
      const delta = computePersonalScoreDelta(
        previousScores.get(participant.puuid) ?? null,
        participant.personalScore,
      );
      return {
        ...participant,
        personalScoreDeltaByRound: {
          ...participant.personalScoreDeltaByRound,
          ...(delta !== null
            ? { [record.trialResult.round]: delta }
            : {}),
        },
      };
    });

    const targetRound = (record.trialResult.round + 1) as TargetRound;
    const previousSnapshot = {
      bluePuuids: record.trialResult.blueTeam.map((p) => p.puuid),
      redPuuids: record.trialResult.redTeam.map((p) => p.puuid),
    };
    const nextTeamProposal = buildRebalanceProposal(
      participants,
      targetRound,
      previousSnapshot,
    );

    rebuiltRounds.push({
      round: record.trialResult.round,
      trialResult: record.trialResult,
      nextTeamProposal,
      lpSnapshotAfterTrial: Object.fromEntries(
        participants.map((participant) => [
          participant.puuid,
          participant.currentLpValue,
        ]),
      ),
    });
  }

  return { ...session, participants, rounds: rebuiltRounds };
}

/** Adds or replaces a trial round and replays the session (spec F-05). */
export function commitTrialRound(
  session: Session,
  trial: TrialResult,
): Session {
  const others = session.rounds.filter(
    (record) => record.trialResult.round !== trial.round,
  );
  const placeholder: RoundRecord = {
    round: trial.round,
    trialResult: trial,
    nextTeamProposal:
      session.rounds.find(
        (record) => record.trialResult.round === trial.round,
      )?.nextTeamProposal ?? session.preTeamProposal!,
    lpSnapshotAfterTrial: {},
  };
  return replaySession({ ...session, rounds: [...others, placeholder] });
}

/** Removes a trial round (and any later rounds) then replays (spec F-05). */
export function removeTrialRound(
  session: Session,
  round: RoundNumber,
): Session {
  const kept = session.rounds.filter(
    (record) => record.trialResult.round < round,
  );
  return replaySession({ ...session, rounds: kept });
}
