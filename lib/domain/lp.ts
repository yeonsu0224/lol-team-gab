import {
  RANKED_TIERS,
  tierNameFor,
  type RankedTier,
} from "@/lib/constants/lpTable";
import type { TierDisplay } from "@/lib/types";

const RANKS = ["IV", "III", "II", "I"] as const;

export type TierLocale = "ko" | "en";

export function tierToLpValue(tier: string, rank = "IV", lp = 0): number {
  const tierIndex = RANKED_TIERS.indexOf(tier.toUpperCase() as RankedTier);
  if (tierIndex < 0) return 0;
  if (tierIndex >= 7) return tierIndex * 400 + 100 + Math.max(0, lp);
  const rankIndex = RANKS.indexOf(rank.toUpperCase() as (typeof RANKS)[number]);
  return tierIndex * 400 + (Math.max(0, rankIndex) + 1) * 100 + Math.max(0, Math.min(99, lp));
}

export function lpValueToTier(value: number, locale: TierLocale = "ko"): TierDisplay {
  const safe = Math.max(100, Math.round(value));
  const tierIndex = Math.min(RANKED_TIERS.length - 1, Math.floor((safe - 100) / 400));
  const tier = RANKED_TIERS[tierIndex];
  if (tierIndex >= 7) {
    const lp = safe - tierIndex * 400 - 100;
    return { tier, rank: "", lp, label: formatTierParts(tier, "", lp, locale) };
  }
  const within = safe - tierIndex * 400 - 100;
  const rank = RANKS[Math.min(3, Math.floor(within / 100))];
  const lp = within % 100;
  return { tier, rank, lp, label: formatTierParts(tier, rank, lp, locale) };
}

/** Format an existing tier/rank/lp for the active UI locale (ignores stored Korean labels). */
export function formatTierDisplay(
  display: Pick<TierDisplay, "tier" | "rank" | "lp"> | null | undefined,
  locale: TierLocale = "ko",
): string {
  if (!display?.tier) return "";
  return formatTierParts(display.tier, display.rank, display.lp, locale);
}

function formatTierParts(tier: string, rank: string, lp: number, locale: TierLocale) {
  const name = tierNameFor(tier, locale);
  const upper = tier.toUpperCase() as RankedTier;
  const isApex = RANKED_TIERS.indexOf(upper) >= 7 || !rank;
  if (isApex && RANKED_TIERS.indexOf(upper) >= 7) {
    return `${name} ${lp}LP`;
  }
  if (!rank) return `${name} ${lp}LP`;
  return `${name} ${romanToNumber(rank)} · ${lp}LP`;
}

function romanToNumber(rank: string): number {
  return ({ I: 1, II: 2, III: 3, IV: 4 } as Record<string, number>)[rank] ?? 4;
}
