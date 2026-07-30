import type { MainRole } from "@/lib/types";

const LABEL: Record<MainRole, string> = {
  TOP: "탑",
  JUNGLE: "정글",
  MIDDLE: "미드",
  BOTTOM: "원딜",
  UTILITY: "서포터",
};

export function LaneIcon({ role }: { role?: MainRole }) {
  if (!role) return <span className="tg-chip" aria-label="주 라인 미확인">?</span>;
  const marks: Record<MainRole, React.ReactNode> = {
    TOP: <path d="M4 4h16v5H9v11H4z" />,
    JUNGLE: <path d="M12 3c1 4 4 5 7 6-3 1-5 3-6 8-1-4-4-6-8-7 4-1 6-3 7-7Z" />,
    MIDDLE: <path d="M5 19 19 5M4 14V4h10M20 10v10H10" />,
    BOTTOM: <path d="M20 20H4v-5h11V4h5z" />,
    UTILITY: <path d="M12 3v18M6 7h12M7 12l-3 4h6l-3-4Zm10 0-3 4h6l-3-4Z" />,
  };
  return (
    <span className="tg-chip" title={LABEL[role]} aria-label={`주 라인: ${LABEL[role]}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        {marks[role]}
      </svg>
      <span className="tg-sr-only">{LABEL[role]}</span>
    </span>
  );
}
