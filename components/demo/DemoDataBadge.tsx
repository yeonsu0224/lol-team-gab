"use client";

import { useT } from "@/lib/i18n/context";

export function DemoDataBadge({ className = "" }: { className?: string }) {
  const t = useT();
  return <span className={`tg-chip tg-chip--demo ${className}`.trim()}>{t("demo.badge")}</span>;
}
