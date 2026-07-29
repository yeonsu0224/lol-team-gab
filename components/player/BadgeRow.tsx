import type { InternalTierBadge, TierDisplay, TierSource } from "@/lib/types";
import {
  TIER_SOURCE_LABEL,
  getInternalTierVariant,
  getLolTierVariant,
} from "@/lib/ui/badgeClassNames";

import styles from "./BadgeRow.module.scss";

interface BadgeRowProps {
  tier: TierDisplay;
  internalBadge: InternalTierBadge;
  isOp: boolean;
  tierSource: TierSource;
}

export function BadgeRow({
  tier,
  internalBadge,
  isOp,
  tierSource,
}: BadgeRowProps) {
  return (
    <div className={styles.row}>
      <span className={`${styles.badge} ${styles[getLolTierVariant(tier.tier)]}`}>
        {tier.label}
      </span>
      {isOp ? (
        <span className={`${styles.badge} ${styles.opBadge}`}>OP</span>
      ) : (
        <span
          className={`${styles.badge} ${styles[getInternalTierVariant(internalBadge)]}`}
        >
          내부 {internalBadge}티어
        </span>
      )}
      <span className={`${styles.badge} ${styles.sourceBadge}`}>
        {TIER_SOURCE_LABEL[tierSource]}
      </span>
    </div>
  );
}
