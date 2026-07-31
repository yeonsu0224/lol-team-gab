"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale, useT } from "@/lib/i18n/context";

export function TopBanner() {
  const pathname = usePathname();
  const showDashboard = pathname !== "/" && pathname !== "/dashboard";
  const t = useT();
  const { locale, setLocale } = useLocale();

  return (
    <header className="tg-topbar">
      <div className="tg-topbar__left">
        {showDashboard && (
          <Link className="tg-button" href="/dashboard">
            {t("nav.dashboard")}
          </Link>
        )}
      </div>
      <Link className="tg-topbar__logo" href="/" aria-label={t("nav.homeAria")}>
        {t("nav.brand")}
      </Link>
      <div className="tg-topbar__right">
        <div className="tg-lang" role="group" aria-label="Language">
          <button
            type="button"
            className={`tg-lang__btn ${locale === "ko" ? "is-active" : ""}`}
            onClick={() => setLocale("ko")}
          >
            KO
          </button>
          <button
            type="button"
            className={`tg-lang__btn ${locale === "en" ? "is-active" : ""}`}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
