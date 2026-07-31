"use client";

import Image from "next/image";
import { useState } from "react";

import { DONATION } from "@/lib/constants/donation";
import { useT } from "@/lib/i18n/context";

export function DonationPanel() {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!DONATION.account) return;
    await navigator.clipboard.writeText(DONATION.account);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="tg-panel tg-donation">
      <div className="tg-stack">
        <h2>{t("donation.title")} ☕</h2>
        <p className="tg-muted">{t("donation.body")}</p>
        {DONATION.account && (
          <div className="tg-row">
            <code>{DONATION.account}</code>
            {DONATION.holder && <span className="tg-muted">{DONATION.holder}</span>}
            <button className="tg-button" type="button" onClick={() => void copy()}>
              {copied ? t("donation.copied") : t("donation.copy")}
            </button>
          </div>
        )}
      </div>
      <figure className="tg-donation__qr">
        <Image src={DONATION.qrImage} alt={DONATION.qrLabel} width={168} height={168} />
        <figcaption className="tg-muted">{t("donation.toss")}</figcaption>
      </figure>
    </section>
  );
}
