import assert from "node:assert/strict";

import {
  assignInternalTiers,
  automaticMvp,
  buildTeamProposal,
  finalWinner,
  refreshParticipantScores,
  replayTrialRounds,
  topHoneyBees,
} from "../lib/domain/sessionWorkflow.ts";
import { lpValueToTier, tierToLpValue } from "../lib/domain/lp.ts";
import type { Participant, Session } from "../lib/types/session.ts";

assert.equal(tierToLpValue("GOLD", "II", 50), 1550);
assert.equal(lpValueToTier(1550).label, "골드 2 · 50LP");
assert.deepEqual(assignInternalTiers([0.1, 0.2, 0.3, 0.4, 0.5]), [5, 4, 3, 2, 1]);
assert.equal(assignInternalTiers([0.1, 0.15, 0.2, 0.25, 1])[4], "OP");
assert.equal(finalWinner(["blue", "red"]), "red");

const participants = Array.from({ length: 8 }, (_, index): Participant => ({
  riotId: `player${index}#KR1`,
  puuid: `p${index}`,
  preTier: lpValueToTier(1400 + index * 50),
  preLpValue: 1400 + index * 50,
  currentLpValue: 1400 + index * 50,
  personalScore: index / 8,
  internalTierBadge: 5,
  honeyBeeStreak: 0,
  honeyBeeBadge: "none",
  honeyBeeHistory: [],
  tierSource: "solo",
  riotData: {
    mainRole: ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"][index % 5] as Participant["riotData"]["mainRole"],
    preMainRoleGames: 10,
    preMainRoleKda: 2 + index * 0.1,
    preMainRoleDamage: 15_000 + index * 1_000,
  },
  synergyFactors: { duoPartners: [], topChampions: [] },
}));

const session: Session = {
  id: "test",
  createdAt: new Date(0).toISOString(),
  participants,
  rounds: [],
};

const bluePuuids = participants.slice(0, 4).map(({ puuid }) => puuid);
const redPuuids = participants.slice(4).map(({ puuid }) => puuid);
const next = replayTrialRounds(session, [{
  round: 1,
  winnerTeam: "blue",
  bluePuuids,
  redPuuids,
  stats: Object.fromEntries(participants.map((item, index) => [
    item.puuid,
    { kda: 1 + index, damageDealt: 10_000 + index * 2_000 },
  ])),
}]);

assert.equal(next.rounds.length, 1);
assert.equal(next.rounds[0].nextTeamProposal.targetRound, 2);
assert.ok(automaticMvp(next));
assert.ok(Array.isArray(topHoneyBees(next)));

// D-06: 2^k 완전 탐색이 8명을 4v4로 나누고 전력 합 차이를 최소화한다.
const refreshed = refreshParticipantScores(participants);
const proposal = buildTeamProposal(refreshed);
assert.equal(proposal.blueTeam.length, 4);
assert.equal(proposal.redTeam.length, 4);
const scoreOf = (team: Participant[]) => team.reduce((sum, item) => sum + item.personalScore, 0);
const bestDiff = Math.abs(scoreOf(proposal.blueTeam) - scoreOf(proposal.redTeam));
const snakeBlue = [...refreshed].sort((a, b) => b.personalScore - a.personalScore).filter((_, index) => index % 4 === 0 || index % 4 === 3);
const snakeRed = refreshed.filter((item) => !snakeBlue.includes(item));
assert.ok(bestDiff <= Math.abs(scoreOf(snakeBlue) - scoreOf(snakeRed)) + 1e-9);

// D-06 OP 2-pass: 명확한 이상치는 OP 뱃지, 나머지는 1~5 분위.
const opParticipants = participants.map((item, index) =>
  index === 0 ? { ...item, preLpValue: 6000, currentLpValue: 6000 } : item,
);
const opped = refreshParticipantScores(opParticipants);
assert.equal(opped[0].internalTierBadge, "OP");
assert.ok(opped.slice(1).every((item) => item.internalTierBadge !== "OP"));

// F-03: 보정 승률은 판수를 반영한다((wins + 10) / (games + 20)).
const noGames = refreshParticipantScores(participants.map((item) => ({
  ...item,
  riotData: { ...item.riotData, recentStats: undefined },
})));
assert.ok(noGames.every((item) => Number.isFinite(item.personalScore)));

// D-06 수동 내부평가는 자동 점수에 최대 ±10%p만 보정한다.
const manualBoosted = refreshParticipantScores(participants.map((item, index) => ({
  ...item,
  manualScoreAdjustment: index === 3 ? 10 : 0,
})));
const manualNeutral = refreshParticipantScores(participants);
assert.ok(manualBoosted[3].personalScore > manualNeutral[3].personalScore);
assert.ok(manualBoosted[3].personalScore - manualNeutral[3].personalScore <= 0.1 + 1e-9);

console.log("Domain self-checks passed.");
