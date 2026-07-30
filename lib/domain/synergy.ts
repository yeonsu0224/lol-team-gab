import { SYNERGY_THRESHOLDS } from "@/lib/constants/synergy";
import type { MainRole } from "@/lib/types";

export interface SynergyPlayer {
  puuid: string;
  mainRole?: MainRole;
  topChampions: ReadonlyArray<number>;
}

export interface SynergyResult {
  grade: "high" | "medium" | "low";
  roleOverlap: number;
  championOverlap: number;
  reasons: string[];
}

export function calculateSynergy(team: ReadonlyArray<SynergyPlayer>): SynergyResult {
  const roleOverlap = duplicateCount(team.map(({ mainRole }) => mainRole).filter(Boolean));
  const championOverlap = duplicateCount(team.flatMap(({ topChampions }) => topChampions));
  const grade =
    roleOverlap >= SYNERGY_THRESHOLDS.low.minRoleOverlap ||
    championOverlap >= SYNERGY_THRESHOLDS.low.minChampionOverlap
      ? "low"
      : roleOverlap <= SYNERGY_THRESHOLDS.high.maxRoleOverlap &&
          championOverlap <= SYNERGY_THRESHOLDS.high.maxChampionOverlap
        ? "high"
        : "medium";
  const reasons: string[] = [];
  reasons.push(roleOverlap === 0 ? "주 포지션이 겹치지 않음" : `주 포지션 겹침 ${roleOverlap}건`);
  reasons.push(
    championOverlap === 0 ? "모스트 챔피언이 겹치지 않음" : `모스트 챔피언 겹침 ${championOverlap}건`,
  );
  return { grade, roleOverlap, championOverlap, reasons };
}

function duplicateCount<T>(values: ReadonlyArray<T>): number {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}
