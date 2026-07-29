import type { MainRole } from "@/lib/types";

import styles from "./LaneIcon.module.scss";

interface LaneIconProps {
  role: MainRole | null | undefined;
  size?: number;
}

export const LANE_LABEL_KO: Record<MainRole, string> = {
  TOP: "탑",
  JUNGLE: "정글",
  MIDDLE: "미드",
  BOTTOM: "원딜",
  UTILITY: "서포터",
};

// Self-authored single-color glyphs (spec D-13): no Riot/Community Dragon assets.
function LanePath({ role }: { role: MainRole | null | undefined }) {
  switch (role) {
    case "TOP":
      return (
        <path d="M4 4h16v4h-8L8 12v8H4V4Z" fill="currentColor" />
      );
    case "JUNGLE":
      return (
        <path
          d="M12 3c2.5 3 3 5.5 1.5 8.5 1.5-1 2.5-2.5 3-4.5 1.5 4-.5 8-4.5 10 .8-2 .5-3.5-.5-5-.4 2-1.5 3.5-3 4.5 1-3-.5-6-3-8 3-1 4.5-3 4-5.5 1.4 1 2.4 2.6 3 4.5-.2-3-.8-6-.5-8.5Z"
          fill="currentColor"
        />
      );
    case "MIDDLE":
      return (
        <path d="M4 20 20 4h-6L4 14v6Zm0-9V4h7L4 11Zm9 9h7v-7l-7 7Z" fill="currentColor" />
      );
    case "BOTTOM":
      return (
        <path d="M20 20H4v-4h8l4-4V4h4v16Z" fill="currentColor" />
      );
    case "UTILITY":
      return (
        <path
          d="M12 3 4 6v5c0 4.5 3.2 8 8 10 4.8-2 8-5.5 8-10V6l-8-3Zm0 4.5 3 3-3 6-3-6 3-3Z"
          fill="currentColor"
        />
      );
    default:
      return (
        <circle
          cx="12"
          cy="12"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      );
  }
}

export function LaneIcon({ role, size = 20 }: LaneIconProps) {
  const label = role ? LANE_LABEL_KO[role] : "라인 미확인";

  return (
    <span className={styles.wrapper} title={label}>
      <svg
        className={styles.icon}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label={label}
      >
        <LanePath role={role} />
      </svg>
    </span>
  );
}
