"use client";

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
    <section className="tg-panel">
      <h2>개발자 커피 사주기 ☕</h2>
      <p className="tg-muted">재미있게 사용하셨다면 응원만으로도 감사합니다.</p>
      {DONATION.account ? (
        <div className="tg-row">
          <code>{DONATION.account}</code>
          {DONATION.holder && <span className="tg-muted">{DONATION.holder}</span>}
          <button className="tg-button" type="button" onClick={() => void copy()}>{copied ? "복사됨" : "계좌 복사"}</button>
        </div>
      ) : <p className="tg-muted">후원 계좌는 환경 변수로 설정할 수 있습니다.</p>}
    </section>
  );
}
