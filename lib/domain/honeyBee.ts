import type { HoneyBeeBadge, UnratedReason } from "../types/session.ts";
import { minMaxNormalize } from "../utils/normalize.ts";

export const MIN_MAIN_ROLE_SAMPLE = 3;

export interface RatingAvailability {
  preMainRoleGames?: number;
  preMainRoleKda?: number | null;
  preMainRoleDamage?: number | null;
  preStatScore: number | null;
  tierExpectScore: number | null;
  tierSource?: string;
}

export interface HoneyBeeEvaluation extends HoneyBeeStreak {
  unrated: boolean;
  unratedReason?: UnratedReason;
  roundHoneyBee: boolean;
  roundBelowExpect: boolean;
}

export interface HoneyBeeStreak {
  streak: number;
  badge: HoneyBeeBadge;
}

export interface ExpectationPlayer {
  puuid: string;
  currentLpValue: number;
  preMainRoleKda?: number | null;
  preMainRoleDamage?: number | null;
}

export function determineUnratedReason(input: RatingAvailability): UnratedReason | null {
  if (input.tierSource === "manual") return "manual_tier";
  if ((input.preMainRoleGames ?? 0) === 0) return "no_history";
  if ((input.preMainRoleGames ?? 0) < MIN_MAIN_ROLE_SAMPLE) return "insufficient_sample";
  if (input.preMainRoleKda == null || input.preMainRoleDamage == null) return "missing_stats";
  if (input.preStatScore == null || input.tierExpectScore == null) return "missing_stats";
  return null;
}

export function evaluateHoneyBee(input: {
  availability: RatingAvailability;
  trialScore: number | null;
  previousStreak: number;
}): HoneyBeeEvaluation {
  const reason = determineUnratedReason(input.availability);
  if (reason) {
    return {
      unrated: true,
      unratedReason: reason,
      roundHoneyBee: false,
      roundBelowExpect: false,
      ...streakResult(input.previousStreak),
    };
  }
  if (input.trialScore == null) {
    return {
      unrated: false,
      roundHoneyBee: false,
      roundBelowExpect: false,
      ...streakResult(0),
    };
  }

  const preStatScore = input.availability.preStatScore as number;
  const tierExpectScore = input.availability.tierExpectScore as number;
  const roundHoneyBee =
    input.trialScore > preStatScore && input.trialScore > tierExpectScore;
  const roundBelowExpect =
    input.trialScore <= preStatScore && input.trialScore <= tierExpectScore;
  return {
    unrated: false,
    roundHoneyBee,
    roundBelowExpect,
    ...updateHoneyBeeStreak(input.previousStreak, roundHoneyBee),
  };
}

export function updateHoneyBeeStreak(
  previousStreak: number,
  roundHoneyBee: boolean,
): HoneyBeeStreak {
  return streakResult(roundHoneyBee ? Math.min(3, Math.max(0, previousStreak) + 1) : 0);
}

export function calculateCompositeScores(
  kda: ReadonlyArray<number | null | undefined>,
  damage: ReadonlyArray<number | null | undefined>,
): Array<number | null> {
  const normalizedKda = minMaxNormalize(kda);
  const normalizedDamage = minMaxNormalize(damage);
  return normalizedKda.map((kdaScore, index) => {
    const damageScore = normalizedDamage[index];
    return kdaScore == null || damageScore == null ? null : kdaScore * 0.5 + damageScore * 0.5;
  });
}

export function calculatePreStatScores(
  round: 1 | 2 | 3,
  players: ReadonlyArray<ExpectationPlayer>,
): Record<string, number | null> {
  const scores =
    round === 1
      ? calculateCompositeScores(
          players.map(({ preMainRoleKda }) => preMainRoleKda),
          players.map(({ preMainRoleDamage }) => preMainRoleDamage),
        )
      : minMaxNormalize(players.map(({ currentLpValue }) => currentLpValue));
  return Object.fromEntries(players.map(({ puuid }, index) => [puuid, scores[index]]));
}

export function calculateTierExpectationScores(
  team: ReadonlyArray<{
    puuid: string;
    currentLpValue: number;
    kda: number | null;
    damageDealt: number | null;
  }>,
): Record<string, number | null> {
  const totalLp = team.reduce((sum, { currentLpValue }) => sum + Math.max(0, currentLpValue), 0);
  const totalKda = team.reduce((sum, { kda }) => sum + (kda ?? 0), 0);
  const totalDamage = team.reduce((sum, { damageDealt }) => sum + (damageDealt ?? 0), 0);
  if (totalLp <= 0 || team.some(({ kda, damageDealt }) => kda == null || damageDealt == null)) {
    return Object.fromEntries(team.map(({ puuid }) => [puuid, null]));
  }
  const expectedKda = team.map(
    ({ currentLpValue }) => totalKda * (Math.max(0, currentLpValue) / totalLp),
  );
  const expectedDamage = team.map(
    ({ currentLpValue }) => totalDamage * (Math.max(0, currentLpValue) / totalLp),
  );
  const scores = calculateCompositeScores(expectedKda, expectedDamage);
  return Object.fromEntries(team.map(({ puuid }, index) => [puuid, scores[index]]));
}

function streakResult(streak: number): HoneyBeeStreak {
  const safe = Math.min(3, Math.max(0, Math.floor(streak)));
  const badge: HoneyBeeBadge =
    safe >= 3 ? "rainbowBee" : safe === 2 ? "glitterBee" : safe === 1 ? "bee" : "none";
  return { streak: safe, badge };
}
