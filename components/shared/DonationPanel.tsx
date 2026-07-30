"use client";

import Image from "next/image";
import { useState } from "react";

import { DONATION } from "@/lib/constants/donation";

export function DonationPanel() {
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
        <h2>개발자 커피 사주기 ☕</h2>
        <p className="tg-muted">
          재미있게 사용하셨다면 응원만으로도 감사합니다. 토스 앱으로 QR을 스캔하면 바로 후원할 수 있어요.
        </p>
        {DONATION.account && (
          <div className="tg-row">
            <code>{DONATION.account}</code>
            {DONATION.holder && <span className="tg-muted">{DONATION.holder}</span>}
            <button className="tg-button" type="button" onClick={() => void copy()}>
              {copied ? "복사됨" : "계좌 복사"}
            </button>
          </div>
        )}
      </div>
      <figure className="tg-donation__qr">
        <Image src={DONATION.qrImage} alt={DONATION.qrLabel} width={168} height={168} />
        <figcaption className="tg-muted">토스로 후원하기</figcaption>
      </figure>
    </section>
  );
}
