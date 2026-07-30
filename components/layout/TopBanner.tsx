"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopBanner() {
  const pathname = usePathname();
  const showDashboard = pathname !== "/" && pathname !== "/dashboard";

  return (
    <header className="tg-topbar">
      <div className="tg-topbar__left">
        {showDashboard && (
          <Link className="tg-button" href="/dashboard">
            ← 대시보드
          </Link>
        )}
      </div>
      <Link className="tg-topbar__logo" href="/" aria-label="내전 총무 홈">
        내전 총무
      </Link>
      <div aria-hidden />
    </header>
  );
}
