"use client";

import { useT } from "@/lib/i18n/context";

export default function PrivacyPage() {
  const t = useT();
  return (
    <main className="tg-page">
      <article className="tg-panel tg-legal">
        <h1>{t("privacy.title")}</h1>
        <p>{t("privacy.body")}</p>
        <p>{t("demo.unofficial")}</p>
      </article>
    </main>
  );
}
