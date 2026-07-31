"use client";

import Link from "next/link";

import { SUPPORT_EMAIL } from "@/lib/constants/support";
import { useT } from "@/lib/i18n/context";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="tg-footer">
      <nav className="tg-footer__links" aria-label="Site">
        <Link href="/about">{t("footer.about")}</Link>
        <Link href="/how-to">{t("footer.howTo")}</Link>
        <Link href="/terms">{t("footer.terms")}</Link>
        <Link href="/privacy">{t("footer.privacy")}</Link>
        <Link href="/support">{t("footer.support")}</Link>
        <Link href="/riot">{t("footer.riot")}</Link>
      </nav>
      <p className="tg-footer__disclaimer">{t("demo.unofficial")}</p>
      <p className="tg-muted">
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </footer>
  );
}
