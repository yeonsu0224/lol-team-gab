import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "내전 총무",
  description: "LoL 5v5 내전 팀 밸런스 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
