"use client";

import { useT } from "@/lib/i18n/context";

/** @deprecated D-22: 화면 아코디언 대신 /scoring + ActionBar i 링크를 사용한다. */
export function ReasonPanel({ title, reasons }: { title?: string; reasons: string[] }) {
  const t = useT();
  return (
    <p className="tg-sr-only">
      {title ?? t("reason.defaultTitle")}: {reasons.join(" ")}
    </p>
  );
}
