"use client";

import { useState } from "react";

import type { AssistantResult, SummaryPayload } from "@/lib/domain/summaryPayload";
import { updateSession } from "@/lib/storage/sessionStore";
import type { CommentMode } from "@/lib/types";

import styles from "./FloatingAssistant.module.scss";

interface FloatingAssistantProps {
  sessionId: string;
  initialMode: CommentMode;
  buildPayload: () => SummaryPayload | null;
}

export function FloatingAssistant({
  sessionId,
  initialMode,
  buildPayload,
}: FloatingAssistantProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CommentMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResult | null>(null);

  async function fetchSummary(nextMode: CommentMode) {
    const payload = buildPayload();
    if (!payload) {
      setError("아직 요약할 팀 구성이 없습니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/riot/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode, payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message ?? "요약을 불러오지 못했습니다.");
      }
      setResult({ mode: data.mode, summary: data.summary, bullets: data.bullets });
    } catch (fetchError) {
      setResult(null);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "요약을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (!result && !loading) {
      void fetchSummary(mode);
    }
  }

  function handleModeChange(nextMode: CommentMode) {
    if (nextMode === mode) {
      return;
    }
    setMode(nextMode);
    try {
      updateSession(sessionId, { commentMode: nextMode });
    } catch {
      // Persisting the preference is best-effort; the summary still updates.
    }
    void fetchSummary(nextMode);
  }

  return (
    <div className={styles.root}>
      {open ? (
        <div className={styles.bubble} role="dialog" aria-label="AI 요약">
          <div className={styles.header}>
            <span className={styles.title}>AI 코치</span>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <div className={styles.modeRow}>
            <button
              type="button"
              className={`${styles.modeButton} ${mode === "normal" ? styles.modeActive : ""}`}
              onClick={() => handleModeChange("normal")}
              aria-pressed={mode === "normal"}
            >
              일반
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${mode === "friend" ? styles.modeActive : ""}`}
              onClick={() => handleModeChange("friend")}
              aria-pressed={mode === "friend"}
            >
              찐친
            </button>
            <button
              type="button"
              className={styles.refresh}
              onClick={() => fetchSummary(mode)}
              disabled={loading}
            >
              {loading ? "..." : "새로고침"}
            </button>
          </div>

          {mode === "friend" ? (
            <p className={styles.friendNote}>
              찐친 모드는 장난스러운 코멘트를 허용합니다. 모욕·혐오 표현은 항상
              금지됩니다.
            </p>
          ) : null}

          <div className={styles.content}>
            {loading ? (
              <p className={styles.state}>요약을 생성하는 중…</p>
            ) : error ? (
              <p className={styles.errorText}>{error}</p>
            ) : result ? (
              <>
                <p className={styles.summary}>{result.summary}</p>
                {result.bullets.length > 0 ? (
                  <ul className={styles.bullets}>
                    {result.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className={styles.state}>요약을 불러오세요.</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.hint}>설명을 들어보세요</div>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label="AI 코치 열기"
      >
        <span aria-hidden="true">🐝</span>
      </button>
    </div>
  );
}
