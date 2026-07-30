import type {
  InternalTier,
  MainRole,
  Participant,
  PerformanceGrade,
  RoundNumber,
  RoundRecord,
  Session,
  TeamProposal,
  TeamSide,
  TrialPlayerStat,
} from "@/lib/types";
import { lpValueToTier } from "./lp";

export interface TrialDraft {
  round: RoundNumber;
  winnerTeam: TeamSide;
  matchId?: string;
  bluePuuids: string[];
  redPuuids: string[];
  stats: Partial<Record<string, {
    kda: number | null;
    damageDealt: number | null;
    championId?: number;
    playedRole?: MainRole;
  }>>;
}

// D-06: personalScore = normLp×0.70 + normKda×0.20 + adjustedWinRate×0.10
// OP 2-pass: (1) 전원 정규화로 1차 산출 → (2) OP 판정 → (3) OP 제외 재정규화로 최종 산출 → (4) 비OP 5분위 뱃지.
export function refreshParticipantScores(participants: readonly Participant[], useCurrentLp = false): Participant[] {
  if (!participants.length) return [];
  const lp = participants.map((item) => useCurrentLp ? item.currentLpValue : item.preLpValue);
  const kda = participants.map((item) => item.riotData.preMainRoleKda ?? null);
  const win = participants.map((item) => {
    const recent = item.riotData.recentStats;
    return adjustedWinRate(recent?.wins ?? 0, recent?.games ?? 0);
  });

  const firstPass = composeScores(normalize(lp), normalizeNullable(kda), win);
  const opIndexes = detectOpIndexes(firstPass);
  const domain = participants.map((_, index) => index).filter((index) => !opIndexes.has(index));

  const finalScores = composeScores(normalizeDomain(lp, domain), normalizeNullableDomain(kda, domain), win);
  const badges = tiersFromScores(finalScores, opIndexes);
  return participants.map((item, index) => ({ ...item, personalScore: finalScores[index], internalTierBadge: badges[index] }));
}

// F-03: 판수를 반영한 보정 승률(전체 평균 0.5, 기준 판수 20). 판수가 적을수록 0.5에 가깝다.
function adjustedWinRate(wins: number, games: number): number {
  return (Math.max(0, wins) + 20 * 0.5) / (Math.max(0, games) + 20);
}

function composeScores(normLp: number[], normKda: Array<number | null>, win: number[]): number[] {
  const kdaFallback = averagePresent(normKda);
  return normLp.map((value, index) => value * 0.7 + (normKda[index] ?? kdaFallback) * 0.2 + win[index] * 0.1);
}

export function assignInternalTiers(scores: number[]): InternalTier[] {
  return tiersFromScores(scores, detectOpIndexes(scores));
}

// OP 후보 ⇔ personalScore ≥ max(mean×1.35, mean + 1.5×stdDev). 후보 중 명확한 최고점(동률 포함)만 OP.
function detectOpIndexes(scores: number[]): Set<number> {
  if (!scores.length) return new Set();
  const mean = average(scores);
  const stdDev = Math.sqrt(average(scores.map((value) => (value - mean) ** 2)));
  const threshold = Math.max(mean * 1.35, mean + stdDev * 1.5);
  const max = Math.max(...scores);
  return new Set(
    scores
      .map((score, index) => ({ score, index }))
      .filter(({ score }) => score >= threshold && Math.abs(score - max) < 1e-9)
      .map(({ index }) => index),
  );
}

// 비OP만 점수 내림차순 5분위. OP는 항상 "OP" 뱃지.
function tiersFromScores(scores: number[], opIndexes: Set<number>): InternalTier[] {
  const result: InternalTier[] = scores.map(() => 5);
  const normal = scores
    .map((score, index) => ({ score, index }))
    .filter(({ index }) => !opIndexes.has(index))
    .sort((a, b) => b.score - a.score);
  normal.forEach(({ index }, order) => {
    result[index] = Math.min(5, Math.floor((order * 5) / Math.max(1, normal.length)) + 1) as 1 | 2 | 3 | 4 | 5;
  });
  opIndexes.forEach((index) => { result[index] = "OP"; });
  return result;
}

// D-06 Step 1~2: personalScore 오름차순 인접 페어링 후 2^k 완전 탐색으로 최적 배정.
export function buildTeamProposal(
  participants: readonly Participant[],
  targetRound?: 2 | 3 | 4,
  previous?: TeamProposal,
): TeamProposal {
  const list = [...participants];
  if (list.length < 2) return proposalFromTeams(list, [], targetRound, previous);

  const sorted = [...list].sort((a, b) => a.personalScore - b.personalScore);
  const fullPairs: Array<[Participant, Participant]> = [];
  let leftover: Participant | undefined;
  for (let index = 0; index < sorted.length; index += 2) {
    if (index + 1 < sorted.length) fullPairs.push([sorted[index + 1], sorted[index]]);
    else leftover = sorted[index];
  }

  const mean = average(list.map((item) => item.personalScore));
  const ideal = mean * (list.length / 2);
  const sumScore = (team: Participant[]) => team.reduce((sum, item) => sum + item.personalScore, 0);

  let best: { blue: Participant[]; red: Participant[]; diff: number; idealDiff: number } | undefined;
  const combos = 1 << fullPairs.length;
  for (let mask = 0; mask < combos; mask += 1) {
    const blue: Participant[] = [];
    const red: Participant[] = [];
    fullPairs.forEach(([high, low], index) => {
      if (mask & (1 << index)) { blue.push(high); red.push(low); }
      else { blue.push(low); red.push(high); }
    });
    if (leftover) (sumScore(blue) <= sumScore(red) ? blue : red).push(leftover);
    const diff = Math.abs(sumScore(blue) - sumScore(red));
    const idealDiff = Math.abs(sumScore(blue) - ideal);
    if (!best || diff < best.diff - 1e-9 || (Math.abs(diff - best.diff) < 1e-9 && idealDiff < best.idealDiff - 1e-9)) {
      best = { blue, red, diff, idealDiff };
    }
  }

  return proposalFromTeams(best!.blue, best!.red, targetRound, previous);
}

export function proposalFromTeams(
  blueTeam: readonly Participant[],
  redTeam: readonly Participant[],
  targetRound?: 2 | 3 | 4,
  previous?: TeamProposal,
): TeamProposal {
  const blue = [...blueTeam];
  const red = [...redTeam];
  const blueAverage = average(blue.map((item) => item.currentLpValue));
  const redAverage = average(red.map((item) => item.currentLpValue));
  const bluePower = Math.max(0, blue.reduce((sum, item) => sum + item.personalScore, 0));
  const redPower = Math.max(0, red.reduce((sum, item) => sum + item.personalScore, 0));
  const total = bluePower + redPower || 1;
  const bluePowerPct = Math.round((bluePower / total) * 100);
  return {
    type: targetRound ? "rebalance" : "pre",
    targetRound,
    blueTeam: blue,
    redTeam: red,
    blueAvgTier: lpValueToTier(blueAverage),
    redAvgTier: lpValueToTier(redAverage),
    tierDiffDivisions: Math.round((Math.abs(blueAverage - redAverage) / 100) * 10) / 10,
    bluePowerPct,
    redPowerPct: 100 - bluePowerPct,
    blueSynergy: synergy(blue),
    redSynergy: synergy(red),
    changes: previous ? teamChanges(previous, blue, red) : undefined,
  };
}

export function replayTrialRounds(session: Session, drafts: readonly TrialDraft[]): Session {
  let participants = refreshParticipantScores(session.participants.map(resetParticipant));
  const preTeamProposal = session.preTeamProposal
    ? proposalFromTeams(
        mapCurrent(session.preTeamProposal.blueTeam, participants),
        mapCurrent(session.preTeamProposal.redTeam, participants),
      )
    : buildTeamProposal(participants);
  let proposal = preTeamProposal;
  const rounds: RoundRecord[] = [];

  for (const draft of [...drafts].sort((a, b) => a.round - b.round)) {
    if (draft.round !== rounds.length + 1) break;
    const previousScores = Object.fromEntries(participants.map((item) => [item.puuid, item.personalScore]));
    const evaluation = evaluateRound(participants, draft);

    participants = participants.map((participant) => {
      const side: TeamSide = draft.bluePuuids.includes(participant.puuid) ? "blue" : "red";
      const won = side === draft.winnerTeam;
      const stat = draft.stats[participant.puuid];
      const outcome = evaluation.get(participant.puuid);

      const ratio = outcome?.ratio ?? null;
      const performanceDelta = ratio !== null
        ? Math.max(-200, Math.min(200, Math.round((ratio - 1) * 200))) + (won ? 25 : -25)
        : won ? 50 : -50;
      const adjustedTrialLp = participant.currentLpValue + performanceDelta;
      const currentLpValue = Math.max(0, Math.round(participant.currentLpValue * 0.7 + adjustedTrialLp * 0.3));

      const roundHoneyBee = outcome?.roundHoneyBee ?? false;
      const statPresent = Boolean(outcome?.statPresent);
      const streak = !statPresent
        ? 0
        : outcome?.unrated
          ? participant.honeyBeeStreak
          : roundHoneyBee
            ? participant.honeyBeeStreak + 1
            : 0;

      return {
        ...participant,
        currentLpValue,
        honeyBeeStreak: streak,
        honeyBeeBadge: streak >= 3 ? "rainbowBee" : streak === 2 ? "glitterBee" : streak === 1 ? "bee" : "none",
        honeyBeeHistory: [...participant.honeyBeeHistory.slice(0, draft.round - 1), roundHoneyBee],
        trialPerformanceByRound: statPresent && stat?.kda != null && stat.damageDealt != null ? {
          ...participant.trialPerformanceByRound,
          [draft.round]: {
            kda: stat.kda,
            damageDealt: stat.damageDealt,
            preStatScore: outcome?.preStatScore ?? null,
            tierExpectScore: outcome?.tierExpectScore ?? null,
            trialScore: outcome?.trialScore ?? 0,
            unrated: outcome?.unrated ?? true,
            unratedReason: outcome?.unratedReason,
            roundHoneyBee,
            roundBelowExpect: outcome?.roundBelowExpect ?? false,
            performanceGrade: outcome?.performanceGrade ?? null,
          },
        } : participant.trialPerformanceByRound,
      } satisfies Participant;
    });

    participants = refreshParticipantScores(participants, true).map((participant) => ({
      ...participant,
      personalScoreDeltaByRound: {
        ...participant.personalScoreDeltaByRound,
        [draft.round + 1]: percentDelta(previousScores[participant.puuid] ?? 0, participant.personalScore),
      },
    }));
    const byId = new Map(participants.map((item) => [item.puuid, item]));
    const blueTeam = draft.bluePuuids.map((id) => byId.get(id)).filter(isParticipant);
    const redTeam = draft.redPuuids.map((id) => byId.get(id)).filter(isParticipant);
    const detailed = [...draft.bluePuuids, ...draft.redPuuids].every((id) => {
      const stat = draft.stats[id];
      return stat?.kda != null && stat.damageDealt != null;
    });
    const playerStats: TrialPlayerStat[] = detailed
      ? [...draft.bluePuuids, ...draft.redPuuids].map((puuid) => ({
          puuid,
          kda: draft.stats[puuid]?.kda ?? 0,
          damageDealt: draft.stats[puuid]?.damageDealt ?? 0,
          championId: draft.stats[puuid]?.championId,
          playedRole: draft.stats[puuid]?.playedRole,
        }))
      : [];
    const nextTeamProposal = buildTeamProposal(participants, (draft.round + 1) as 2 | 3 | 4, {
      ...proposal,
      blueTeam,
      redTeam,
    });
    rounds.push({
      round: draft.round,
      trialResult: {
        round: draft.round,
        matchId: draft.matchId?.trim() || undefined,
        winnerTeam: draft.winnerTeam,
        blueTeam,
        redTeam,
        playerStats,
      },
      nextTeamProposal,
      lpSnapshotAfterTrial: Object.fromEntries(participants.map((item) => [item.puuid, item.currentLpValue])),
    });
    proposal = nextTeamProposal;
  }
  return { ...session, participants, preTeamProposal, rounds };
}

interface RoundOutcome {
  statPresent: boolean;
  unrated: boolean;
  unratedReason?: "no_history" | "insufficient_sample" | "missing_stats" | "manual_tier";
  trialScore: number | null;
  preStatScore: number | null;
  tierExpectScore: number | null;
  ratio: number | null;
  roundHoneyBee: boolean;
  roundBelowExpect: boolean;
  performanceGrade: PerformanceGrade | null;
}

// D-07: 해당 판 trialScore(0.5/0.5)와 기대치 A/A'(preStat)·기대치 B(tierExpect)를 모두 산출해 이중 조건 판정.
function evaluateRound(participants: readonly Participant[], draft: TrialDraft): Map<string, RoundOutcome> {
  const roundIds = [...draft.bluePuuids, ...draft.redPuuids];
  const priorById = new Map(participants.map((item) => [item.puuid, item]));
  const detailed = roundIds.every((id) => {
    const stat = draft.stats[id];
    return stat?.kda != null && stat.damageDealt != null;
  });

  // trialScore = normTrialKda×0.5 + normTrialDamage×0.5 (해당 판 n명 min-max)
  const trialScore = new Map<string, number>();
  if (detailed) {
    const normKda = normalize(roundIds.map((id) => draft.stats[id]!.kda!));
    const normDamage = normalize(roundIds.map((id) => draft.stats[id]!.damageDealt!));
    roundIds.forEach((id, index) => trialScore.set(id, normKda[index] * 0.5 + normDamage[index] * 0.5));
  }

  // 기대치 A(1판): 참가자 전원 사전 스탯 min-max. 결측·표본 부족·수동 티어는 제외(null).
  // 기대치 A'(2·3판): 직전 누적 LP 기반. 직전 currentLpValue가 있으면 항상 산출 가능.
  const preStat = new Map<string, number | null>();
  if (draft.round === 1) {
    const valid = participants.filter(hasPreStats);
    if (valid.length) {
      const normKda = normalize(valid.map((item) => item.riotData.preMainRoleKda!));
      const normDamage = normalize(valid.map((item) => item.riotData.preMainRoleDamage!));
      valid.forEach((item, index) => preStat.set(item.puuid, normKda[index] * 0.5 + normDamage[index] * 0.5));
    }
    participants.forEach((item) => { if (!preStat.has(item.puuid)) preStat.set(item.puuid, null); });
  } else {
    const normLp = normalize(roundIds.map((id) => priorById.get(id)?.currentLpValue ?? 0));
    roundIds.forEach((id, index) => preStat.set(id, normLp[index]));
  }

  // 기대치 B: tierExpectRatio = playerLp / teamLpSum, ×팀 trialScore 합.
  const teamLpSum: Record<TeamSide, number> = { blue: 0, red: 0 };
  const teamTrialSum: Record<TeamSide, number> = { blue: 0, red: 0 };
  draft.bluePuuids.forEach((id) => {
    teamLpSum.blue += priorById.get(id)?.currentLpValue ?? 0;
    teamTrialSum.blue += trialScore.get(id) ?? 0;
  });
  draft.redPuuids.forEach((id) => {
    teamLpSum.red += priorById.get(id)?.currentLpValue ?? 0;
    teamTrialSum.red += trialScore.get(id) ?? 0;
  });

  const outcomes = new Map<string, RoundOutcome>();
  roundIds.forEach((id) => {
    const side: TeamSide = draft.bluePuuids.includes(id) ? "blue" : "red";
    const stat = draft.stats[id];
    const statPresent = detailed && stat?.kda != null && stat.damageDealt != null;
    const ts = statPresent ? trialScore.get(id) ?? null : null;
    const ps = preStat.get(id) ?? null;
    const priorLp = priorById.get(id)?.currentLpValue ?? 0;
    const tierExpect = statPresent && teamLpSum[side] > 0
      ? teamTrialSum[side] * (priorLp / teamLpSum[side])
      : null;

    if (!statPresent) {
      // 시험 판 KDA·딜량 없음 → 미판정, 스트릭 리셋(unrated 아님).
      outcomes.set(id, {
        statPresent: false,
        unrated: false,
        unratedReason: "missing_stats",
        trialScore: null,
        preStatScore: ps,
        tierExpectScore: null,
        ratio: null,
        roundHoneyBee: false,
        roundBelowExpect: false,
        performanceGrade: null,
      });
      return;
    }

    if (ps === null || ts === null || tierExpect === null) {
      // 기대치 산출 불가 → unrated, 스트릭 유지.
      outcomes.set(id, {
        statPresent: true,
        unrated: true,
        unratedReason: draft.round === 1 ? "insufficient_sample" : "no_history",
        trialScore: ts,
        preStatScore: ps,
        tierExpectScore: tierExpect,
        ratio: null,
        roundHoneyBee: false,
        roundBelowExpect: false,
        performanceGrade: null,
      });
      return;
    }

    const expectRef = (ps + tierExpect) / 2;
    const ratio = ts / Math.max(expectRef, Number.EPSILON);
    outcomes.set(id, {
      statPresent: true,
      unrated: false,
      trialScore: ts,
      preStatScore: ps,
      tierExpectScore: tierExpect,
      ratio,
      roundHoneyBee: ts > ps && ts > tierExpect,
      roundBelowExpect: ts <= ps && ts <= tierExpect,
      performanceGrade: gradeFromRatio(ratio),
    });
  });
  return outcomes;
}

export function finalWinner(winners: TeamSide[]): TeamSide | undefined {
  if (!winners.length) return undefined;
  const blue = winners.filter((side) => side === "blue").length;
  const red = winners.length - blue;
  if (blue === red) return winners.at(-1);
  return blue > red ? "blue" : "red";
}

export function automaticMvp(session: Session): string | undefined {
  const totals = new Map<string, { kda: number; damage: number; games: number }>();
  session.rounds.forEach(({ trialResult }) => trialResult.playerStats.forEach((stat) => {
    const current = totals.get(stat.puuid) ?? { kda: 0, damage: 0, games: 0 };
    totals.set(stat.puuid, {
      kda: current.kda + stat.kda,
      damage: current.damage + stat.damageDealt,
      games: current.games + 1,
    });
  }));
  const values = [...totals.entries()];
  const maxKda = Math.max(1, ...values.map(([, value]) => value.kda / value.games));
  const maxDamage = Math.max(1, ...values.map(([, value]) => value.damage / value.games));
  return values.sort(([, a], [, b]) =>
    (b.kda / b.games / maxKda) * 0.55 + (b.damage / b.games / maxDamage) * 0.45 -
    ((a.kda / a.games / maxKda) * 0.55 + (a.damage / a.games / maxDamage) * 0.45)
  )[0]?.[0];
}

export function topHoneyBees(session: Session): string[] {
  const counts = session.participants.map((item) => ({
    puuid: item.puuid,
    count: item.honeyBeeHistory.filter(Boolean).length,
  }));
  const max = Math.max(0, ...counts.map(({ count }) => count));
  return max ? counts.filter(({ count }) => count === max).map(({ puuid }) => puuid) : [];
}

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((value) => (value - min) / (max - min));
}

function normalizeNullable(values: Array<number | null>): Array<number | null> {
  const present = values.filter((value): value is number => value !== null);
  if (!present.length) return values.map(() => null);
  const normalized = normalize(present);
  let index = 0;
  return values.map((value) => value === null ? null : normalized[index++]);
}

// 특정 인덱스 집합(domain)의 min-max로 전체 값을 정규화 (OP 제외 재정규화용).
function normalizeDomain(values: number[], domain: number[]): number[] {
  if (!domain.length) return normalize(values);
  const scope = domain.map((index) => values[index]);
  const min = Math.min(...scope);
  const max = Math.max(...scope);
  if (max === min) return values.map(() => 0.5);
  return values.map((value) => (value - min) / (max - min));
}

function normalizeNullableDomain(values: Array<number | null>, domain: number[]): Array<number | null> {
  const scope = domain.map((index) => values[index]).filter((value): value is number => value !== null);
  if (!scope.length) return values.map(() => null);
  const min = Math.min(...scope);
  const max = Math.max(...scope);
  if (max === min) return values.map((value) => value === null ? null : 0.5);
  return values.map((value) => value === null ? null : (value - min) / (max - min));
}

function averagePresent(values: Array<number | null>): number {
  const present = values.filter((value): value is number => value !== null);
  return present.length ? average(present) : 0.5;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function synergy(team: Participant[]): "high" | "medium" | "low" {
  const roles = new Set(team.map((item) => item.riotData.mainRole).filter(Boolean));
  return roles.size >= Math.min(5, team.length) ? "high" : roles.size >= Math.ceil(team.length / 2) ? "medium" : "low";
}

function teamChanges(previous: TeamProposal, blue: Participant[], red: Participant[]) {
  const before = new Map([
    ...previous.blueTeam.map(({ puuid }) => [puuid, "blue"] as const),
    ...previous.redTeam.map(({ puuid }) => [puuid, "red"] as const),
  ]);
  const movedBlue = blue.filter(({ puuid }) => before.get(puuid) === "red");
  const movedRed = red.filter(({ puuid }) => before.get(puuid) === "blue");
  return [...movedBlue.map((item, index) => ({
    outPuuid: movedRed[index]?.puuid ?? "",
    inPuuid: item.puuid,
    toTeam: "blue" as const,
    reason: "직전 판 결과를 반영해 팀 전력을 맞췄습니다.",
  })), ...movedRed.map((item, index) => ({
    outPuuid: movedBlue[index]?.puuid ?? "",
    inPuuid: item.puuid,
    toTeam: "red" as const,
    reason: "직전 판 결과를 반영해 팀 전력을 맞췄습니다.",
  }))];
}

function resetParticipant(item: Participant): Participant {
  return {
    ...item,
    currentLpValue: item.preLpValue,
    honeyBeeStreak: 0,
    honeyBeeBadge: "none",
    honeyBeeHistory: [],
    trialPerformanceByRound: undefined,
    personalScoreDeltaByRound: undefined,
  };
}

function mapCurrent(team: Participant[], current: Participant[]): Participant[] {
  const byId = new Map(current.map((item) => [item.puuid, item]));
  return team.map(({ puuid }) => byId.get(puuid)).filter(isParticipant);
}

// D-07 기대치 산출 불가 조건: 표본 부족·사전 스탯 결측·수동 티어.
function hasPreStats(item: Participant): boolean {
  return (
    (item.riotData.preMainRoleGames ?? 0) >= 3 &&
    item.riotData.preMainRoleKda != null &&
    item.riotData.preMainRoleDamage != null &&
    item.tierSource !== "manual"
  );
}

function gradeFromRatio(ratio: number): PerformanceGrade {
  if (ratio >= 1.5) return "OP";
  if (ratio >= 1.2) return "A";
  if (ratio >= 1) return "B";
  if (ratio >= 0.85) return "C";
  if (ratio >= 0.6) return "D";
  return "F";
}

function percentDelta(previous: number, next: number): number {
  return previous ? Math.round(((next - previous) / previous) * 100) : 0;
}

function isParticipant(value: Participant | undefined): value is Participant {
  return Boolean(value);
}
