"use client";

import { formatTierDisplay, lpValueToTier } from "@/lib/domain/lp";
import { useLocale } from "@/lib/i18n/context";
import type { TierDisplay } from "@/lib/types";

export function useTierLabel() {
  const { locale } = useLocale();
  return {
    locale,
    formatTier: (display: Pick<TierDisplay, "tier" | "rank" | "lp"> | null | undefined) =>
      formatTierDisplay(display, locale),
    fromLp: (value: number) => lpValueToTier(value, locale),
  };
}
