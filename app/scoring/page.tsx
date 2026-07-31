"use client";

import { useT } from "@/lib/i18n/context";

export default function ScoringPage() {
  const t = useT();
  return (
    <main className="tg-page tg-stack">
      <section className="tg-panel tg-stack">
        <h1>{t("scoring.title")}</h1>
        <p className="tg-muted">{t("scoring.intro")}</p>
      </section>
      <section className="tg-panel tg-stack">
        <h2>{t("scoring.lpTitle")}</h2>
        <p>{t("scoring.lpBody")}</p>
      </section>
      <section className="tg-panel tg-stack">
        <h2>{t("scoring.scoreTitle")}</h2>
        <p>{t("scoring.scoreBody")}</p>
      </section>
      <section className="tg-panel tg-stack">
        <h2>{t("scoring.beeTitle")}</h2>
        <p>{t("scoring.beeBody")}</p>
      </section>
      <p className="tg-muted">{t("demo.unofficial")}</p>
    </main>
  );
}
