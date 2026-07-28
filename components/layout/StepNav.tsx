"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./StepNav.module.scss";

const STEPS = [
  { key: "players", label: "참가자" },
  { key: "team", label: "팀 제안" },
  { key: "trial", label: "시험 판" },
  { key: "rebalance", label: "재밸런스" },
] as const;

export default function StepNav({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="내전 진행 단계">
      <ol className={styles.stepList}>
        {STEPS.map((step, index) => {
          const href = `/session/${sessionId}/${step.key}`;
          const isActive = pathname === href;

          return (
            <li key={step.key}>
              <Link
                href={href}
                className={isActive ? styles.stepActive : styles.step}
                aria-current={isActive ? "step" : undefined}
              >
                <span className={styles.stepNumber}>{index + 1}</span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
