import { SYNERGY_THRESHOLDS } from "@/lib/constants/synergy";
import type { MainRole, SynergyGrade } from "@/lib/types";

export interface SynergyMember {
  mainRole?: MainRole | null;
  topChampions: number[];
}

export interface SynergyResult {
  grade: SynergyGrade;
  positionOverlap: number;
  masteryOverlap: number;
}

/** Number of role slots beyond the first for each shared role. */
export function countPositionOverlap(members: SynergyMember[]): number {
  const counts = new Map<MainRole, number>();
  for (const member of members) {
    if (member.mainRole) {
      counts.set(member.mainRole, (counts.get(member.mainRole) ?? 0) + 1);
    }
  }
  let overlap = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      overlap += count - 1;
    }
  }
  return overlap;
}

/** Number of duplicated top-champion mentions across the team. */
export function countMasteryOverlap(members: SynergyMember[]): number {
  const counts = new Map<number, number>();
  for (const member of members) {
    for (const championId of member.topChampions) {
      counts.set(championId, (counts.get(championId) ?? 0) + 1);
    }
  }
  let overlap = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      overlap += count - 1;
    }
  }
  return overlap;
}

export function computeSynergy(members: SynergyMember[]): SynergyResult {
  const positionOverlap = countPositionOverlap(members);
  const masteryOverlap = countMasteryOverlap(members);

  let grade: SynergyGrade;
  if (
    positionOverlap >= SYNERGY_THRESHOLDS.lowPositionOverlap ||
    masteryOverlap >= SYNERGY_THRESHOLDS.lowMasteryOverlap
  ) {
    grade = "low";
  } else if (
    positionOverlap <= SYNERGY_THRESHOLDS.high.maxPositionOverlap &&
    masteryOverlap <= SYNERGY_THRESHOLDS.high.maxMasteryOverlap
  ) {
    grade = "high";
  } else {
    grade = "medium";
  }

  return { grade, positionOverlap, masteryOverlap };
}
