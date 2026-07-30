import type { Metadata } from "next";

import { SideBanner } from "@/components/layout/SideBanner";
import { TopBanner } from "@/components/layout/TopBanner";
import { AuroraBackground } from "@/components/motion/AuroraBackground";
import "./globals.scss";

export const metadata: Metadata = {
  title: "내전 총무",
  description: "LoL 내전 팀 편성과 시험 판 분석을 돕는 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AuroraBackground />
        <TopBanner />
        <SideBanner />
        {children}
      </body>
    </html>
  );
}
