"use client";

import type { CSSProperties, ReactNode } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import type { TeamSide } from "@/lib/types";
import styles from "./Motion.module.scss";

export function TeamSlideIn({
  side,
  index = 0,
  children,
}: {
  side: TeamSide;
  index?: number;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className={reduced ? styles.reduced : styles[side]}
      style={{ animationDelay: reduced ? undefined : `${index * 60}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
