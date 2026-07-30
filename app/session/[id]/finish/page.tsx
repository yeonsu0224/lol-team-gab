"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AssistantSidebar } from "@/components/assistant/AssistantSidebar";
import { ActionBar } from "@/components/layout/ActionBar";
import { DonationPanel } from "@/components/shared/DonationPanel";
import { automaticMvp, finalWinner, topHoneyBees } from "@/lib/domain/sessionWorkflow";
import { lpValueToTier } from "@/lib/domain/lp";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { setAuroraTheme, type AuroraTheme } from "@/lib/motion/auroraTheme";
import { loadBootstrap, profileIconUrl, type DataDragonBootstrap } from "@/lib/player/client";
import { useSessions } from "@/lib/storage/useSessions";
import type { MainRole, Participant, Session, SessionWrapUp } from "@/lib/types";

const STAGE_COUNT = 5;
type Beat = "hook" | "drum" | "reveal" | "cta";

/** 단계별 기대 증진 멘트. 본체와 무관하게 항상 같은 위치에 놓기 위해 밖으로 뺀다(D-20). */
const HOOKS = [
  "내전이 종료되었습니다! 결과를 확인 해 볼까요!",
  "그렇다면… 최종 승리 팀은?",
  "이번 내전의 MVP는…",
  "그렇다면… 기대치 대비 최악의 플레이어는?",
  "기대를 뛰어넘은 플레이어는…",
];
/** MVP·범인 히어로 아이콘 크기(px). */
const HERO_AVATAR = 168;

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
  const culprit = session ? worstAgainstExpectation(session) : undefined;
  const showingIntro = stage < STAGE_COUNT;

  useEffect(() => {
    void loadBootstrap().then(setBootstrap).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated || !session || session.wrapUp) return;
    const timer = window.setTimeout(() => {
      update(id, (current) => {
        if (current.wrapUp) return current;
        return {
          ...current,
          wrapUp: {
            endedAtRound: Math.max(1, current.rounds.length || 1) as 1 | 2 | 3 | 4,
            winnerTeam: finalWinner(current.rounds.map(({ trialResult }) => trialResult.winnerTeam)),
            mvpPuuid: automaticMvp(current),
            endedAt: new Date().toISOString(),
          },
        };
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, id, session, update]);

  const activeBeat: Beat = !showingIntro || reduced ? "cta" : beat;

  useEffect(() => {
    if (!showingIntro || reduced) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stage 0은 종료 안내와 세션명뿐이라 두구두구할 것이 없다. 대기 없이 전부 노출한다.
    if (stage === 0) {
      timers.push(setTimeout(() => {
        if (!cancelled) setBeat("cta");
      }, 0));
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    // Stage 1(최종 승리 팀)은 드럼롤 없이 후킹 후 바로 공개한다.
    const skipDrum = stage === 1 || (stage === 3 && !culprit) || (stage === 4 && honeyBees.length === 0);
    const shortDrum = stage === 2 && !mvp;
    const hookMs = skipDrum ? 1400 : 2600;
    const drumMs = skipDrum ? 0 : shortDrum ? 1200 : 2400;
    const revealToCtaMs = 2800;

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
  }, [stage, showingIntro, reduced, honeyBees.length, mvp, culprit]);

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

  // 단계가 공개되는 순간 배경 오로라 색을 그 결과의 색으로 넘긴다(D-20).
  useEffect(() => {
    const revealed = beatRank(activeBeat) >= 2;
    setAuroraTheme(showingIntro && revealed ? stageAuroraTheme(stage, winner) : "default");
  }, [showingIntro, activeBeat, stage, winner]);

  useEffect(() => () => setAuroraTheme("default"), []);

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
  const mvpStats = mvp ? aggregateTrialStats(session, mvp) : undefined;
  const culpritParticipant = session.participants.find(({ puuid }) => puuid === culprit);
  const honeyBeeParticipants = honeyBees
    .map((puuid) => session.participants.find((item) => item.puuid === puuid))
    .filter((item): item is Participant => Boolean(item));

  const showDrum = beatRank(activeBeat) >= 1;
  const showReveal = beatRank(activeBeat) >= 2;
  const showCta = beatRank(activeBeat) >= 3;
  const previousStepHref = `/session/${session.id}/${previousStep(session)}`;

  if (showingIntro) {
    return (
      <main className="tg-page tg-result-reveal" aria-live="polite">
        <section className="tg-result-reveal__stage">
          <p className="tg-result-reveal__hook is-visible">{HOOKS[stage]}</p>

          <div className="tg-result-reveal__body">
            {showDrum && !showReveal && (
              <div className="tg-result-reveal__drum is-visible" aria-hidden>
                <span /><span /><span />
              </div>
            )}

            {stage === 0 && showReveal && (
              <>
                <h1 className="tg-result-reveal__title is-visible">{session.name || "이름 없는 내전"}</h1>
                <p className="tg-result-reveal__detail is-visible">총 {session.rounds.length}판 진행</p>
              </>
            )}

            {stage === 1 && showReveal && (
              <>
                <h1 className="tg-result-reveal__title is-visible">
                  {winnerName ? `${winnerName} 승리` : "기록 없음"}
                </h1>
                {winnerMembers.length > 0 && (
                  <ul className="tg-result-reveal__banner is-visible">
                    {winnerMembers.slice(0, 5).map((participant, index) => (
                      <li
                        className="tg-result-reveal__banner-item"
                        style={{ animationDelay: `${index * 140}ms` }}
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

            {stage === 2 && showReveal && (
              mvpParticipant ? (
                <>
                  <div className="tg-result-reveal__mvp is-visible">
                    <PlayerAvatar
                      participant={mvpParticipant}
                      bootstrap={bootstrap}
                      size={HERO_AVATAR}
                      className="tg-result-reveal__mvp-avatar"
                    />
                    <h1 className="tg-result-reveal__title">{mvpParticipant.riotId}</h1>
                  </div>
                  {mvpStats && (
                    <p className="tg-result-reveal__detail is-visible">
                      평균 KDA <strong>{mvpStats.averageKda.toFixed(2)}</strong>
                      {" · "}
                      평균 챔피언 피해량 <strong>{Math.round(mvpStats.averageDamage).toLocaleString("ko-KR")}</strong>
                      {" · "}
                      {mvpStats.games}판
                    </p>
                  )}
                </>
              ) : (
                <h1 className="tg-result-reveal__title is-visible">선정할 기록이 부족합니다</h1>
              )
            )}

            {stage === 3 && showReveal && (
              culpritParticipant ? (
                <>
                  <div className="tg-result-reveal__mvp is-visible is-culprit">
                    <PlayerAvatar
                      participant={culpritParticipant}
                      bootstrap={bootstrap}
                      size={HERO_AVATAR}
                      className="tg-result-reveal__mvp-avatar"
                    />
                    <h1 className="tg-result-reveal__title">{culpritParticipant.riotId}</h1>
                  </div>
                  <p className="tg-result-reveal__detail is-visible">
                    위 플레이어는 이번 내전의 범인입니다. 아, {roleDifferenceLabel(culpritParticipant, session)} 차이라구요?
                    그건 비밀인데… 본인만 즐거우면 된 거죠! <br/>다음 내전에서는 더 좋은 모습을 보여줄 거예요.
                  </p>
                </>
              ) : (
                <h1 className="tg-result-reveal__title is-visible">평가할 기록이 부족합니다</h1>
              )
            )}

            {stage === 4 && showReveal && (
              honeyBeeParticipants.length ? (
                <>
                  <ul className="tg-result-reveal__banner is-visible">
                    {honeyBeeParticipants.map((participant, index) => (
                      <li
                        className="tg-result-reveal__banner-item is-performance"
                        style={{ animationDelay: `${index * 140}ms` }}
                        key={participant.puuid}
                      >
                        <PlayerAvatar participant={participant} bootstrap={bootstrap} size={56} />
                        <span>{participant.riotId}</span>
                        <Image
                          className="tg-result-reveal__tier-emblem"
                          src={`/ranked-emblems/Rank=${tierAssetName(lpValueToTier(participant.currentLpValue).tier)}.png`}
                          alt={`${lpValueToTier(participant.currentLpValue).label} 엠블럼`}
                          width={52}
                          height={52}
                        />
                        <strong>이번 내전에서의 실력은 {lpValueToTier(participant.currentLpValue).label}급이었습니다.</strong>
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
          </div>

          <div className={`tg-result-reveal__cta tg-row${showCta ? " is-visible" : ""}`}>
            {stage === 0
              ? <Link className="tg-button" href={previousStepHref}>이전 단계로</Link>
              : (
                <button
                  className="tg-button"
                  type="button"
                  onClick={() => {
                    setBeat("hook");
                    setStage((current) => current - 1);
                  }}
                >
                  이전
                </button>
              )}
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
      <ActionBar>
        <Link className="tg-button" href={previousStepHref}>이전 단계로</Link>
        <button
          className="tg-button"
          type="button"
          onClick={() => { setBeat("hook"); setStage(0); }}
        >
          결과 다시 보기
        </button>
        <Link className="tg-button tg-button--primary" href="/dashboard">대시보드로</Link>
      </ActionBar>
      <AssistantSidebar session={session} surface="finish" onModeChange={(commentMode) => update(id, { commentMode })} />
    </main>
  );
}

/** 마무리 화면에서 돌아갈 직전 단계. 마무리에는 StepNav가 없어 여기서만 경로를 정한다. */
function previousStep(session: Session) {
  if (!session.preTeamProposal) return "players";
  if (!session.rounds.length) return "team";
  return "rebalance";
}

/**
 * 단계별 배경 오로라 색. 각 단계는 단일 색조만 쓰고, 전환은 배경에서 보간된다.
 * 승리팀은 팀 컬러, 원흉은 레드, 칭찬 단계(MVP·꿀벌)는 골드.
 */
function stageAuroraTheme(stage: number, winner: "blue" | "red" | undefined): AuroraTheme {
  if (stage === 1) return winner ?? "default";
  if (stage === 2 || stage === 4) return "gold";
  if (stage === 3) return "red";
  return "default";
}

function aggregateTrialStats(session: Session, puuid: string) {
  const stats = session.rounds
    .flatMap(({ trialResult }) => trialResult.playerStats)
    .filter((stat) => stat.puuid === puuid);
  if (!stats.length) return undefined;
  return {
    games: stats.length,
    averageKda: stats.reduce((sum, stat) => sum + stat.kda, 0) / stats.length,
    averageDamage: stats.reduce((sum, stat) => sum + stat.damageDealt, 0) / stats.length,
  };
}

/** 기대치가 산출된 판의 평균 성과/기대 비율이 가장 낮은 참가자. */
function worstAgainstExpectation(session: Session) {
  const ranked = session.participants.flatMap((participant) => {
    const performances = Object.values(participant.trialPerformanceByRound ?? {})
      .filter((performance) =>
        performance
        && !performance.unrated
        && performance.preStatScore != null
        && performance.tierExpectScore != null
      );
    if (!performances.length) return [];
    const ratios = performances.map((performance) => {
      const expected = (performance.preStatScore! + performance.tierExpectScore!) / 2;
      return performance.trialScore / Math.max(expected, Number.EPSILON);
    });
    return [{
      puuid: participant.puuid,
      belowCount: performances.filter((performance) => performance.roundBelowExpect).length,
      ratio: ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length,
    }];
  });
  return ranked.sort((a, b) => b.belowCount - a.belowCount || a.ratio - b.ratio)[0]?.puuid;
}

function roleDifferenceLabel(participant: Participant, session: Session) {
  const roles = session.rounds
    .flatMap(({ trialResult }) => trialResult.playerStats)
    .filter((stat) => stat.puuid === participant.puuid && stat.playedRole)
    .map((stat) => stat.playedRole as MainRole);
  const role = roles.length
    ? [...new Set(roles)].sort((a, b) =>
        roles.filter((item) => item === b).length - roles.filter((item) => item === a).length
      )[0]
    : participant.riotData.mainRole;
  const labels: Record<MainRole, string> = {
    TOP: "탑",
    JUNGLE: "정글",
    MIDDLE: "미드",
    BOTTOM: "원딜",
    UTILITY: "서폿",
  };
  return role ? labels[role] : "라인";
}

function tierAssetName(tier: string) {
  const lower = tier.toLocaleLowerCase();
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
}
