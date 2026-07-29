"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ParticipantRegistration } from "@/components/player/ParticipantRegistration";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Panel } from "@/components/ui/Panel";
import { BootstrapProvider } from "@/lib/ddragon/BootstrapProvider";
import { resolvePreUnrated } from "@/lib/player/analysis";
import { updateSession } from "@/lib/storage/sessionStore";
import { useSession } from "@/lib/storage/useSessions";
import { analyzeSession } from "@/lib/player/analysis";

import styles from "./players.module.scss";

const TEAM_READY_SIZES = [8, 10];

export default function PlayersPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const { session, isHydrated } = useSession(sessionId);
  const participants = useMemo(() => session?.participants ?? [], [session]);

  function handleRemove(puuid: string) {
    const next = participants.filter(
      (participant) => participant.puuid !== puuid,
    );
    updateSession(sessionId, { participants: analyzeSession(next) });
  }

  const count = participants.length;
  const isReady = TEAM_READY_SIZES.includes(count);

  return (
    <BootstrapProvider>
      <PageHeader
        title="참가자 등록"
        description="Riot ID를 검색해 참가자를 추가하고 전력을 분석합니다."
        action={
          isReady ? (
            <Link
              className={styles.readyBadge}
              href={`/session/${sessionId}/team`}
            >
              {count}/10 · 팀 제안하기
            </Link>
          ) : (
            <span className={styles.waitBadge}>
              {count}/10 · 8명 또는 10명 필요
            </span>
          )
        }
      />

      <div className={styles.layout}>
        <Panel>
          <ParticipantRegistration
            sessionId={sessionId}
            participants={participants}
          />
        </Panel>

        {!isHydrated ? (
          <p className={styles.state}>참가자를 불러오는 중…</p>
        ) : count === 0 ? (
          <p className={styles.state}>
            아직 등록된 참가자가 없습니다. 위에서 Riot ID를 검색해 추가하세요.
          </p>
        ) : (
          <ul className={styles.list}>
            {participants.map((participant) => (
              <li key={participant.puuid}>
                <PlayerCard
                  participant={participant}
                  preUnrated={resolvePreUnrated(participant)}
                  onRemove={handleRemove}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </BootstrapProvider>
  );
}
