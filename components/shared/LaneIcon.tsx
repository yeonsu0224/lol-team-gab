import Image from "next/image";

import type { MainRole } from "@/lib/types";

const LABEL: Record<MainRole, string> = {
  TOP: "탑",
  JUNGLE: "정글",
  MIDDLE: "미드",
  BOTTOM: "원딜",
  UTILITY: "서포터",
};

/** `public/icons/white` 파일명. 라이엇 라인 키와 파일명이 달라 매핑이 필요하다. */
const ICON: Record<MainRole, string> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "mid",
  BOTTOM: "adc",
  UTILITY: "sp",
};

export function LaneIcon({ role }: { role?: MainRole }) {
  if (!role) return <span className="tg-chip" aria-label="주 라인 미확인">?</span>;
  return (
    <span className="tg-chip tg-lane-icon" title={LABEL[role]}>
      <Image src={`/icons/white/${ICON[role]}.png`} alt="" width={18} height={18} />
      <span className="tg-sr-only">{`주 라인: ${LABEL[role]}`}</span>
    </span>
  );
}
