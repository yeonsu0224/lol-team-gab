"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import styles from "./Motion.module.scss";

export function FadeStage({ stageKey, children }: { stageKey: string | number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState({ key: stageKey, node: children });
  const [exiting, setExiting] = useState(false);
  const latest = useRef(children);

  useEffect(() => {
    latest.current = children;
  }, [children]);

  useEffect(() => {
    if (shown.key === stageKey) return;
    if (reduced) {
      setShown({ key: stageKey, node: latest.current });
      return;
    }
    setExiting(true);
    const timer = window.setTimeout(() => {
      setShown({ key: stageKey, node: latest.current });
      setExiting(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [reduced, shown.key, stageKey]);

  return (
    <div key={shown.key} className={reduced ? styles.reduced : exiting ? styles.exit : styles.fade}>
      {shown.key === stageKey ? children : shown.node}
    </div>
  );
}
