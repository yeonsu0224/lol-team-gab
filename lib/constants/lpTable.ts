export const RANKED_TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

export type RankedTier = (typeof RANKED_TIERS)[number];

export const TIER_LABEL_KO: Record<RankedTier, string> = {
  IRON: "아이언",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  EMERALD: "에메랄드",
  DIAMOND: "다이아몬드",
  MASTER: "마스터",
  GRANDMASTER: "그랜드마스터",
  CHALLENGER: "챌린저",
};

export const TIER_LABEL_EN: Record<RankedTier, string> = {
  IRON: "Iron",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  EMERALD: "Emerald",
  DIAMOND: "Diamond",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};

/** @deprecated Prefer TIER_LABEL_KO / tierLabelFor(locale). Kept for existing imports. */
export const TIER_LABEL = TIER_LABEL_KO;

export function tierNameFor(tier: string, locale: "ko" | "en" = "ko") {
  const key = tier.toUpperCase() as RankedTier;
  const table = locale === "en" ? TIER_LABEL_EN : TIER_LABEL_KO;
  return table[key] ?? tier;
}
