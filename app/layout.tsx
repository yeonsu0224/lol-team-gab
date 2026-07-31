import type { Metadata } from "next";

import { DemoNoticeBanner } from "@/components/demo/DemoNoticeBanner";
import { SideBanner } from "@/components/layout/SideBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopBanner } from "@/components/layout/TopBanner";
import { AuroraBackground } from "@/components/motion/AuroraBackground";
import { LocaleProvider } from "@/lib/i18n/context";
import "./globals.scss";

export const metadata: Metadata = {
  title: "내전 총무 / Custom Game Steward",
  description: "LoL 내전 팀 편성과 시험 판 분석을 돕는 비공식 도구 / Unofficial LoL custom-game balance tool",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <LocaleProvider>
          <AuroraBackground />
          <TopBanner />
          <div className="tg-shell__body">
            <DemoNoticeBanner />
            <SideBanner />
            {children}
            <SiteFooter />
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
