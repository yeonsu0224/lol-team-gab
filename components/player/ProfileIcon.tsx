"use client";

import { useState } from "react";

import { useDataDragonVersion } from "@/lib/ddragon/BootstrapProvider";
import { profileIconUrl } from "@/lib/riot/ddragon/urls";

import styles from "./ProfileIcon.module.scss";

interface ProfileIconProps {
  profileIconId?: number;
  name: string;
  size?: number;
}

export function ProfileIcon({
  profileIconId,
  name,
  size = 56,
}: ProfileIconProps) {
  const version = useDataDragonVersion();
  const [failed, setFailed] = useState(false);

  const canShowImage =
    version !== null && typeof profileIconId === "number" && !failed;

  const style = { width: size, height: size };

  if (!canShowImage) {
    return (
      <span className={styles.fallback} style={style} aria-hidden="true">
        {name.trim().charAt(0) || "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external CDN, size known
    <img
      className={styles.icon}
      style={style}
      src={profileIconUrl(version, profileIconId)}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}
