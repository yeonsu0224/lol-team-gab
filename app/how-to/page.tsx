"use client";

import { useT } from "@/lib/i18n/context";

export default function HowToPage() {
  const t = useT();
  return (
    <main className="tg-page">
      <article className="tg-panel tg-legal">
        <h1>{t("howTo.title")}</h1>
        <ol>
          <li>{t("howTo.step1")}</li>
          <li>{t("howTo.step2")}</li>
          <li>{t("howTo.step3")}</li>
        </ol>
        <p>{t("howTo.review")}</p>
        <p>{t("demo.unofficial")}</p>
      </article>
    </main>
  );
}
