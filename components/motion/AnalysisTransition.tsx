"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

export function AnalysisTransition({
  messages,
  onComplete,
}: {
  messages: string[];
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const total = reduced ? 500 : 2400;
    const step = Math.max(250, Math.floor(total / messages.length));
    const interval = window.setInterval(
      () => setIndex((current) => Math.min(messages.length - 1, current + 1)),
      step,
    );
    const timeout = window.setTimeout(onComplete, total);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [messages.length, onComplete, reduced]);

  return (
    <section className="tg-analysis-transition" aria-live="polite" aria-busy>
      <div>
        <div className="tg-analysis-transition__orb" aria-hidden />
        <h2>{messages[index]}</h2>
        <p className="tg-muted">잠시만 기다려 주세요.</p>
      </div>
    </section>
  );
}
