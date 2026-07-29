"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./StepNav.module.scss";

interface StepNavProps {
  sessionId: string;
}

const steps = [
  { segment: "players", label: "참가자" },
  { segment: "team", label: "팀 제안" },
  { segment: "trial", label: "게임 결과" },
  { segment: "rebalance", label: "재밸런스" },
  { segment: "finish", label: "내전 종료" },
] as const;

export function StepNav({ sessionId }: StepNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="내전 진행 단계">
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const href = `/session/${sessionId}/${step.segment}`;
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={step.segment}>
              <Link
                className={`${styles.step} ${
                  isActive ? styles.stepActive : ""
                }`}
                href={href}
                aria-current={isActive ? "step" : undefined}
              >
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
