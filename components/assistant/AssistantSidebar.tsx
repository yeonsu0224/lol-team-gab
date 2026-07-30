"use client";

import { useState } from "react";

import type { CommentMode, Session } from "@/lib/types";

interface AssistantReply {
  summary: string;
  notablePlayers?: Array<{ riotId: string; reason: string }>;
  suggestions?: string[];
  answer?: string;
}

export function AssistantSidebar({
  session,
  surface,
  onModeChange,
}: {
  session: Session;
  surface: string;
  onModeChange: (mode: CommentMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [reply, setReply] = useState<AssistantReply | null>(null);
  const [error, setError] = useState("");
  const mode = session.commentMode ?? "normal";

  async function ask(value = question) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/riot/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          surface,
          question: value || undefined,
          messages,
          context: {
            participants: session.participants.map((item) => ({
              riotId: item.riotId,
              tier: item.preTier.label,
              currentTier: item.currentLpValue,
              grade: item.trialPerformanceByRound,
              honeyBeeHistory: item.honeyBeeHistory,
            })),
            proposal: session.rounds.at(-1)?.nextTeamProposal ?? session.preTeamProposal,
            rounds: session.rounds.map(({ round, trialResult }) => ({ round, winnerTeam: trialResult.winnerTeam })),
          },
        }),
      });
      const body = await response.json() as AssistantReply & { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? "AI 설명을 불러오지 못했습니다.");
      const assistantText = body.answer || body.summary;
      setReply(body);
      setMessages((current) => [
        ...current,
        ...(value ? [{ role: "user" as const, content: value }] : []),
        { role: "assistant", content: assistantText },
      ]);
      setQuestion("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI 설명을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="tg-button tg-button--primary tg-assistant-fab"
        type="button"
        aria-label="AI 설명 열기"
        onClick={() => { setOpen(true); if (!reply && !loading) void ask(""); }}
      >
        🐝
      </button>
      {open && (
        <aside className="tg-assistant-sidebar" aria-label="AI 분석">
          <header className="tg-row tg-row--between">
            <div>
              <strong>AI 내전 분석</strong>
              <div className="tg-row">
                {(["normal", "friend"] as const).map((item) => (
                  <button
                    className={`tg-chip ${mode === item ? "is-gold" : ""}`}
                    type="button"
                    key={item}
                    onClick={() => onModeChange(item)}
                  >
                    {item === "normal" ? "일반" : "찐친"}
                  </button>
                ))}
              </div>
            </div>
            <button className="tg-button" type="button" onClick={() => setOpen(false)}>닫기</button>
          </header>
          <div className="tg-assistant-sidebar__messages">
            {messages.map((message, index) => (
              <div className={`tg-message ${message.role === "user" ? "is-user" : ""}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {reply?.notablePlayers?.length ? (
              <div className="tg-panel">
                <strong>주목할 플레이어</strong>
                {reply.notablePlayers.map((player) => <p key={player.riotId}><b>{player.riotId}</b> — {player.reason}</p>)}
              </div>
            ) : null}
            <div className="tg-row">
              {reply?.suggestions?.slice(0, 3).map((suggestion) => (
                <button className="tg-button" type="button" key={suggestion} onClick={() => void ask(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
            {loading && <p aria-busy>분석 중…</p>}
            {error && <div className="tg-notice tg-notice--error">{error}</div>}
          </div>
          <form className="tg-row" onSubmit={(event) => { event.preventDefault(); if (question.trim()) void ask(); }}>
            <input className="tg-input" style={{ flex: 1 }} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="추가로 물어보세요" />
            <button className="tg-button tg-button--primary" type="submit" disabled={!question.trim() || loading}>전송</button>
          </form>
        </aside>
      )}
    </>
  );
}
