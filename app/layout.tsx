import type { Metadata } from "next";
import type { ReactNode } from "react";

import { TopBanner } from "@/components/layout/TopBanner";
import "./globals.scss";

export const metadata: Metadata = {
  title: "내전 총무",
  description: "리그 오브 레전드 내전 팀 밸런싱 도우미",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <TopBanner />
        {children}
      </body>
    </html>
  );
}
