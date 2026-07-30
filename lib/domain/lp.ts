import {
  RANK_INDEX,
  TIER_BASE,
  TIER_LABEL,
  type RankedTier,
} from "../constants/lpTable.ts";
import type { TierDisplay } from "../types/session.ts";

const TIERS = Object.keys(TIER_BASE) as RankedTier[];
const DIVISIONAL = new Set<RankedTier>([
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
]);
const RANKS = ["I", "II", "III", "IV"] as const;

export function tierToLpValue(tier: RankedTier, rank: string, lp: number): number {
  const safeLp = Math.max(0, Math.round(lp));
  if (!DIVISIONAL.has(tier)) return TIER_BASE[tier] + safeLp;
  const rankIndex = RANK_INDEX[rank as keyof typeof RANK_INDEX];
  if (rankIndex === undefined) throw new Error(`지원하지 않는 랭크 구간입니다: ${rank}`);
  return TIER_BASE[tier] + (4 - rankIndex) * 100 + safeLp;
}

export function lpValueToTier(value: number): TierDisplay {
  const rounded = Math.max(0, Math.round(value));
  const eliteTier = [...TIERS]
    .reverse()
    .find((candidate) => !DIVISIONAL.has(candidate) && rounded >= TIER_BASE[candidate]);
  const tier =
    eliteTier ??
    [...TIERS]
      .filter((candidate) => DIVISIONAL.has(candidate))
      .reverse()
      .find((candidate) => rounded >= TIER_BASE[candidate] + 100) ??
    "IRON";
  const offset = rounded - TIER_BASE[tier];

  if (!DIVISIONAL.has(tier)) {
    return {
      tier,
      rank: "I",
      lp: offset,
      label: `${TIER_LABEL[tier]}${offset ? ` · ${offset}LP` : ""}`,
    };
  }

  const boundedOffset = Math.min(Math.max(offset, 100), 499);
  const divisionFromBottom = Math.min(4, Math.floor(boundedOffset / 100));
  const rank = RANKS[4 - divisionFromBottom];
  const lp = boundedOffset % 100;
  return {
    tier,
    rank,
    lp,
    label: `${TIER_LABEL[tier]} ${romanToNumber(rank)} · ${lp}LP`,
  };
}

function romanToNumber(rank: (typeof RANKS)[number]): number {
  return ({ I: 1, II: 2, III: 3, IV: 4 } as const)[rank];
}
