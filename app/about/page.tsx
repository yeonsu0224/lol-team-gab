"use client";

import { useT } from "@/lib/i18n/context";

export default function AboutPage() {
  const t = useT();
  return (
    <main className="tg-page">
      <article className="tg-panel tg-legal">
        <h1>{t("about.title")}</h1>
        <p>{t("about.body")}</p>
        <p>{t("demo.unofficial")}</p>
      </article>
    </main>
  );
}
