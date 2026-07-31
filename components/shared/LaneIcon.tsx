"use client";

import Image from "next/image";

import type { MainRole } from "@/lib/types";
import { useT } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/messages/ko";

/** `public/icons/white` 파일명. 라이엇 라인 키와 파일명이 달라 매핑이 필요하다. */
const ICON: Record<MainRole, string> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "mid",
  BOTTOM: "adc",
  UTILITY: "sp",
};

const ROLE_KEY: Record<MainRole, MessageKey> = {
  TOP: "role.TOP",
  JUNGLE: "role.JUNGLE",
  MIDDLE: "role.MIDDLE",
  BOTTOM: "role.BOTTOM",
  UTILITY: "role.UTILITY",
};

export function LaneIcon({ role }: { role?: MainRole }) {
  const t = useT();
  if (!role) return <span className="tg-chip" aria-label="?">?</span>;
  const label = t(ROLE_KEY[role]);
  return (
    <span className="tg-chip tg-lane-icon" title={label}>
      <Image src={`/icons/white/${ICON[role]}.png`} alt="" width={18} height={18} />
      <span className="tg-sr-only">{label}</span>
    </span>
  );
}
