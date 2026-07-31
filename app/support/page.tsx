"use client";

import { SUPPORT_EMAIL } from "@/lib/constants/support";
import { useT } from "@/lib/i18n/context";

export default function SupportPage() {
  const t = useT();
  return (
    <main className="tg-page">
      <article className="tg-panel tg-legal">
        <h1>{t("support.title")}</h1>
        <p>{t("support.body")}</p>
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </article>
    </main>
  );
}
