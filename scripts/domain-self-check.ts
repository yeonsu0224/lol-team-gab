import assert from "node:assert/strict";

import { evaluateHoneyBee } from "../lib/domain/honeyBee.ts";
import { lpValueToTier, tierToLpValue } from "../lib/domain/lp.ts";
import { calculatePerformanceGrade } from "../lib/domain/performanceGrade.ts";
import { calculatePowerRatio } from "../lib/domain/powerRatio.ts";
import { balanceTeams } from "../lib/domain/teamBalance.ts";
import { applyTrialRound } from "../lib/domain/trialAdjust.ts";
import { adjustedWinRate } from "../lib/domain/winRate.ts";
import { minMaxNormalize } from "../lib/utils/normalize.ts";

assert.equal(adjustedWinRate(0, 0), 0.5);
assert.deepEqual(minMaxNormalize([null, 10, 20]), [null, 0, 1]);
assert.equal(tierToLpValue("GOLD", "II", 50), 1_550);
assert.equal(lpValueToTier(1_550).label, "골드 2 · 50LP");
assert.deepEqual(calculatePowerRatio(512, 488), {
  bluePowerPct: 51,
  redPowerPct: 49,
});
assert.equal(applyTrialRound(1_000, 1_200), 1_060);

const teams = balanceTeams(
  Array.from({ length: 8 }, (_, index) => ({
    puuid: `player-${index + 1}`,
    personalScore: index + 1,
  })),
);
assert.equal(teams.blueTeam.length, 4);
assert.equal(teams.redTeam.length, 4);
assert.equal(teams.scoreDifference, 0);

const unrated = evaluateHoneyBee({
  availability: {
    preMainRoleGames: 0,
    preStatScore: null,
    tierExpectScore: 0.5,
  },
  trialScore: 0.9,
  previousStreak: 2,
});
assert.equal(unrated.unrated, true);
assert.equal(unrated.streak, 2);

const bee = evaluateHoneyBee({
  availability: {
    preMainRoleGames: 10,
    preMainRoleKda: 3,
    preMainRoleDamage: 20_000,
    preStatScore: 0.5,
    tierExpectScore: 0.6,
  },
  trialScore: 0.8,
  previousStreak: 2,
});
assert.equal(bee.badge, "rainbowBee");
assert.equal(
  calculatePerformanceGrade({
    trialScore: 0.65,
    preStatScore: 0.5,
    tierExpectScore: 0.5,
    unrated: false,
  }).grade,
  "A",
);

console.log("Domain self-checks passed.");
