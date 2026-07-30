"use client";

import { useState } from "react";

import { DONATION } from "@/lib/constants/donation";
import styles from "./Shared.module.scss";

export function DonationPanel() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!DONATION.account) return;
    await navigator.clipboard.writeText(DONATION.account);
    setCopied(true);
  }

  return (
    <aside className={styles.donation}>
      <h2>개발자 커피 사주기</h2>
      <p>내전 운영에 도움이 됐다면 선택적으로 응원해 주세요.</p>
      <div className={styles.donationRow}>
        <span>{DONATION.bank}{DONATION.account ? ` · ${DONATION.account}` : ""}</span>
        {DONATION.account && <button type="button" onClick={() => void copy()}>{copied ? "복사됨" : "계좌 복사"}</button>}
        {DONATION.link && <a href={DONATION.link} target="_blank" rel="noreferrer">후원 링크</a>}
      </div>
    </aside>
  );
}
