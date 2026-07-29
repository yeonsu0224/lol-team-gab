import { HONEY_BEE_LABEL_KO } from "@/lib/domain/reasonCopy";
import type { HoneyBeeBadge, PerformanceGrade } from "@/lib/types";

import styles from "./StatusBadge.module.scss";

/** Performance grade F~OP (spec D-11). Distinct scale from the unrated badge. */
export function GradeBadge({ grade }: { grade: PerformanceGrade }) {
  return (
    <span className={`${styles.badge} ${styles[`grade${grade}`]}`}>
      성과 {grade}
    </span>
  );
}

/**
 * Unrated (`기록 부족`) badge — spec D-07 requires this be visually distinct
 * from an F grade or a below-expectation mark (neutral, not a failure signal).
 */
export function UnratedBadge() {
  return (
    <span className={`${styles.badge} ${styles.unrated}`}>
      <span aria-hidden="true">ⓘ</span> 기록 부족
    </span>
  );
}

export function HoneyBeeStatusBadge({ badge }: { badge: HoneyBeeBadge }) {
  if (badge === "none") {
    return null;
  }
  return (
    <span className={`${styles.badge} ${styles[badge]}`}>
      <span aria-hidden="true">🐝</span> {HONEY_BEE_LABEL_KO[badge]}
    </span>
  );
}

/** Below-expectation mark (spec D-07 roundBelowExpect). */
export function BelowExpectBadge() {
  return <span className={`${styles.badge} ${styles.belowExpect}`}>기대 이하</span>;
}
