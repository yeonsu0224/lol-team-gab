import { SYNERGY_LABEL_KO } from "@/lib/constants/synergy";
import type {
  HoneyBeeBadge,
  MainRole,
  PerformanceGrade,
  SynergyGrade,
  TierDisplay,
  UnratedReason,
} from "@/lib/types";

export const ROLE_LABEL_KO: Record<MainRole, string> = {
  TOP: "탑",
  JUNGLE: "정글",
  MIDDLE: "미드",
  BOTTOM: "원딜",
  UTILITY: "서포터",
};

export const HONEY_BEE_LABEL_KO: Record<HoneyBeeBadge, string> = {
  none: "꿀벌 미달성",
  bee: "꿀벌",
  glitterBee: "반짝이는 꿀벌",
  rainbowBee: "무지개 꿀벌",
};

const UNRATED_REASON_KO: Record<UnratedReason, string> = {
  no_history: "최근 경기 기록이 없어",
  insufficient_sample: "주 라인 경기 수가 적어",
  missing_stats: "KDA·딜량 기록이 부족해",
  manual_tier: "수동 입력 티어만 있어",
};

export function roleReason(role: MainRole | null | undefined): string {
  if (!role) {
    return "주 라인 미확인";
  }
  return `주 라인 ${ROLE_LABEL_KO[role]}`;
}

export function tierReason(tier: TierDisplay, winRatePct?: number): string {
  const base = `현재 ${tier.label}`;
  if (typeof winRatePct === "number") {
    return `${base} · 최근 보정 승률 ${Math.round(winRatePct)}%`;
  }
  return base;
}

export function tierDiffReason(divisions: number): string {
  const rounded = Math.round(divisions * 10) / 10;
  if (rounded < 0.1) {
    return "두 팀 평균 티어가 거의 동일합니다";
  }
  return `두 팀 평균 티어가 약 ${rounded}구간 차이입니다`;
}

export function powerRatioReason(
  bluePowerPct: number,
  redPowerPct: number,
): string {
  return `전력 비율 블루 ${bluePowerPct}% · 레드 ${redPowerPct}%`;
}

export function synergyReason(
  grade: SynergyGrade,
  positionOverlap: number,
): string {
  const label = SYNERGY_LABEL_KO[grade];
  if (positionOverlap <= 0) {
    return `라인 겹침 없이 구성돼 시너지 ${label}`;
  }
  return `라인 ${positionOverlap}곳 겹쳐 시너지 ${label}`;
}

export function honeyBeeReason(streak: number, badge: HoneyBeeBadge): string {
  if (badge === "none") {
    return "이번 판은 기대치를 넘지 못했습니다";
  }
  return `${streak}판 연속 기대 이상 → ${HONEY_BEE_LABEL_KO[badge]}`;
}

export function performanceGradeReason(
  grade: PerformanceGrade,
): string {
  const messages: Record<PerformanceGrade, string> = {
    OP: "이번 판 KDA·딜량이 기대치를 압도했습니다 → OP 등급",
    A: "이번 판 성과가 기대치를 크게 웃돌았습니다 → A 등급",
    B: "이번 판 성과가 기대치를 넘었습니다 → B 등급",
    C: "이번 판 성과가 기대 수준이었습니다 → C 등급",
    D: "이번 판 성과가 기대에 살짝 못 미쳤습니다 → D 등급",
    F: "이번 판 성과가 기대에 크게 못 미쳤습니다 → F 등급",
  };
  return messages[grade];
}

/** Neutral copy for unrated players — must be distinct from an F grade. */
export function unratedReason(reason?: UnratedReason): string {
  const cause = reason ? UNRATED_REASON_KO[reason] : "기록이 부족해";
  return `${cause} 이번 판 평가는 생략했습니다`;
}

export function lpChangeReason(
  before: TierDisplay,
  after: TierDisplay,
): string {
  if (before.label === after.label) {
    return `${before.label} 유지`;
  }
  return `${before.label} → ${after.label}`;
}
