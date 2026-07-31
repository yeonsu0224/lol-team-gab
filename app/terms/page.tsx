"use client";

import { useT } from "@/lib/i18n/context";

export default function TermsPage() {
  const t = useT();
  return (
    <main className="tg-page">
      <article className="tg-panel tg-legal">
        <h1>{t("terms.title")}</h1>
        <p>{t("terms.body")}</p>
        <p>{t("demo.unofficial")}</p>
      </article>
    </main>
  );
}
