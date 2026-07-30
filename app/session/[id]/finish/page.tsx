"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { FadeStage } from "@/components/motion/FadeStage";
import { DonationPanel } from "@/components/shared/DonationPanel";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
import { StarRating } from "@/components/shared/StarRating";
import { lpValueToTier } from "@/lib/domain/lp";
import { useSessions } from "@/lib/storage/useSessions";
import type { Session, SessionWrapUp, TeamSide } from "@/lib/types";
import styles from "./finish.module.scss";

export default function FinishPage() {
  const { id } = useParams<{ id: string }>();
  const { sessions, error, hydrated, update } = useSessions();
  const session = sessions.find((item) => item.id === id);
  const [rating, setRating] = useState<SessionWrapUp["performanceRating"]>();
  const [feedback, setFeedback] = useState<string>();
  const [saved, setSaved] = useState(false);
  const winner = useMemo(() => session ? finalWinner(session.rounds.map(({ trialResult }) => trialResult.winnerTeam)) : undefined, [session]);

  if (error) return <p role="alert">{error}</p>;
  if (!hydrated) return <p aria-busy>세션을 불러오는 중입니다…</p>;
  if (!session) return <p>세션을 찾을 수 없습니다.</p>;

  const selectedRating = rating ?? session.wrapUp?.performanceRating;
  const selectedFeedback = feedback ?? session.wrapUp?.feedbackNote ?? "";
  const highlights = buildHighlights(session);

  function save() {
    const endedAtRound = Math.max(1, session!.rounds.length) as 1 | 2 | 3 | 4;
    update(id, {
      wrapUp: {
        endedAtRound,
        winnerTeam: winner,
        performanceRating: selectedRating,
        feedbackNote: feedback === undefined ? session!.wrapUp?.feedbackNote : feedback.trim() || undefined,
        endedAt: new Date().toISOString(),
      },
    });
    setSaved(true);
  }

  return (
    <FadeStage stageKey={`finish-${session.rounds.length}`}>
      <section className={styles.shell}>
        <header className={`${styles.hero} ${winner === "blue" ? styles.heroBlue : winner === "red" ? styles.heroRed : ""}`}>
          <p>내전 마무리</p>
          <h2>{winner ? `${winner === "blue" ? "블루" : "레드"}팀 최종 승리` : "아직 저장된 판 결과가 없습니다"}</h2>
          <p>승수가 같으면 마지막으로 진행한 판의 승리팀을 최종 승자로 정합니다.</p>
          <div className={styles.chips}>
            {session.rounds.map(({ round, trialResult }) => (
              <span key={round} className={`${styles.chip} ${styles[trialResult.winnerTeam]}`}>
                {round}판 · {trialResult.winnerTeam === "blue" ? "블루" : "레드"} 승
              </span>
            ))}
          </div>
        </header>

        <ReasonPanel
          title="최종 결과 판정 근거"
          reasons={[
            `블루 ${session.rounds.filter(({ trialResult }) => trialResult.winnerTeam === "blue").length}승 · 레드 ${session.rounds.filter(({ trialResult }) => trialResult.winnerTeam === "red").length}승`,
            "동률일 때는 마지막 판 승리팀을 적용합니다.",
            "성과 평가는 기록이 충분한 참가자에게만 표시합니다.",
          ]}
        />

        <section className={styles.panel}>
          <h2>세션 하이라이트</h2>
          <div className={styles.highlights}>
            {highlights.map((highlight) => <span className={styles.chip} key={highlight}>{highlight}</span>)}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>참가자 티어 변화와 성과</h2>
          <div className={styles.grid}>
            {session.participants.map((participant) => {
              const finalTier = lpValueToTier(participant.currentLpValue);
              const grades = Object.entries(participant.trialPerformanceByRound ?? {})
                .filter(([, performance]) => performance && !performance.unrated)
                .map(([round, performance]) => `${round}판 ${performance?.performanceGrade}`);
              return (
                <article className={styles.player} key={participant.puuid}>
                  <strong>{participant.riotId}</strong>
                  <p>{participant.preTier.label} → {finalTier.label}</p>
                  <p>{participant.currentLpValue >= participant.preLpValue ? "▲" : "▼"} {Math.abs(participant.currentLpValue - participant.preLpValue)} LP</p>
                  <p>{grades.length ? grades.join(" · ") : "성과 기록 부족 · 평가 생략"}</p>
                  {participant.honeyBeeBadge !== "none" && <p>🐝 {participant.honeyBeeBadge}</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>내전 성과 별점</h2>
          <p>별점은 하나만 남기고, 추가 의견은 텍스트로 작성합니다.</p>
          <StarRating value={selectedRating} onChange={setRating} />
          <textarea
            className={styles.textarea}
            aria-label="내전 피드백"
            placeholder="다음 내전에 참고할 피드백"
            value={selectedFeedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              setSaved(false);
            }}
          />
          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.primary}`} type="button" onClick={save}>마무리 저장</button>
            <Link className={styles.button} href="/dashboard">대시보드로</Link>
            {saved && <span role="status">저장했습니다.</span>}
          </div>
        </section>

        <DonationPanel />
        <FloatingAssistant
          session={session}
          surface="finish"
          onModeChange={(commentMode) => update(id, { commentMode })}
        />
      </section>
    </FadeStage>
  );
}

function finalWinner(results: TeamSide[]): TeamSide | undefined {
  if (!results.length) return undefined;
  const blue = results.filter((side) => side === "blue").length;
  const red = results.length - blue;
  return blue === red ? results.at(-1) : blue > red ? "blue" : "red";
}

function buildHighlights(session: Session) {
  const highlights = session.participants.flatMap((participant) => {
    const grades = Object.values(participant.trialPerformanceByRound ?? {})
      .filter((performance) => !performance.unrated && performance.performanceGrade);
    return [
      ...(participant.honeyBeeBadge !== "none" ? [`${participant.riotId} · 🐝 ${participant.honeyBeeBadge}`] : []),
      ...(grades.some(({ performanceGrade }) => performanceGrade === "OP") ? [`${participant.riotId} · OP 성과`] : []),
    ];
  });
  return highlights.length ? highlights : ["저장된 성과 하이라이트가 없습니다."];
}
