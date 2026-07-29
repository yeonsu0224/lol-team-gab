import type { PerformanceGrade } from "@/lib/types";

/**
 * F~OP performance grade thresholds on the ratio r = trialScore / expectScore
 * (spec D-11). Ordered from highest to lowest; the first matching `min` wins.
 */
export const PERFORMANCE_GRADE_THRESHOLDS: ReadonlyArray<{
  grade: PerformanceGrade;
  min: number;
}> = [
  { grade: "OP", min: 1.5 },
  { grade: "A", min: 1.2 },
  { grade: "B", min: 1.0 },
  { grade: "C", min: 0.85 },
  { grade: "D", min: 0.6 },
  { grade: "F", min: Number.NEGATIVE_INFINITY },
];
