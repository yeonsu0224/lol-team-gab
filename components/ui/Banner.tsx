import type { ReactNode } from "react";

import styles from "./Banner.module.scss";

type BannerTone = "error" | "warning" | "info";

interface BannerProps {
  tone: BannerTone;
  children: ReactNode;
  className?: string;
}

const ICONS: Record<BannerTone, string> = {
  error: "⚠",
  warning: "△",
  info: "ⓘ",
};

export function Banner({ tone, children, className }: BannerProps) {
  return (
    <p
      className={[styles.banner, styles[tone], className]
        .filter(Boolean)
        .join(" ")}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[tone]}
      </span>
      <span>{children}</span>
    </p>
  );
}
