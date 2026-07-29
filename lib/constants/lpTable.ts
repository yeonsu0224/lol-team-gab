import type { TierDisplay } from "@/lib/types";

export const TIER_BASE = {
  IRON: 0,
  BRONZE: 400,
  SILVER: 800,
  GOLD: 1200,
  PLATINUM: 1600,
  EMERALD: 2000,
  DIAMOND: 2400,
  MASTER: 2800,
  GRANDMASTER: 3100,
  CHALLENGER: 3400,
} as const;

export type RankedTier = keyof typeof TIER_BASE;

// Apex tiers (Master+) do not use divisions; treat them as a single rank I.
const APEX_TIERS: ReadonlySet<RankedTier> = new Set([
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
]);

const RANK_INDEX: Record<string, number> = {
  I: 0,
  II: 1,
  III: 2,
  IV: 3,
};

const TIER_ORDER = Object.keys(TIER_BASE) as RankedTier[];

const TIER_LABEL_KO: Record<RankedTier, string> = {
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

const RANK_LABEL_KO = ["1", "2", "3", "4"];

export function isRankedTier(tier: string): tier is RankedTier {
  return tier.toUpperCase() in TIER_BASE;
}

export function normalizeTier(tier: string): RankedTier | null {
  const upper = tier.toUpperCase();
  return isRankedTier(upper) ? (upper as RankedTier) : null;
}

/**
 * Converts a tier/rank/lp triple into the internal LP value used for balancing.
 * `lpValue = tierBase + (4 - rankIndex) × 100 + lp`.
 */
export function tierToLpValue(
  tier: string,
  rank: string,
  lp: number,
): number {
  const normalized = normalizeTier(tier);
  if (!normalized) {
    throw new Error(`Unknown tier: ${tier}`);
  }

  const rankIndex = APEX_TIERS.has(normalized)
    ? 0
    : (RANK_INDEX[rank.toUpperCase()] ?? 0);

  return TIER_BASE[normalized] + (4 - rankIndex) * 100 + lp;
}

interface LpBreakdown {
  tier: RankedTier;
  rank: string;
  lp: number;
}

function lpValueToBreakdown(lpValue: number): LpBreakdown {
  const clamped = Math.max(0, lpValue);
  let tier: RankedTier = TIER_ORDER[0];
  for (const candidate of TIER_ORDER) {
    if (clamped >= TIER_BASE[candidate]) {
      tier = candidate;
    }
  }

  const offset = clamped - TIER_BASE[tier];

  if (APEX_TIERS.has(tier)) {
    return { tier, rank: "I", lp: Math.round(Math.max(0, offset - 400)) };
  }

  // Forward mapping puts non-apex offsets in [100, 500):
  // multiplier m = 4 - rankIndex ∈ {1..4}, then lp = offset - m × 100.
  const multiplier = Math.max(1, Math.min(4, Math.floor(offset / 100)));
  const rankIndex = 4 - multiplier;
  const lp = Math.round(offset - multiplier * 100);
  return { tier, rank: ["I", "II", "III", "IV"][rankIndex], lp };
}

export function lpValueToTierDisplay(lpValue: number): TierDisplay {
  const { tier, rank, lp } = lpValueToBreakdown(lpValue);
  return {
    tier,
    rank,
    lp,
    label: formatTierLabel(tier, rank, lp),
  };
}

export function toTierDisplay(
  tier: string,
  rank: string,
  lp: number,
): TierDisplay {
  const normalized = normalizeTier(tier);
  if (!normalized) {
    throw new Error(`Unknown tier: ${tier}`);
  }
  const resolvedRank = APEX_TIERS.has(normalized) ? "I" : rank.toUpperCase();
  return {
    tier: normalized,
    rank: resolvedRank,
    lp,
    label: formatTierLabel(normalized, resolvedRank, lp),
  };
}

export function formatTierLabel(
  tier: RankedTier,
  rank: string,
  lp: number,
): string {
  const tierLabel = TIER_LABEL_KO[tier];
  if (APEX_TIERS.has(tier)) {
    return `${tierLabel} · ${lp}LP`;
  }
  const divisionLabel = RANK_LABEL_KO[RANK_INDEX[rank.toUpperCase()] ?? 0];
  return `${tierLabel} ${divisionLabel} · ${lp}LP`;
}

/** Difference between two LP values expressed in tier divisions (100 LP each). */
export function lpDivisionsBetween(a: number, b: number): number {
  return Math.abs(a - b) / 100;
}
