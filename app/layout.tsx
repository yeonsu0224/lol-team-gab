import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.scss";

export const metadata: Metadata = {
  title: "내전 총무",
  description: "리그 오브 레전드 내전 팀 밸런스 도우미",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
