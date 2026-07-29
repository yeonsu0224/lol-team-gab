import { PERFORMANCE_GRADE_THRESHOLDS } from "@/lib/constants/performanceGrade";
import type { PerformanceGrade } from "@/lib/types";
import { isPresent } from "@/lib/utils/normalize";

export interface PerformanceGradeInput {
  trialScore: number | null;
  preStatScore: number | null;
  tierExpectScore: number | null;
  unrated: boolean;
}

/**
 * F~OP grade from r = trialScore / expectScore, where
 * expectScore = (preStatScore + tierExpectScore) / 2 (spec D-11).
 * Display only. Returns `null` when unrated or any expectation is missing —
 * the expectation is never coerced to 0.
 */
export function computePerformanceGrade(
  input: PerformanceGradeInput,
): PerformanceGrade | null {
  if (
    input.unrated ||
    !isPresent(input.trialScore) ||
    !isPresent(input.preStatScore) ||
    !isPresent(input.tierExpectScore)
  ) {
    return null;
  }

  const expectScore = (input.preStatScore + input.tierExpectScore) / 2;
  if (expectScore <= 0) {
    return null;
  }

  const ratio = input.trialScore / expectScore;
  const match = PERFORMANCE_GRADE_THRESHOLDS.find(
    (threshold) => ratio >= threshold.min,
  );
  return match ? match.grade : "F";
}
