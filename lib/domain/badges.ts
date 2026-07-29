import type { InternalTierBadge } from "@/lib/types";

import { OP_THRESHOLD_MULTIPLIER } from "./personalScore";

export interface BadgeResult {
  isOp: boolean;
  badge: InternalTierBadge;
}

/**
 * OP + internal 1~4 tier badges (spec D-06). Display only — never used for
 * team assignment. OP ⇔ score ≥ sessionMean × 1.25; the remaining non-OP
 * players are split into quartiles (1 strongest … 4 weakest).
 */
export function computeBadges(scores: number[]): BadgeResult[] {
  if (scores.length === 0) {
    return [];
  }

  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const opThreshold = mean * OP_THRESHOLD_MULTIPLIER;
  const opFlags = scores.map((score) => score >= opThreshold);

  const nonOpIndexes = scores
    .map((_, index) => index)
    .filter((index) => !opFlags[index])
    .sort((a, b) => scores[b] - scores[a]);

  const quartile = new Map<number, 1 | 2 | 3 | 4>();
  const total = nonOpIndexes.length;
  nonOpIndexes.forEach((originalIndex, rank) => {
    const band = total > 0 ? Math.floor((rank / total) * 4) : 0;
    quartile.set(originalIndex, (Math.min(3, band) + 1) as 1 | 2 | 3 | 4);
  });

  return scores.map((_, index) => {
    if (opFlags[index]) {
      return { isOp: true, badge: "OP" };
    }
    return { isOp: false, badge: quartile.get(index) ?? 4 };
  });
}
