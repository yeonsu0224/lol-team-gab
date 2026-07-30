"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AssistantSidebar } from "@/components/assistant/AssistantSidebar";
import { DonationPanel } from "@/components/shared/DonationPanel";
import { automaticMvp, finalWinner, topHoneyBees } from "@/lib/domain/sessionWorkflow";
import { lpValueToTier } from "@/lib/domain/lp";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { loadBootstrap, profileIconUrl, type DataDragonBootstrap } from "@/lib/player/client";
import { useSessions } from "@/lib/storage/useSessions";
import type { Participant, SessionWrapUp } from "@/lib/types";

const STAGE_COUNT = 4;
type Beat = "hook" | "drum" | "reveal" | "cta";

function beatRank(beat: Beat): number {
  return beat === "hook" ? 0 : beat === "drum" ? 1 : beat === "reveal" ? 2 : 3;
}

function PlayerAvatar({
  participant,
  bootstrap,
  size = 52,
  className = "tg-player-card__avatar",
}: {
  participant: Participant;
  bootstrap: DataDragonBootstrap | null;
  size?: number;
  className?: string;
}) {
  const src = bootstrap && participant.profileIconId != null
    ? profileIconUrl(bootstrap.version, participant.profileIconId)
    : undefined;
  return src
    ? <Image className={className} src={src} alt={participant.riotId} width={size} height={size} unoptimized />
    : <span className={className} title={participant.riotId} aria-hidden />;
}

export default function FinishPage() {
  const { id } = useParams<{ id: string }>();
  const { sessions, hydrated, error, update } = useSessions();
  const session = sessions.find((item) => item.id === id);
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [beat, setBeat] = useState<Beat>("hook");
  const [rating, setRating] = useState<SessionWrapUp["performanceRating"]>();
  const [feedback, setFeedback] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [bootstrap, setBootstrap] = useState<DataDragonBootstrap | null>(null);
  const winner = useMemo(
    () => session ? finalWinner(session.rounds.map(({ trialResult }) => trialResult.winnerTeam)) : undefined,
    [session],
  );
  const mvp = session ? automaticMvp(session) : undefined;
  const honeyBees = session ? topHoneyBees(session) : [];
  const showingIntro = stage < STAGE_COUNT;

  useEffect(() => {
    void loadBootstrap().then(setBootstrap).catch(() => undefined);
  }, []);

  const activeBeat: Beat = !showingIntro || reduced ? "cta" : beat;

  useEffect(() => {
    if (!showingIntro || reduced) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const skipDrum = stage === 3 && honeyBees.length === 0;
    const shortDrum = stage === 2 && !mvp;
    const hookMs = skipDrum ? 400 : 1000;
    const drumMs = skipDrum ? 0 : shortDrum ? 200 : 400;
    const revealToCtaMs = 700;

    const schedule = (ms: number, next: Beat) => {
      timers.push(setTimeout(() => {
        if (!cancelled) setBeat(next);
      }, ms));
    };

    schedule(0, "hook");
    if (skipDrum) {
      schedule(hookMs, "reveal");
    } else {
      schedule(hookMs, "drum");
      schedule(hookMs + drumMs, "reveal");
    }
    schedule(hookMs + drumMs + revealToCtaMs, "cta");

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [stage, showingIntro, reduced, honeyBees.length, mvp]);

  useEffect(() => {
    if (!showingIntro || activeBeat !== "cta") return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== "ArrowRight") return;
      event.preventDefault();
      setBeat("hook");
      setStage((current) => current + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showingIntro, activeBeat]);

  if (error) return <main className="tg-page"><div className="tg-notice tg-notice--error">{error}</div></main>;
  if (!hydrated) return <main className="tg-page"><p aria-busy>결과를 불러오는 중입니다…</p></main>;
  if (!session) return <main className="tg-page"><h1>세션을 찾을 수 없습니다.</h1></main>;

  const blueName = session.preTeamProposal?.blueTeamName || "블루팀";
  const redName = session.preTeamProposal?.redTeamName || "레드팀";
  const winnerName = winner === "blue" ? blueName : winner === "red" ? redName : undefined;
  const winnerMembers = winner
    ? (winner === "blue" ? session.preTeamProposal?.blueTeam : session.preTeamProposal?.redTeam) ?? []
    : [];
  const mvpParticipant = session.participants.find(({ puuid }) => puuid === mvp);
  const honeyBeeParticipants = honeyBees
    .map((puuid) => session.participants.find((item) => item.puuid === puuid))
    .filter((item): item is Participant => Boolean(item));

  const showDrum = beatRank(activeBeat) >= 1;
  const showReveal = beatRank(activeBeat) >= 2;
  const showCta = beatRank(activeBeat) >= 3;
  const washClass = stage === 1 && showReveal && winner ? ` is-${winner}` : "";

  if (showingIntro) {
    return (
      <main className={`tg-page tg-result-reveal${washClass}`} aria-live="polite">
        <section className="tg-result-reveal__stage">
          {stage === 0 && (
            <>
              <p className="tg-result-reveal__hook is-visible">
                내전이 종료되었습니다! 결과를 확인 해 볼까요!
              </p>
              {showDrum && !showReveal && (
                <div className="tg-result-reveal__drum is-visible" aria-hidden>
                  <span /><span /><span />
                </div>
              )}
              {showReveal && (
                <>
                  <h1 className="tg-result-reveal__title is-visible">{session.name || "이름 없는 내전"}</h1>
                  <p className="tg-result-reveal__detail is-visible">총 {session.rounds.length}판 진행</p>
                </>
              )}
            </>
          )}

          {stage === 1 && (
            <>
              <p className="tg-result-reveal__hook is-visible">
                그렇다면… 최종 승리 팀은?
              </p>
              {showDrum && !showReveal && (
                <div className="tg-result-reveal__drum is-visible" aria-hidden>
                  <span /><span /><span />
                </div>
              )}
              {showReveal && (
                <>
                  <h1 className="tg-result-reveal__title is-visible">
                    {winnerName ? `${winnerName} 승리` : "기록 없음"}
                  </h1>
                  {winnerMembers.length > 0 && (
                    <ul className="tg-result-reveal__banner is-visible">
                      {winnerMembers.slice(0, 5).map((participant, index) => (
                        <li
                          className="tg-result-reveal__banner-item"
                          style={{ animationDelay: `${index * 70}ms` }}
                          key={participant.puuid}
                        >
                          <PlayerAvatar participant={participant} bootstrap={bootstrap} size={56} />
                          <span>{participant.riotId}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}

          {stage === 2 && (
            <>
              <p className="tg-result-reveal__hook is-visible">
                이번 내전의 MVP는…
              </p>
              {showDrum && !showReveal && (
                <div className="tg-result-reveal__drum is-visible" aria-hidden>
                  <span /><span /><span />
                </div>
              )}
              {showReveal && (
                mvpParticipant ? (
                  <>
                    <div className="tg-result-reveal__mvp is-visible">
                      <PlayerAvatar
                        participant={mvpParticipant}
                        bootstrap={bootstrap}
                        size={96}
                        className="tg-result-reveal__mvp-avatar"
                      />
                      <h1 className="tg-result-reveal__title">{mvpParticipant.riotId}</h1>
                    </div>
                    <p className="tg-result-reveal__detail is-visible">전체 판 KDA·챔피언 피해량 종합</p>
                  </>
                ) : (
                  <h1 className="tg-result-reveal__title is-visible">선정할 기록이 부족합니다</h1>
                )
              )}
            </>
          )}

          {stage === 3 && (
            <>
              <p className="tg-result-reveal__hook is-visible">
                기대를 뛰어넘은 플레이어는…
              </p>
              {showDrum && !showReveal && (
                <div className="tg-result-reveal__drum is-visible" aria-hidden>
                  <span /><span /><span />
                </div>
              )}
              {showReveal && (
                honeyBeeParticipants.length ? (
                  <>
                    <ul className="tg-result-reveal__banner is-visible">
                      {honeyBeeParticipants.map((participant, index) => (
                        <li
                          className="tg-result-reveal__banner-item"
                          style={{ animationDelay: `${index * 70}ms` }}
                          key={participant.puuid}
                        >
                          <PlayerAvatar participant={participant} bootstrap={bootstrap} size={56} />
                          <span>{participant.riotId}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="tg-result-reveal__detail is-visible">
                      기대 이상 판정을 가장 많이 받은 플레이어입니다.
                    </p>
                  </>
                ) : (
                  <h1 className="tg-result-reveal__title is-visible">해당 없음</h1>
                )
              )}
            </>
          )}

          <div className={`tg-result-reveal__cta tg-row${showCta ? " is-visible" : ""}`}>
            <button
              className="tg-button tg-button--primary"
              type="button"
              disabled={!showCta}
              onClick={() => {
                setBeat("hook");
                setStage((current) => current + 1);
              }}
            >
              {stage === STAGE_COUNT - 1 ? "전체 결과 보기" : "다음"}
            </button>
            <button
              className="tg-button"
              type="button"
              onClick={() => setStage(STAGE_COUNT)}
            >
              건너뛰기
            </button>
          </div>
        </section>
      </main>
    );
  }

  const selectedRating = rating ?? session.wrapUp?.performanceRating;
  const selectedFeedback = feedback ?? session.wrapUp?.feedbackNote ?? "";

  function saveWrapUp() {
    update(id, {
      wrapUp: {
        endedAtRound: Math.max(1, session!.rounds.length) as 1 | 2 | 3 | 4,
        winnerTeam: winner,
        mvpPuuid: mvp,
        performanceRating: selectedRating,
        feedbackNote: selectedFeedback.trim() || undefined,
        endedAt: new Date().toISOString(),
      },
    });
    setSaved(true);
  }

  return (
    <main className="tg-page tg-stack">
      <section className={`tg-panel tg-result-summary${winner ? ` is-${winner}` : ""}`}>
        <p className="tg-muted">내전 마무리</p>
        <h1>{winner ? `${winner === "blue" ? blueName : redName} 최종 승리` : "저장된 결과가 없습니다"}</h1>
        <div className="tg-row">
          {session.rounds.map(({ round, trialResult }) => (
            <span className={`tg-chip is-${trialResult.winnerTeam}`} key={round}>{round}판 {trialResult.winnerTeam === "blue" ? "블루" : "레드"} 승</span>
          ))}
        </div>
      </section>
      <section className="tg-grid tg-grid--2">
        <article className="tg-panel"><p className="tg-muted">MVP</p><h2>{mvpParticipant?.riotId || "기록 부족"}</h2></article>
        <article className="tg-panel"><p className="tg-muted">꿀벌 · 기대 이상 최다</p><h2>{honeyBeeParticipants.map(({ riotId }) => riotId).join(" · ") || "해당 없음"}</h2></article>
      </section>
      <section className="tg-panel tg-stack">
        <h2>티어 변화와 성과</h2>
        <div className="tg-grid tg-grid--auto">
          {session.participants.map((participant) => {
            const delta = participant.currentLpValue - participant.preLpValue;
            return (
              <article className={`tg-player-card ${delta > 0 ? "is-blue" : delta < 0 ? "is-red" : ""}`} key={participant.puuid}>
                <div>
                  <strong>{participant.riotId}</strong>
                  <p className="tg-muted">{participant.preTier.label} → {lpValueToTier(participant.currentLpValue).label}</p>
                  <span className={`tg-chip ${delta > 0 ? "is-blue" : delta < 0 ? "is-red" : ""}`}>{delta > 0 ? "상승" : delta < 0 ? "하락" : "유지"} {Math.abs(delta)}LP</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="tg-panel tg-stack">
        <h2>내 평점</h2>
        <div className="tg-row" role="radiogroup" aria-label="성과 별점">
          {([1, 2, 3, 4, 5] as const).map((value) => (
            <button className={`tg-button ${selectedRating === value ? "tg-button--primary" : ""}`} type="button" key={value} onClick={() => setRating(value)} aria-checked={selectedRating === value} role="radio">
              {value}★
            </button>
          ))}
        </div>
        <textarea className="tg-textarea" value={selectedFeedback} onChange={(event) => setFeedback(event.target.value)} placeholder="앱 개선 피드백을 남겨 주세요." />
        <button className="tg-button tg-button--primary" type="button" onClick={saveWrapUp}>마무리 저장</button>
        {saved && <div className="tg-notice tg-notice--success">대시보드에 저장했습니다.</div>}
      </section>
      <DonationPanel />
      <AssistantSidebar session={session} surface="finish" onModeChange={(commentMode) => update(id, { commentMode })} />
    </main>
  );
}
