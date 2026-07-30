"use client";

import { useEffect, useState } from "react";

import { BeeIcon } from "@/components/shared/BeeIcon";
import { renderSimpleMarkdown } from "@/lib/utils/simpleMarkdown";
import type { CommentMode, Session } from "@/lib/types";

interface AssistantReply {
  summary: string;
  notablePlayers?: Array<{ riotId: string; reason: string }>;
  suggestions?: string[];
  answer?: string;
  refused?: boolean;
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
  const [typed, setTyped] = useState("");
  const [typingFull, setTypingFull] = useState("");
  const [reply, setReply] = useState<AssistantReply | null>(null);
  const [error, setError] = useState("");
  const mode = session.commentMode ?? "normal";

  useEffect(() => {
    document.body.classList.toggle("tg-assistant-open", open);
    return () => document.body.classList.remove("tg-assistant-open");
  }, [open]);

  useEffect(() => {
    if (!typingFull) return;
    let index = 0;
    const reset = window.setTimeout(() => setTyped(""), 0);
    const id = window.setInterval(() => {
      index += 1;
      setTyped(typingFull.slice(0, index));
      if (index >= typingFull.length) window.clearInterval(id);
    }, 18);
    return () => {
      window.clearTimeout(reset);
      window.clearInterval(id);
    };
  }, [typingFull]);

  async function ask(value = question) {
    if (loading) return;
    setLoading(true);
    setError("");
    setTypingFull("");
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
      if (body.refused) throw new Error(body.answer || "내전과 리그 오브 레전드 관련 질문만 답할 수 있어요.");
      const assistantText = body.answer || body.summary;
      setReply(body);
      setMessages((current) => [
        ...current,
        ...(value ? [{ role: "user" as const, content: value }] : []),
        { role: "assistant", content: assistantText },
      ]);
      setTypingFull(assistantText);
      setQuestion("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI 설명을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
  }

  return (
    <>
      {!open && <p className="tg-assistant-hint" aria-hidden>AI 분석을 들어보세요!</p>}
      <button
        className="tg-button tg-button--primary tg-assistant-fab"
        type="button"
        aria-label="AI 설명 열기"
        onClick={() => { setOpen(true); if (!reply && !loading) void ask(""); }}
      >
        <BeeIcon size={30} />
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
            <button className="tg-button" type="button" onClick={close}>닫기</button>
          </header>
          <div className="tg-assistant-sidebar__messages">
            {messages.slice(0, -1).map((message, index) => (
              <div className={`tg-message ${message.role === "user" ? "is-user" : ""}`} key={`${message.role}-${index}`}>
                {message.role === "assistant" ? renderSimpleMarkdown(message.content) : message.content}
              </div>
            ))}
            {messages.at(-1) && (
              <div className={`tg-message ${messages.at(-1)!.role === "user" ? "is-user" : ""}`}>
                {messages.at(-1)!.role === "assistant"
                  ? renderSimpleMarkdown(typed || (loading ? "" : messages.at(-1)!.content))
                  : messages.at(-1)!.content}
                {messages.at(-1)!.role === "assistant" && typed && typed.length < (typingFull || messages.at(-1)!.content).length
                  ? <span className="tg-caret" aria-hidden>|</span>
                  : null}
              </div>
            )}
            {reply?.notablePlayers?.length ? (
              <div className="tg-panel">
                <strong>주목할 플레이어</strong>
                {reply.notablePlayers.map((player) => <p key={player.riotId}><b>{player.riotId.split("#")[0]}</b> — {player.reason}</p>)}
              </div>
            ) : null}
            <div className="tg-row">
              {(reply?.suggestions ?? []).slice(0, 3).map((suggestion) => (
                <button
                  className="tg-button"
                  type="button"
                  key={suggestion}
                  disabled={loading}
                  onClick={() => void ask(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            {loading && (
              <div className="tg-assistant-think" aria-busy>
                <span className="tg-assistant-think__face" aria-hidden>🤔</span>
                <p>음… 조금만 생각해 볼게요</p>
              </div>
            )}
            {error && <div className="tg-notice tg-notice--error">{error}</div>}
          </div>
          <form
            className="tg-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!loading && question.trim()) void ask();
            }}
          >
            <input
              className="tg-input"
              style={{ flex: 1 }}
              value={question}
              disabled={loading}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="내전·롤 관련만 물어보세요"
            />
            <button className="tg-button tg-button--primary" type="submit" disabled={!question.trim() || loading}>전송</button>
          </form>
        </aside>
      )}
    </>
  );
}
