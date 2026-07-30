import { PERFORMANCE_GRADE_THRESHOLDS } from "../constants/performanceGrade.ts";
import type { PerformanceGrade } from "../types/session.ts";

export interface PerformanceGradeResult {
  grade: PerformanceGrade | null;
  ratio: number | null;
  expectScore: number | null;
}

export function calculatePerformanceGrade(input: {
  trialScore: number | null;
  preStatScore: number | null;
  tierExpectScore: number | null;
  unrated: boolean;
}): PerformanceGradeResult {
  const { trialScore, preStatScore, tierExpectScore, unrated } = input;
  if (
    unrated ||
    trialScore == null ||
    preStatScore == null ||
    tierExpectScore == null
  ) {
    return { grade: null, ratio: null, expectScore: null };
  }
  const expectScore = (preStatScore + tierExpectScore) / 2;
  if (expectScore <= 0) return { grade: null, ratio: null, expectScore };
  const ratio = trialScore / expectScore;
  const grade =
    PERFORMANCE_GRADE_THRESHOLDS.find(({ minimumRatio }) => ratio >= minimumRatio)?.grade ??
    "F";
  return { grade, ratio, expectScore };
}
