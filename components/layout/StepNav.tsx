"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/messages/ko";

const STEPS: Array<[string, MessageKey]> = [
  ["players", "steps.players"],
  ["team", "steps.team"],
  ["trial", "steps.trial"],
  ["rebalance", "steps.rebalance"],
  ["finish", "steps.finish"],
];

export function StepNav({ sessionId, active }: { sessionId: string; active: string }) {
  const t = useT();
  return (
    <nav className="tg-row" aria-label={t("steps.aria")}>
      {STEPS.map(([path, labelKey], index) => (
        <Link
          key={path}
          className={`tg-chip ${active === path ? "is-gold" : ""}`}
          href={`/session/${sessionId}/${path}`}
        >
          {index + 1}. {t(labelKey)}
        </Link>
      ))}
    </nav>
  );
}
