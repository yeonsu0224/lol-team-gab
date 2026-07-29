import type { InternalTierBadge, TierSource } from "@/lib/types";
import type { RankedTier } from "@/lib/constants/lpTable";

export const LOL_TIER_VARIANT: Record<RankedTier, string> = {
  IRON: "lolTierIron",
  BRONZE: "lolTierBronze",
  SILVER: "lolTierSilver",
  GOLD: "lolTierGold",
  PLATINUM: "lolTierPlatinum",
  EMERALD: "lolTierEmerald",
  DIAMOND: "lolTierDiamond",
  MASTER: "lolTierMaster",
  GRANDMASTER: "lolTierGrandmaster",
  CHALLENGER: "lolTierChallenger",
};

export function getLolTierVariant(tier: string): string {
  return LOL_TIER_VARIANT[tier.toUpperCase() as RankedTier] ?? "lolTierIron";
}

export function getInternalTierVariant(badge: InternalTierBadge): string {
  if (badge === "OP") {
    return "opBadge";
  }
  return `internalTier${badge}`;
}

export const TIER_SOURCE_LABEL: Record<TierSource, string> = {
  solo: "솔로 랭크",
  flex: "자유 랭크",
  past_season: "지난 시즌",
  manual: "수동 입력",
};
