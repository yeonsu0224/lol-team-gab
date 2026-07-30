import Link from "next/link";

export function StepNav({ sessionId, active }: { sessionId: string; active: string }) {
  const steps = [
    ["players", "참가자"],
    ["team", "팀 제안"],
    ["trial", "시험 판"],
    ["rebalance", "재밸런스"],
    ["finish", "마무리"],
  ];
  return (
    <nav className="tg-row" aria-label="내전 단계">
      {steps.map(([path, label], index) => (
        <Link
          key={path}
          className={`tg-chip ${active === path ? "is-gold" : ""}`}
          href={`/session/${sessionId}/${path}`}
        >
          {index + 1}. {label}
        </Link>
      ))}
    </nav>
  );
}
