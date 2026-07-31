"use client";

import { useT } from "@/lib/i18n/context";

export default function RiotNoticePage() {
  const t = useT();
  return (
    <main className="tg-page">
      <article className="tg-panel tg-legal">
        <h1>{t("riot.title")}</h1>
        <p>{t("riot.body")}</p>
      </article>
    </main>
  );
}
