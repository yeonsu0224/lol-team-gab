"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import {
  DONATION_BANK,
  DONATION_LINKS,
  DONATION_MESSAGE,
} from "@/lib/constants/donation";

import styles from "./DonationPanel.module.scss";

export function DonationPanel() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `${DONATION_BANK.bank} ${DONATION_BANK.account} (${DONATION_BANK.holder})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Panel tone="soft" className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.emoji} aria-hidden="true">
          ☕
        </span>
        <div>
          <h3 className={styles.title}>개발자 커피 사주기</h3>
          <p className={styles.message}>{DONATION_MESSAGE}</p>
        </div>
      </div>

      <div className={styles.account}>
        <span className={styles.accountText}>
          {DONATION_BANK.bank} {DONATION_BANK.account}
          <span className={styles.holder}> · {DONATION_BANK.holder}</span>
        </span>
        <Button size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? "복사됨" : "계좌 복사"}
        </Button>
      </div>

      <div className={styles.links}>
        {DONATION_LINKS.map((link) => (
          <a
            key={link.url}
            className={styles.link}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
    </Panel>
  );
}
