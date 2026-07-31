"use client";

import { useDemoStatus } from "@/lib/demo/useDemoStatus";
import { useT } from "@/lib/i18n/context";

export function DemoNoticeBanner() {
  const t = useT();
  const { demoMode } = useDemoStatus();
  if (!demoMode) return null;
  return (
    <aside className="tg-demo-banner" role="status">
      <span className="tg-chip tg-chip--demo">{t("demo.badge")}</span>
      <div className="tg-demo-banner__copy">
        <p>{t("demo.notice.koLine")}</p>
        <p>{t("demo.notice.enLine")}</p>
        <p className="tg-muted">{t("demo.unofficial")}</p>
      </div>
    </aside>
  );
}
