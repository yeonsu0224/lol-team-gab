import type { SynergyGrade } from "@/lib/types";

/**
 * Synergy thresholds (spec D-04 / implementation-plan). Display-only grade
 * from position overlap and mastery (top champion) overlap within a team.
 */
export const SYNERGY_THRESHOLDS = {
  high: { maxPositionOverlap: 1, maxMasteryOverlap: 2 },
  medium: { maxPositionOverlap: 2 },
  lowPositionOverlap: 3,
  lowMasteryOverlap: 4,
} as const;

export const SYNERGY_LABEL_KO: Record<SynergyGrade, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};
