"use client";

import { useState } from "react";

import { useBootstrap } from "@/lib/ddragon/BootstrapProvider";
import { championSquareUrl } from "@/lib/riot/ddragon/urls";

import styles from "./ChampionIcon.module.scss";

interface ChampionIconProps {
  championId: number;
  size?: number;
}

export function ChampionIcon({ championId, size = 40 }: ChampionIconProps) {
  const { data } = useBootstrap();
  const [failed, setFailed] = useState(false);

  const champion = data?.championsByKey[String(championId)];
  const style = { width: size, height: size };

  if (!data || !champion || failed) {
    return <span className={styles.fallback} style={style} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external CDN, size known
    <img
      className={styles.icon}
      style={style}
      src={championSquareUrl(data.version, champion.id)}
      alt={champion.name}
      title={champion.name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}
