"use client";

import { Children, type CSSProperties, type ReactNode } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import styles from "./Motion.module.scss";

export function Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={`${reduced ? styles.reduced : styles.stagger} ${className}`}>
      {Children.map(children, (child, index) => (
        <div style={{ "--stagger-index": index } as CSSProperties}>{child}</div>
      ))}
    </div>
  );
}
