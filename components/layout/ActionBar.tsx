"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useT } from "@/lib/i18n/context";

/** 하단 고정 CTA. 스크롤 없이 주요 액션을 누를 수 있게 한다(D-22). */
export function ActionBar({ children, infoHref = "/scoring" }: { children: ReactNode; infoHref?: string }) {
  const t = useT();
  return (
    <div className="tg-action-bar" role="region" aria-label={t("actionBar.aria")}>
      <Link className="tg-action-bar__info" href={infoHref} aria-label={t("actionBar.scoring")} title={t("actionBar.scoring")}>
        i
      </Link>
      <div className="tg-action-bar__actions">{children}</div>
    </div>
  );
}
