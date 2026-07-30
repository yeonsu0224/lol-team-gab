import type { PerformanceGrade } from "@/lib/types";

export const PERFORMANCE_GRADE_THRESHOLDS: ReadonlyArray<{
  grade: PerformanceGrade;
  minimumRatio: number;
}> = [
  { grade: "OP", minimumRatio: 1.5 },
  { grade: "A", minimumRatio: 1.2 },
  { grade: "B", minimumRatio: 1 },
  { grade: "C", minimumRatio: 0.85 },
  { grade: "D", minimumRatio: 0.6 },
  { grade: "F", minimumRatio: Number.NEGATIVE_INFINITY },
];
