import type {
  Participant,
  RoundNumber,
  RoundRecord,
  Session,
  TeamProposal,
  TeamSide,
  TrialResult,
} from "@/lib/types";
import { assignInternalTierBadges } from "./badges";
import {
  calculateCompositeScores,
  calculatePreStatScores,
  calculateTierExpectationScores,
  evaluateHoneyBee,
} from "./honeyBee";
import { lpValueToTier } from "./lp";
import { calculatePerformanceGrade } from "./performanceGrade";
import { calculatePersonalScores } from "./personalScore";
import { calculatePersonalScoreDelta } from "./personalScoreDelta";
import { calculateTeamPowerRatio } from "./powerRatio";
import { calculateSynergy } from "./synergy";
import { balanceTeams } from "./teamBalance";
import { calculateTeamChanges } from "./teamChange";
import { adjustedTrialLp, applyTrialRound } from "./trialAdjust";
import { adjustedWinRate } from "./winRate";

export interface TrialDraft {
  round: RoundNumber;
  winnerTeam: TeamSide;
  matchId?: string;
  bluePuuids: string[];
  redPuuids: string[];
  stats: Partial<Record<string, { kda: number | null; damageDealt: number | null }>>;
}

export function refreshParticipantScores(
  participants: ReadonlyArray<Participant>,
  useCurrentLp = false,
): Participant[] {
  const scores = calculatePersonalScores(
    participants.map((participant) => ({
      puuid: participant.puuid,
      preLpValue: participant.preLpValue,
      currentLpValue: participant.currentLpValue,
      mainRoleKda: participant.riotData.preMainRoleKda,
      adjustedWinRate: adjustedWinRate(
        participant.riotData.recentStats?.wins ?? 0,
        participant.riotData.recentStats?.games ?? 0,
      ),
    })),
    useCurrentLp,
  );
  const badges = assignInternalTierBadges(scores);
  return participants.map((participant) => {
    const score = scores.find(({ puuid }) => puuid === participant.puuid);
    return {
      ...participant,
      personalScore: score?.personalScore ?? participant.personalScore,
      internalTierBadge: badges[participant.puuid] ?? participant.internalTierBadge,
    };
  });
}

export function buildTeamProposal(
  participants: ReadonlyArray<Participant>,
  targetRound?: 2 | 3 | 4,
  previous?: TeamProposal,
): TeamProposal {
  const balanced = balanceTeams(participants, targetRound);
  return proposalFromTeams(
    balanced.blueTeam,
    balanced.redTeam,
    targetRound,
    previous,
  );
}

export function proposalFromTeams(
  blueTeam: ReadonlyArray<Participant>,
  redTeam: ReadonlyArray<Participant>,
  targetRound?: 2 | 3 | 4,
  previous?: TeamProposal,
): TeamProposal {
  const blue = [...blueTeam];
  const red = [...redTeam];
  const blueAverage = averageLp(blue);
  const redAverage = averageLp(red);
  const ratio = calculateTeamPowerRatio(
    blue,
    red,
    ({ currentLpValue, personalScore }) => targetRound ? currentLpValue : personalScore,
  );
  const blueSynergy = calculateSynergy(blue.map(toSynergyPlayer));
  const redSynergy = calculateSynergy(red.map(toSynergyPlayer));
  const changes = previous
    ? calculateTeamChanges(previous, { blueTeam: blue, redTeam: red }).changes
    : undefined;
  return {
    type: targetRound ? "rebalance" : "pre",
    targetRound,
    blueTeam: blue,
    redTeam: red,
    blueAvgTier: lpValueToTier(blueAverage),
    redAvgTier: lpValueToTier(redAverage),
    tierDiffDivisions: Math.round((Math.abs(blueAverage - redAverage) / 100) * 10) / 10,
    ...ratio,
    blueSynergy: blueSynergy.grade,
    redSynergy: redSynergy.grade,
    changes,
  };
}

export function replayTrialRounds(session: Session, drafts: ReadonlyArray<TrialDraft>): Session {
  let participants = refreshParticipantScores(
    session.participants.map(resetParticipant),
  );
  let previousProposal = session.preTeamProposal
    ? proposalWithParticipants(session.preTeamProposal, participants)
    : undefined;
  const preTeamProposal = previousProposal ?? buildTeamProposal(participants);
  previousProposal = preTeamProposal;
  const rounds: RoundRecord[] = [];

  for (const draft of [...drafts].sort((a, b) => a.round - b.round)) {
    if (draft.round !== rounds.length + 1) break;
    const committed = commitRound(participants, previousProposal, draft);
    participants = committed.participants;
    rounds.push(committed.record);
    previousProposal = committed.record.nextTeamProposal;
  }
  return { ...session, participants, preTeamProposal, rounds };
}

export function draftFromRecord(record: RoundRecord): TrialDraft {
  return {
    round: record.round,
    winnerTeam: record.trialResult.winnerTeam,
    matchId: record.trialResult.matchId,
    bluePuuids: record.trialResult.blueTeam.map(({ puuid }) => puuid),
    redPuuids: record.trialResult.redTeam.map(({ puuid }) => puuid),
    stats: Object.fromEntries(
      record.trialResult.playerStats.map(({ puuid, kda, damageDealt }) => [
        puuid,
        { kda, damageDealt },
      ]),
    ),
  };
}

function commitRound(
  participants: Participant[],
  proposal: TeamProposal,
  draft: TrialDraft,
): { participants: Participant[]; record: RoundRecord } {
  const byId = new Map(participants.map((participant) => [participant.puuid, participant]));
  const blueTeam = draft.bluePuuids.map((id) => byId.get(id)).filter(isParticipant);
  const redTeam = draft.redPuuids.map((id) => byId.get(id)).filter(isParticipant);
  const ordered = [...blueTeam, ...redTeam];
  const detailed = ordered.every((participant) => {
    const value = draft.stats[participant.puuid];
    return value?.kda != null && value.damageDealt != null;
  });
  const trialScores = detailed
    ? calculateCompositeScores(
        ordered.map(({ puuid }) => draft.stats[puuid]?.kda),
        ordered.map(({ puuid }) => draft.stats[puuid]?.damageDealt),
      )
    : ordered.map(() => null);
  const preScores = calculatePreStatScores(draft.round, ordered);
  const tierScores = {
    ...calculateTierExpectationScores(blueTeam.map((player) => expectationInput(player, draft))),
    ...calculateTierExpectationScores(redTeam.map((player) => expectationInput(player, draft))),
  };
  const previousScores = Object.fromEntries(
    participants.map(({ puuid, personalScore }) => [puuid, personalScore]),
  );

  let updated: Participant[] = participants.map((participant): Participant => {
    const side: TeamSide = draft.bluePuuids.includes(participant.puuid) ? "blue" : "red";
    const won = draft.winnerTeam === side;
    const stat = draft.stats[participant.puuid];
    const trialScore = trialScores[ordered.findIndex(({ puuid }) => puuid === participant.puuid)];
    const preStatScore = preScores[participant.puuid] ?? null;
    const tierExpectScore = tierScores[participant.puuid] ?? null;
    const adjusted = detailed && trialScore != null && tierExpectScore != null
      ? adjustedTrialLp(participant.currentLpValue, {
          kind: "performance",
          actualShare: trialScore,
          expectedShare: Math.max(tierExpectScore, Number.EPSILON),
        })
      : adjustedTrialLp(participant.currentLpValue, { kind: "winner-only", won });
    const currentLpValue = applyTrialRound(participant.currentLpValue, adjusted);
    const honey = evaluateHoneyBee({
      availability: {
        preMainRoleGames: participant.riotData.preMainRoleGames,
        preMainRoleKda: participant.riotData.preMainRoleKda,
        preMainRoleDamage: participant.riotData.preMainRoleDamage,
        preStatScore,
        tierExpectScore,
        tierSource: participant.tierSource,
      },
      trialScore,
      previousStreak: participant.honeyBeeStreak,
    });
    const grade = calculatePerformanceGrade({
      trialScore,
      preStatScore,
      tierExpectScore,
      unrated: honey.unrated,
    }).grade;
    return {
      ...participant,
      currentLpValue,
      honeyBeeStreak: honey.streak,
      honeyBeeBadge: honey.badge,
      honeyBeeHistory: [
        ...participant.honeyBeeHistory.slice(0, draft.round - 1),
        honey.roundHoneyBee,
      ],
      trialPerformanceByRound: detailed && stat?.kda != null && stat.damageDealt != null
        ? {
            ...participant.trialPerformanceByRound,
            [draft.round]: {
              kda: stat.kda,
              damageDealt: stat.damageDealt,
              preStatScore,
              tierExpectScore,
              trialScore: trialScore ?? 0,
              unrated: honey.unrated,
              unratedReason: honey.unratedReason,
              roundHoneyBee: honey.roundHoneyBee,
              roundBelowExpect: honey.roundBelowExpect,
              performanceGrade: grade,
            },
          }
        : participant.trialPerformanceByRound,
    };
  });
  updated = refreshParticipantScores(updated, true).map((participant) => ({
    ...participant,
    personalScoreDeltaByRound: {
      ...participant.personalScoreDeltaByRound,
      [draft.round + 1]: calculatePersonalScoreDelta(
        previousScores[participant.puuid] ?? participant.personalScore,
        participant.personalScore,
      ),
    },
  }));
  const updatedById = new Map(updated.map((participant) => [participant.puuid, participant]));
  const resultBlue = blueTeam.map(({ puuid }) => updatedById.get(puuid)).filter(isParticipant);
  const resultRed = redTeam.map(({ puuid }) => updatedById.get(puuid)).filter(isParticipant);
  const trialResult: TrialResult = {
    round: draft.round,
    matchId: draft.matchId?.trim() || undefined,
    winnerTeam: draft.winnerTeam,
    blueTeam: resultBlue,
    redTeam: resultRed,
    playerStats: detailed
      ? ordered.map(({ puuid }) => ({
          puuid,
          kda: draft.stats[puuid]?.kda ?? 0,
          damageDealt: draft.stats[puuid]?.damageDealt ?? 0,
        }))
      : [],
  };
  const nextTeamProposal = buildTeamProposal(updated, (draft.round + 1) as 2 | 3 | 4, {
    ...proposal,
    blueTeam: resultBlue,
    redTeam: resultRed,
  });
  return {
    participants: updated,
    record: {
      round: draft.round,
      trialResult,
      nextTeamProposal,
      lpSnapshotAfterTrial: Object.fromEntries(
        updated.map(({ puuid, currentLpValue }) => [puuid, currentLpValue]),
      ),
    },
  };
}

function resetParticipant(participant: Participant): Participant {
  return {
    ...participant,
    currentLpValue: participant.preLpValue,
    honeyBeeStreak: 0,
    honeyBeeBadge: "none",
    honeyBeeHistory: [],
    trialPerformanceByRound: undefined,
    personalScoreDeltaByRound: undefined,
  };
}

function proposalWithParticipants(
  proposal: TeamProposal,
  participants: Participant[],
): TeamProposal {
  const byId = new Map(participants.map((participant) => [participant.puuid, participant]));
  return proposalFromTeams(
    proposal.blueTeam.map(({ puuid }) => byId.get(puuid)).filter(isParticipant),
    proposal.redTeam.map(({ puuid }) => byId.get(puuid)).filter(isParticipant),
    proposal.targetRound,
  );
}

function expectationInput(participant: Participant, draft: TrialDraft) {
  return {
    puuid: participant.puuid,
    currentLpValue: participant.currentLpValue,
    kda: draft.stats[participant.puuid]?.kda ?? null,
    damageDealt: draft.stats[participant.puuid]?.damageDealt ?? null,
  };
}

function averageLp(team: Participant[]): number {
  return team.length
    ? team.reduce((sum, { currentLpValue }) => sum + currentLpValue, 0) / team.length
    : 0;
}

function toSynergyPlayer(participant: Participant) {
  return {
    puuid: participant.puuid,
    mainRole: participant.riotData.mainRole,
    topChampions: participant.synergyFactors.topChampions,
  };
}

function isParticipant(value: Participant | undefined): value is Participant {
  return Boolean(value);
}
