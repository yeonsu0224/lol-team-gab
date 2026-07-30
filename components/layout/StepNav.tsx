"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./StepNav.module.scss";

const STEPS = [
  ["players", "참가자"],
  ["team", "팀 제안"],
  ["trial", "시험 판"],
  ["rebalance", "재밸런스"],
  ["finish", "마무리"],
] as const;

export function StepNav({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="내전 진행 단계">
      <ol className={styles.list}>
        {STEPS.map(([path, label], index) => {
          const href = `/session/${sessionId}/${path}`;
          const active = pathname === href;
          return (
          <li key={path}>
            <Link className={`${styles.step} ${active ? styles.active : ""}`} href={href} aria-current={active ? "step" : undefined}>
              <span aria-hidden>{index + 1}</span>
              {label}
            </Link>
          </li>
          );
        })}
      </ol>
    </nav>
  );
}
