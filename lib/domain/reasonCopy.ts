import type { HoneyBeeBadge, PerformanceGrade } from "@/lib/types";

const BEE_COPY: Record<HoneyBeeBadge, string> = {
  none: "이번 판 기대 이상 스트릭 없음",
  bee: "1판 연속 기대 이상 → 꿀벌",
  glitterBee: "2판 연속 기대 이상 → 반짝이는 꿀벌",
  rainbowBee: "3판 연속 기대 이상 → 무지개 꿀벌",
};

export function honeyBeeReason(badge: HoneyBeeBadge, unrated = false): string {
  return unrated ? "기록이 부족해 이번 판 평가는 생략했습니다." : BEE_COPY[badge];
}

export function performanceReason(
  grade: PerformanceGrade | null,
  ratio: number | null,
): string {
  if (!grade || ratio == null) return "기록이 부족해 성과 등급을 매기지 않았습니다.";
  return `이번 판 딜·KDA가 기대치의 ${ratio.toFixed(1)}배 → ${grade} 등급`;
}

export function balanceReason(bluePowerPct: number, redPowerPct: number): string {
  const difference = Math.abs(bluePowerPct - redPowerPct);
  return difference <= 4
    ? `블루 ${bluePowerPct}% · 레드 ${redPowerPct}%로 전력이 비슷합니다.`
    : `블루 ${bluePowerPct}% · 레드 ${redPowerPct}%로 전력 차이를 확인해 주세요.`;
}
