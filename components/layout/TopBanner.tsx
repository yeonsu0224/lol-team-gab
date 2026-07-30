"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BackLink } from "./BackLink";
import styles from "./TopBanner.module.scss";

export function TopBanner() {
  const pathname = usePathname();
  // 랜딩·대시보드에서는 같은 곳으로 가는 링크라 숨긴다.
  const showDashboardLink = pathname !== "/" && pathname !== "/dashboard";

  return (
    <header className={styles.banner}>
      <div className={styles.slot}>{showDashboardLink && <BackLink />}</div>
      <Link className={styles.logo} href="/" aria-label="내전 총무 홈">내전 총무</Link>
      <div className={styles.slot} aria-hidden />
    </header>
  );
}
