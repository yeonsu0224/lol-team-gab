"use client";

import { useState } from "react";

import { requestJson } from "@/lib/player/client";
import type { CommentMode, Session } from "@/lib/types";
import styles from "@/components/shared/Shared.module.scss";

export function FloatingAssistant({
  session,
  surface,
  onModeChange,
}: {
  session: Session;
  surface: "team" | "trial" | "rebalance" | "finish";
  onModeChange?: (mode: CommentMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CommentMode>(session.commentMode ?? "normal");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const friendCandidates = session.participants.filter((participant) => {
    const unrated =
      participant.tierSource === "manual" ||
      (participant.riotData.preMainRoleGames ?? 0) < 3 ||
      participant.riotData.preMainRoleKda == null ||
      participant.riotData.preMainRoleDamage == null;
    return !unrated && Object.values(participant.trialPerformanceByRound ?? {})
      .some((performance) => performance?.roundBelowExpect);
  });

  function selectMode(next: CommentMode) {
    setMode(next);
    setSummary("");
    setError("");
    onModeChange?.(next);
  }

  async function explain() {
    setLoading(true);
    setError("");
    try {
      const result = await requestJson<{ summary: string }>("/api/riot/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, context: buildSafeContext(session, surface, mode) }),
      });
      setSummary(result.summary);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "설명을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className={styles.assistant} aria-label="Gemini 내전 도우미">
      {open ? (
        <div className={styles.assistantPanel}>
          <div className={styles.assistantHeader}>
            <strong>🐝 내전 설명 도우미</strong>
            <button type="button" onClick={() => setOpen(false)}>닫기</button>
          </div>
          <div className={styles.modeRow} aria-label="설명 모드">
            <button className={mode === "normal" ? styles.modeActive : ""} type="button" onClick={() => selectMode("normal")}>
              일반 모드
            </button>
            <button className={mode === "friend" ? styles.modeActive : ""} type="button" onClick={() => selectMode("friend")}>
              친구 모드
            </button>
          </div>
          <p className={styles.guardrail}>
            {mode === "normal"
              ? "격려 중심이며 개인을 탓하거나 부정적으로 평가하지 않습니다."
              : "명시적으로 선택한 가벼운 모드입니다. 욕설·인신공격은 허용하지 않습니다."}
          </p>
          {summary && <p className={styles.assistantText}>{summary}</p>}
          {mode === "friend" && friendCandidates.length > 0 && (
            <p className={styles.guardrail}>
              가벼운 복기 후보: {friendCandidates.map(({ riotId }) => riotId).join(", ")}
            </p>
          )}
          {error && <p className={styles.assistantError} role="alert">{error} 근거 패널로 계속 진행할 수 있습니다.</p>}
          <button type="button" disabled={loading} onClick={() => void explain()}>
            {loading ? "Gemini가 설명하는 중…" : summary ? "다시 설명하기" : "설명 듣기"}
          </button>
        </div>
      ) : (
        <span className={styles.assistantHint}>설명을 들어보세요</span>
      )}
      <button
        className={styles.assistantButton}
        type="button"
        aria-expanded={open}
        aria-label="Gemini 설명 도우미 열기"
        onClick={() => setOpen((value) => !value)}
      >
        🐝
      </button>
    </aside>
  );
}

function buildSafeContext(session: Session, surface: string, mode: CommentMode) {
  const participants = session.participants.map((participant) => {
    const performances = Object.values(participant.trialPerformanceByRound ?? {});
    const rated = performances.filter((performance) => performance && !performance.unrated);
    const unrated =
      participant.tierSource === "manual" ||
      (participant.riotData.preMainRoleGames ?? 0) < 3 ||
      participant.riotData.preMainRoleKda == null ||
      participant.riotData.preMainRoleDamage == null;
    return {
      riotId: participant.riotId,
      tier: participant.preTier.label,
      unrated,
      honeyBee: unrated ? "not_evaluated" : participant.honeyBeeBadge,
      grades: unrated ? [] : rated.map((performance) => performance?.performanceGrade).filter(Boolean),
      belowExpect:
        !unrated && mode === "friend" && rated.some((performance) => performance?.roundBelowExpect),
    };
  });
  return {
    surface,
    rounds: session.rounds.map(({ round, trialResult }) => ({
      round,
      winnerTeam: trialResult.winnerTeam,
    })),
    team: session.preTeamProposal && {
      bluePowerPct: session.preTeamProposal.bluePowerPct,
      redPowerPct: session.preTeamProposal.redPowerPct,
      blueAverage: session.preTeamProposal.blueAvgTier.label,
      redAverage: session.preTeamProposal.redAvgTier.label,
      changes: session.rounds.flatMap(({ nextTeamProposal }) => nextTeamProposal.changes ?? []),
    },
    participants,
  };
}
