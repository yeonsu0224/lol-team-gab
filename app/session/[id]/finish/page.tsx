"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileIcon } from "@/components/player/ProfileIcon";
import { DonationPanel } from "@/components/shared/DonationPanel";
import {
  GradeBadge,
  HoneyBeeStatusBadge,
} from "@/components/shared/StatusBadge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { lpValueToTierDisplay } from "@/lib/constants/lpTable";
import { BootstrapProvider } from "@/lib/ddragon/BootstrapProvider";
import {
  buildRebalanceSummaryPayload,
  buildTeamSummaryPayload,
} from "@/lib/domain/summaryPayload";
import { updateSession } from "@/lib/storage/sessionStore";
import { useSession } from "@/lib/storage/useSessions";
import type {
  Participant,
  PerformanceGrade,
  RoundNumber,
} from "@/lib/types";

import styles from "./finish.module.scss";

const GRADE_ORDER: PerformanceGrade[] = ["F", "D", "C", "B", "A", "OP"];

function bestGrade(participant: Participant): PerformanceGrade | null {
  let best: PerformanceGrade | null = null;
  for (const perf of Object.values(participant.trialPerformanceByRound ?? {})) {
    if (!perf?.performanceGrade) {
      continue;
    }
    if (
      best === null ||
      GRADE_ORDER.indexOf(perf.performanceGrade) > GRADE_ORDER.indexOf(best)
    ) {
      best = perf.performanceGrade;
    }
  }
  return best;
}

export default function FinishPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const { session, isHydrated } = useSession(sessionId);

  const [mvpPuuid, setMvpPuuid] = useState("");
  const [evaluationNote, setEvaluationNote] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [saved, setSaved] = useState(false);

  const playedRounds = session?.rounds.length ?? 0;

  const rows = useMemo(() => {
    if (!session) {
      return [];
    }
    return session.participants.map((participant) => {
      const finalTier = lpValueToTierDisplay(participant.currentLpValue);
      const deltaValue = participant.currentLpValue - participant.preLpValue;
      return {
        participant,
        preLabel: participant.preTier.label,
        finalLabel: finalTier.label,
        deltaValue,
        grade: bestGrade(participant),
      };
    });
  }, [session]);

  const highlights = useMemo(() => {
    const rainbow = rows.filter(
      (row) => row.participant.honeyBeeBadge === "rainbowBee",
    );
    const op = rows.filter((row) => row.grade === "OP");
    const mvp =
      rows.length > 0
        ? [...rows].sort(
            (a, b) =>
              b.participant.personalScore - a.participant.personalScore,
          )[0]
        : null;
    return { rainbow, op, mvp };
  }, [rows]);

  const latestRecord = useMemo(() => {
    if (!session || session.rounds.length === 0) {
      return null;
    }
    return session.rounds.reduce((a, b) =>
      b.trialResult.round > a.trialResult.round ? b : a,
    );
  }, [session]);

  function handleSave() {
    updateSession(sessionId, {
      wrapUp: {
        endedAtRound: (playedRounds === 0
          ? 1
          : Math.min(4, playedRounds)) as 1 | 2 | 3 | 4,
        mvpPuuid: mvpPuuid || undefined,
        evaluationNote: evaluationNote.trim() || undefined,
        feedbackNote: feedbackNote.trim() || undefined,
        endedAt: new Date().toISOString(),
      },
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  if (!isHydrated) {
    return (
      <div className={styles.layout}>
        <PageHeader title="내전 종료" />
        <p className={styles.state}>불러오는 중…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.layout}>
        <PageHeader title="내전 종료" />
        <Banner tone="error">세션을 찾을 수 없습니다.</Banner>
        <Link className={styles.homeLink} href="/">
          처음으로
        </Link>
      </div>
    );
  }

  return (
    <BootstrapProvider>
      <div className={styles.layout}>
        <PageHeader
          title="내전 종료 · 마무리"
          description={`총 ${playedRounds}판 진행 · 최종 결과 요약`}
        />

        <Panel>
          <h2 className={styles.sectionTitle}>판별 결과</h2>
          {playedRounds === 0 ? (
            <p className={styles.state}>아직 입력된 시험 판이 없습니다.</p>
          ) : (
            <ol className={styles.roundList}>
              {session.rounds.map((record) => (
                <li key={record.round} className={styles.roundItem}>
                  <span className={styles.roundNo}>{record.round}판</span>
                  <span
                    className={`${styles.winner} ${
                      record.trialResult.winnerTeam === "blue"
                        ? styles.winnerBlue
                        : styles.winnerRed
                    }`}
                  >
                    {record.trialResult.winnerTeam === "blue" ? "블루" : "레드"}{" "}
                    승리
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel>
          <h2 className={styles.sectionTitle}>참가자 티어 변화</h2>
          <ul className={styles.playerList}>
            {rows.map((row) => (
              <li key={row.participant.puuid} className={styles.playerRow}>
                <div className={styles.identity}>
                  <ProfileIcon
                    profileIconId={row.participant.riotData.profileIconId}
                    name={row.participant.riotId}
                    size={36}
                  />
                  <span className={styles.name}>{row.participant.riotId}</span>
                </div>

                <div className={styles.tierChange}>
                  <span className={styles.preTier}>{row.preLabel}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                  <span className={styles.finalTier}>{row.finalLabel}</span>
                  <span
                    className={
                      row.deltaValue > 0
                        ? styles.deltaUp
                        : row.deltaValue < 0
                          ? styles.deltaDown
                          : styles.deltaFlat
                    }
                  >
                    {row.deltaValue > 0
                      ? `▲ ${row.deltaValue}`
                      : row.deltaValue < 0
                        ? `▼ ${Math.abs(row.deltaValue)}`
                        : "―"}
                  </span>
                </div>

                <div className={styles.badges}>
                  {row.grade ? <GradeBadge grade={row.grade} /> : null}
                  {row.participant.honeyBeeBadge !== "none" ? (
                    <HoneyBeeStatusBadge
                      badge={row.participant.honeyBeeBadge}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel tone="soft">
          <h2 className={styles.sectionTitle}>세션 하이라이트</h2>
          <ul className={styles.highlightList}>
            <li>
              <strong>총 판 수</strong> {playedRounds}판
            </li>
            {highlights.mvp ? (
              <li>
                <strong>MVP 후보</strong> {highlights.mvp.participant.riotId}
              </li>
            ) : null}
            {highlights.rainbow.length > 0 ? (
              <li>
                <strong>무지개 꿀벌</strong>{" "}
                {highlights.rainbow
                  .map((row) => row.participant.riotId)
                  .join(", ")}
              </li>
            ) : null}
            {highlights.op.length > 0 ? (
              <li>
                <strong>OP 등급</strong>{" "}
                {highlights.op.map((row) => row.participant.riotId).join(", ")}
              </li>
            ) : null}
          </ul>
        </Panel>

        <Panel>
          <h2 className={styles.sectionTitle}>평가 · 피드백</h2>
          <div className={styles.form}>
            <Field label="오늘의 MVP" htmlFor="finish-mvp">
              <Select
                id="finish-mvp"
                value={mvpPuuid}
                onChange={(event) => setMvpPuuid(event.target.value)}
              >
                <option value="">선택 안 함</option>
                {session.participants.map((participant) => (
                  <option key={participant.puuid} value={participant.puuid}>
                    {participant.riotId}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="총평 · 아쉬운 플레이" htmlFor="finish-eval">
              <textarea
                id="finish-eval"
                className={styles.textarea}
                rows={2}
                value={evaluationNote}
                onChange={(event) => setEvaluationNote(event.target.value)}
                placeholder="오늘 내전 총평을 남겨보세요."
              />
            </Field>

            <Field label="앱 개선 피드백" htmlFor="finish-feedback">
              <textarea
                id="finish-feedback"
                className={styles.textarea}
                rows={2}
                value={feedbackNote}
                onChange={(event) => setFeedbackNote(event.target.value)}
                placeholder="개선하면 좋을 점을 알려주세요."
              />
            </Field>

            <div className={styles.saveRow}>
              <Button onClick={handleSave}>{saved ? "저장됨" : "저장"}</Button>
            </div>
          </div>
        </Panel>

        <DonationPanel />

        <Link className={styles.homeLink} href="/">
          새 내전 시작하기
        </Link>
      </div>

      <FloatingAssistant
        sessionId={sessionId}
        initialMode={session.commentMode ?? "normal"}
        buildPayload={() => {
          if (latestRecord) {
            return buildRebalanceSummaryPayload(
              latestRecord.nextTeamProposal,
              latestRecord.trialResult.round as RoundNumber,
            );
          }
          return session.preTeamProposal
            ? buildTeamSummaryPayload(session.preTeamProposal)
            : null;
        }}
      />
    </BootstrapProvider>
  );
}
