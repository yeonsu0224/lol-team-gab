"use client";

import { useState } from "react";

import { tierEmblemUrl } from "@/lib/riot/ddragon/urls";

import styles from "./TierEmblem.module.scss";

interface TierEmblemProps {
  tier: string;
  label?: string;
  size?: number;
}

export function TierEmblem({ tier, label, size = 88 }: TierEmblemProps) {
  const [failed, setFailed] = useState(false);
  const url = tierEmblemUrl(tier);
  const style = { width: size, height: size };

  if (!url || failed) {
    return <span className={styles.fallback} style={style} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static emblem asset
    <img
      className={styles.emblem}
      style={style}
      src={url}
      alt={label ? `${label} 엠블럼` : ""}
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}
