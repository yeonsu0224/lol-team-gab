"use client";

import Link from "next/link";

import { useDemoStatus } from "@/lib/demo/useDemoStatus";
import { useT } from "@/lib/i18n/context";
import { DemoDataBadge } from "@/components/demo/DemoDataBadge";

export default function LandingPage() {
  const t = useT();
  const { demoMode } = useDemoStatus();
  const features = [
    ["landing.f1.title", "landing.f1.body"],
    ["landing.f2.title", "landing.f2.body"],
    ["landing.f3.title", "landing.f3.body"],
    ["landing.f4.title", "landing.f4.body"],
  ] as const;

  return (
    <main className="tg-page">
      <section className="tg-hero">
        <span className="tg-chip is-gold">{t("landing.chip")}</span>
        {demoMode && <DemoDataBadge />}
        <h1 style={{ whiteSpace: "pre-line" }}>{t("landing.title")}</h1>
        <p>{t("landing.body")}</p>
        <div className="tg-row" style={{ justifyContent: "center" }}>
          <Link className="tg-button tg-button--primary" href="/dashboard">{t("landing.cta")}</Link>
          <a className="tg-button" href="#features">{t("landing.features")}</a>
        </div>
      </section>
      <section id="features" className="tg-grid tg-grid--auto">
        {features.map(([title, body]) => (
          <article className="tg-panel" key={title}>
            <h2>{t(title)}</h2>
            <p className="tg-muted">{t(body)}</p>
          </article>
        ))}
      </section>
      <section className="tg-panel tg-legal" style={{ marginTop: 24 }}>
        <p>{t("landing.review")}</p>
        <p className="tg-muted">{t("demo.unofficial")}</p>
      </section>
    </main>
  );
}
