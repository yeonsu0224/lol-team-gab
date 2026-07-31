"use client";

import { useEffect, useState } from "react";

import { BeeIcon } from "@/components/shared/BeeIcon";
import { useT } from "@/lib/i18n/context";
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
  const t = useT();
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
      if (!response.ok) throw new Error(body.error?.message ?? t("assistant.loadFail"));
      if (body.refused) throw new Error(body.answer || t("assistant.refused"));
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
      setError(cause instanceof Error ? cause.message : t("assistant.loadFail"));
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
  }

  return (
    <>
      {!open && <p className="tg-assistant-hint" aria-hidden>{t("assistant.open")}</p>}
      <button
        className="tg-button tg-button--primary tg-assistant-fab"
        type="button"
        aria-label={t("assistant.open")}
        onClick={() => { setOpen(true); if (!reply && !loading) void ask(""); }}
      >
        <BeeIcon size={30} />
      </button>
      {open && (
        <aside className="tg-assistant-sidebar" aria-label={t("assistant.open")}>
          <header className="tg-row tg-row--between">
            <div>
              <strong>{t("assistant.open")}</strong>
              <div className="tg-row">
                {(["normal", "friend"] as const).map((item) => (
                  <button
                    className={`tg-chip ${mode === item ? "is-gold" : ""}`}
                    type="button"
                    key={item}
                    onClick={() => onModeChange(item)}
                  >
                    {item === "normal" ? t("assistant.normal") : t("assistant.friend")}
                  </button>
                ))}
              </div>
            </div>
            <button className="tg-button" type="button" onClick={close}>{t("common.close")}</button>
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
                <strong>{t("assistant.notable")}</strong>
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
                <p>{t("assistant.thinking")}</p>
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
              placeholder={t("assistant.placeholder")}
            />
            <button className="tg-button tg-button--primary" type="submit" disabled={!question.trim() || loading}>{t("assistant.send")}</button>
          </form>
        </aside>
      )}
    </>
  );
}
