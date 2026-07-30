"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { FadeStage } from "@/components/motion/FadeStage";
import { TeamSlideIn } from "@/components/motion/TeamSlideIn";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
import type { RankedTier } from "@/lib/constants/lpTable";
import { lpValueToTier } from "@/lib/domain/lp";
import {
  buildTeamProposal,
  proposalFromTeams,
  refreshParticipantScores,
  replayTrialRounds,
  type TrialDraft,
} from "@/lib/domain/sessionWorkflow";
import {
  ClientApiError,
  loadBootstrap,
  loadParticipant,
  requestJson,
  searchAccounts,
  type AccountResult,
  type DataDragonBootstrap,
  type MatchHistoryResult,
} from "@/lib/player/client";
import { rankedEmblemUrl } from "@/lib/riot/ddragon/urls";
import { useSessions } from "@/lib/storage/useSessions";
import { useUserProfile } from "@/lib/storage/useUserProfile";
import type {
  MainRole,
  Participant,
  RoundNumber,
  Session,
  TeamProposal,
  TeamSide,
} from "@/lib/types";
import styles from "./SessionWorkspace.module.scss";

type View = "players" | "team" | "trial" | "rebalance";

interface RiotMatch {
  metadata: { matchId: string };
  info: {
    participants: Array<{
      puuid: string;
      riotIdGameName?: string;
      riotIdTagline?: string;
      kills: number;
      deaths: number;
      assists: number;
      totalDamageDealtToChampions: number;
      teamId: number;
      win: boolean;
    }>;
  };
}

interface TrialFormState {
  winnerTeam: TeamSide;
  matchId: string;
  bluePuuids: string[];
  redPuuids: string[];
  stats: Record<string, { kda: string; damage: string }>;
}

export function SessionWorkspace({
  sessionId,
  view,
}: {
  sessionId: string;
  view: View;
}) {
  const { sessions, error, hydrated, update } = useSessions();
  const session = sessions.find(({ id }) => id === sessionId);
  const [bootstrap, setBootstrap] = useState<DataDragonBootstrap | null>(null);
  const [assetWarning, setAssetWarning] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadBootstrap()
      .then(setBootstrap)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setAssetWarning(messageOf(cause, "게임 이미지 정보를 불러오지 못해 대체 표시를 사용합니다."));
        }
      });
    return () => controller.abort();
  }, []);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!hydrated) {
    return (
      <section className={styles.shell} aria-busy>
        <p className={styles.muted}>세션을 불러오는 중입니다…</p>
      </section>
    );
  }
  if (!session) {
    return (
      <section className={styles.shell}>
        <h2>세션을 찾을 수 없습니다</h2>
        <p className={styles.muted}>대시보드에서 저장된 내전을 다시 선택해 주세요.</p>
        <Link className={`${styles.button} ${styles.buttonPrimary}`} href="/dashboard">
          대시보드로
        </Link>
      </section>
    );
  }

  const save = (next: Session) =>
    update(sessionId, {
      participants: next.participants,
      preTeamProposal: next.preTeamProposal,
      rounds: next.rounds,
      commentMode: next.commentMode,
      wrapUp: next.wrapUp,
    });

  return (
    <>
      {assetWarning && <Notice kind="warning">{assetWarning}</Notice>}
      <FadeStage stageKey={`${view}-${session.rounds.length}`}>
        {view === "players" && (
          <PlayersView session={session} bootstrap={bootstrap} save={save} />
        )}
        {view === "team" && (
          <TeamView session={session} bootstrap={bootstrap} save={save} />
        )}
        {view === "trial" && (
          <TrialView session={session} save={save} />
        )}
        {view === "rebalance" && (
          <RebalanceView session={session} bootstrap={bootstrap} save={save} />
        )}
      </FadeStage>
      {view !== "players" && (
        <FloatingAssistant
          session={session}
          surface={view}
          onModeChange={(commentMode) => update(sessionId, { commentMode })}
        />
      )}
    </>
  );
}

function PlayersView({
  session,
  bootstrap,
  save,
}: {
  session: Session;
  bootstrap: DataDragonBootstrap | null;
  save: (session: Session) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const ready = session.participants.length === 8 || session.participants.length === 10;

  async function add(riotId: string, manualTier?: ManualTier) {
    setError("");
    try {
      const participant = await loadParticipant(riotId, setStatus, manualTier);
      if (session.participants.some(({ puuid }) => puuid === participant.puuid)) {
        throw new ClientApiError("이미 등록된 참가자입니다.", "DUPLICATE_PLAYER");
      }
      if (session.participants.length >= 10) {
        throw new ClientApiError("참가자는 최대 10명까지 등록할 수 있습니다.");
      }
      const participants = refreshParticipantScores([...session.participants, participant]);
      save({ ...session, participants, preTeamProposal: undefined, rounds: [] });
      setStatus(`${participant.riotId} 분석을 완료했습니다.`);
    } catch (cause) {
      setStatus("");
      setError(messageOf(cause));
    }
  }

  function remove(puuid: string) {
    const participants = refreshParticipantScores(
      session.participants.filter((participant) => participant.puuid !== puuid),
    );
    save({ ...session, participants, preTeamProposal: undefined, rounds: [] });
  }

  function propose() {
    if (!ready) return;
    const participants = refreshParticipantScores(session.participants);
    const preTeamProposal = buildTeamProposal(participants);
    save({ ...session, participants, preTeamProposal, rounds: [] });
    router.push(`/session/${session.id}/team`);
  }

  const left = session.participants.slice(0, 5);
  const right = session.participants.slice(5, 10);
  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h2>참가자 등록 · 전력 분석</h2>
          <p className={styles.meta}>{session.participants.length}/10명 등록</p>
        </div>
      </header>
      <p className={styles.hint}>
        게임명#태그를 입력하세요. 부캐라면 본캐 계정을 입력하세요. 검색은 Riot의 정확한 계정
        조회 범위 안에서 제공됩니다.
      </p>
      <div className={styles.formPanel}>
        <RiotSearchForm existing={session.participants} onAdd={add} />
        {status && <p className={status.includes("완료") ? styles.success : styles.loading}>{status}</p>}
        {error && <Notice kind="error">{error}</Notice>}
      </div>
      {session.participants.length ? (
        <div className={styles.registrationGrid} aria-label="등록 참가자">
          <div className={styles.registrationColumn}>
            {left.map((participant) => (
              <PlayerCard
                key={participant.puuid}
                participant={participant}
                bootstrap={bootstrap}
                compact
                onRemove={() => remove(participant.puuid)}
              />
            ))}
          </div>
          <div className={styles.registrationColumn}>
            {right.map((participant) => (
              <PlayerCard
                key={participant.puuid}
                participant={participant}
                bootstrap={bootstrap}
                compact
                onRemove={() => remove(participant.puuid)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>검색 결과에서 참가자를 선택하면 분석 카드가 추가됩니다.</div>
      )}
      {!ready && (
        <Notice kind="warning">
          팀 제안은 8명 또는 10명일 때 가능합니다. 현재 {session.participants.length}명입니다.
        </Notice>
      )}
      <div className={styles.actionRow}>
        <span className={styles.muted}>분석에 실패한 참가자는 다른 참가자 등록을 막지 않습니다.</span>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary} ${ready ? styles.readyCta : ""}`}
          disabled={!ready}
          onClick={propose}
        >
          {session.participants.length}/10 · 팀 제안하기
        </button>
      </div>
      <ReasonPanel
        title="참가자 전력 산정 근거"
        reasons={[
          "솔로 랭크를 우선하고, 없으면 자유 랭크 또는 명시적으로 입력한 티어를 사용합니다.",
          "티어·LP·최근 주 라인 승률과 경기 기록을 함께 봅니다.",
          "표본이 3판보다 적거나 핵심 기록이 없으면 기록 부족으로 두고 성과를 평가하지 않습니다.",
        ]}
      />
    </section>
  );
}

function TeamView({
  session,
  bootstrap,
  save,
}: {
  session: Session;
  bootstrap: DataDragonBootstrap | null;
  save: (session: Session) => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<{ puuid: string; side: TeamSide } | null>(null);
  const [miniSide, setMiniSide] = useState<TeamSide | null>(null);
  const [message, setMessage] = useState("");
  const proposal = session.preTeamProposal;

  useEffect(() => {
    if (!proposal && (session.participants.length === 8 || session.participants.length === 10)) {
      const participants = refreshParticipantScores(session.participants);
      save({ ...session, participants, preTeamProposal: buildTeamProposal(participants) });
    }
  }, [proposal, save, session]);

  if (!proposal) {
    return (
      <section className={styles.shell}>
        <h2>1판 팀 제안</h2>
        <Notice kind="warning">8명 또는 10명의 분석이 끝나야 팀을 제안할 수 있습니다.</Notice>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/session/${session.id}/players`}>
          참가자 등록으로
        </Link>
      </section>
    );
  }
  const currentProposal = proposal;

  function persistProposal(next: TeamProposal, participants = session.participants) {
    save({ ...session, participants, preTeamProposal: next });
  }

  function selectForSwap(participant: Participant, side: TeamSide) {
    if (!selected) {
      setSelected({ puuid: participant.puuid, side });
      return;
    }
    if (selected.side === side) {
      setSelected({ puuid: participant.puuid, side });
      return;
    }
    const blue = [...currentProposal.blueTeam];
    const red = [...currentProposal.redTeam];
    const blueId = side === "blue" ? participant.puuid : selected.puuid;
    const redId = side === "red" ? participant.puuid : selected.puuid;
    const blueIndex = blue.findIndex(({ puuid }) => puuid === blueId);
    const redIndex = red.findIndex(({ puuid }) => puuid === redId);
    if (blueIndex < 0 || redIndex < 0) return;
    [blue[blueIndex], red[redIndex]] = [red[redIndex], blue[blueIndex]];
    persistProposal(proposalFromTeams(blue, red));
    setSelected(null);
    setMessage("선수 교체와 전력 지표를 반영했습니다.");
  }

  function remove(participant: Participant) {
    const participants = refreshParticipantScores(
      session.participants.filter(({ puuid }) => puuid !== participant.puuid),
    );
    const blue = currentProposal.blueTeam.filter(({ puuid }) => puuid !== participant.puuid);
    const red = currentProposal.redTeam.filter(({ puuid }) => puuid !== participant.puuid);
    persistProposal(proposalFromTeams(blue, red), participants);
    setMessage("선수를 제외했습니다. 8명 또는 10명이 되면 자동 제안을 다시 만들 수 있습니다.");
  }

  async function addToTeam(riotId: string, manualTier?: ManualTier) {
    try {
      const added = await loadParticipant(riotId, setMessage, manualTier);
      if (session.participants.some(({ puuid }) => puuid === added.puuid)) {
        throw new ClientApiError("이미 등록된 참가자입니다.");
      }
      if (session.participants.length >= 10) throw new ClientApiError("최대 10명까지 추가할 수 있습니다.");
      const participants = refreshParticipantScores([...session.participants, added]);
      const byId = new Map(participants.map((player) => [player.puuid, player]));
      const blue = currentProposal.blueTeam.map(({ puuid }) => byId.get(puuid)).filter(isParticipant);
      const red = currentProposal.redTeam.map(({ puuid }) => byId.get(puuid)).filter(isParticipant);
      (miniSide === "blue" ? blue : red).push(byId.get(added.puuid) as Participant);
      persistProposal(proposalFromTeams(blue, red), participants);
      setMessage(`${added.riotId}을 ${miniSide === "blue" ? "블루" : "레드"} 팀에 추가했습니다.`);
    } catch (cause) {
      setMessage(messageOf(cause));
    }
  }

  function rebuild() {
    if (session.participants.length !== 8 && session.participants.length !== 10) return;
    const participants = refreshParticipantScores(session.participants);
    persistProposal(buildTeamProposal(participants), participants);
    setMessage("현재 참가자로 균형 제안을 다시 만들었습니다.");
  }

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h2>1판 팀 제안</h2>
          <p className={styles.meta}>선수 두 명을 차례로 선택하면 서로 교체됩니다.</p>
        </div>
        <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={rebuild}>
          자동 제안 다시 만들기
        </button>
      </header>
      <PowerRatio proposal={currentProposal} />
      <div className={styles.boards}>
        {(["blue", "red"] as const).map((side) => (
          <TeamColumn
            key={side}
            side={side}
            proposal={currentProposal}
            bootstrap={bootstrap}
            selectedPuuid={selected?.puuid}
            onSelect={selectForSwap}
            onRemove={remove}
            onAdd={() => setMiniSide(miniSide === side ? null : side)}
          >
            {miniSide === side && (
              <div className={styles.miniModal}>
                <div className={styles.modalHeader}>
                  <strong>{side === "blue" ? "블루" : "레드"} 팀 선수 추가</strong>
                  <button className={styles.button} type="button" onClick={() => setMiniSide(null)}>
                    닫기
                  </button>
                </div>
                <RiotSearchForm existing={session.participants} onAdd={addToTeam} compact />
              </div>
            )}
          </TeamColumn>
        ))}
      </div>
      {message && <Notice kind={message.includes("못") || message.includes("최대") ? "error" : "success"}>{message}</Notice>}
      <ReasonPanel
        title="팀 제안 근거"
        reasons={[
          `블루 ${currentProposal.bluePowerPct}% · 레드 ${currentProposal.redPowerPct}% 전력 비율입니다.`,
          `평균 티어 차이는 약 ${currentProposal.tierDiffDivisions}구간입니다.`,
          "주 포지션과 주로 플레이한 챔피언의 겹침은 참고 정보로만 표시합니다.",
        ]}
      />
      <div className={styles.actionRow}>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/session/${session.id}/finish`}>
          내전 종료하기
        </Link>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={currentProposal.blueTeam.length !== currentProposal.redTeam.length}
          onClick={() => router.push(`/session/${session.id}/trial`)}
        >
          1판 진행 · 결과 입력
        </button>
      </div>
    </section>
  );
}

function TrialView({
  session,
  save,
}: {
  session: Session;
  save: (session: Session) => void;
}) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const initialRound = Math.min(3, session.rounds.length + 1) as RoundNumber;
  const [activeRound, setActiveRound] = useState<RoundNumber>(initialRound);
  const [forms, setForms] = useState<Record<RoundNumber, TrialFormState>>(() =>
    buildInitialForms(session),
  );
  const [modal, setModal] = useState<"match" | "recent" | "vision" | "mapping" | null>(null);
  const [pendingMatch, setPendingMatch] = useState<RiotMatch | null>(null);
  const [message, setMessage] = useState("");
  const proposal = proposalForRound(session, activeRound);
  const form = forms[activeRound];

  if (!proposal) {
    return (
      <section className={styles.shell}>
        <h2>시험 판 결과</h2>
        <Notice kind="warning">먼저 1판 팀 제안을 저장해 주세요.</Notice>
      </section>
    );
  }

  function updateForm(update: Partial<TrialFormState>) {
    setForms((current) => ({
      ...current,
      [activeRound]: { ...current[activeRound], ...update },
    }));
  }

  function updateStat(puuid: string, key: "kda" | "damage", value: string) {
    setForms((current) => ({
      ...current,
      [activeRound]: {
        ...current[activeRound],
        stats: {
          ...current[activeRound].stats,
          [puuid]: { ...current[activeRound].stats[puuid], [key]: value },
        },
      },
    }));
  }

  function applyMatch(match: RiotMatch) {
    const sessionIds = new Set(session.participants.map(({ puuid }) => puuid));
    const mapped = match.info.participants.filter(({ puuid }) => sessionIds.has(puuid));
    if (mapped.length < session.participants.length) {
      setPendingMatch(match);
      setModal("mapping");
      setMessage(`${mapped.length}명만 자동으로 일치했습니다. 나머지 경기 참가자를 직접 연결해 주세요.`);
      return;
    }
    applyMatchEntries(match, Object.fromEntries(mapped.map(({ puuid }) => [puuid, puuid])));
  }

  function applyMatchEntries(match: RiotMatch, mapping: Record<string, string>) {
    const mapped = match.info.participants
      .map((entry) => ({ ...entry, puuid: mapping[entry.puuid] ?? "" }))
      .filter(({ puuid }) => Boolean(puuid));
    const bluePuuids = mapped.filter(({ teamId }) => teamId === 100).map(({ puuid }) => puuid);
    const redPuuids = mapped.filter(({ teamId }) => teamId === 200).map(({ puuid }) => puuid);
    const stats = { ...form.stats };
    mapped.forEach((entry) => {
      stats[entry.puuid] = {
        kda: `${entry.kills}/${entry.deaths}/${entry.assists}`,
        damage: entry.totalDamageDealtToChampions.toLocaleString("ko-KR"),
      };
    });
    const winner = mapped.find(({ win }) => win);
    updateForm({
      matchId: match.metadata.matchId,
      bluePuuids: bluePuuids.length ? bluePuuids : form.bluePuuids,
      redPuuids: redPuuids.length ? redPuuids : form.redPuuids,
      winnerTeam: winner?.teamId === 200 ? "red" : "blue",
      stats,
    });
    setMessage(`${mapped.length}명의 경기 기록을 폼에 채웠습니다. 저장 전에 확인해 주세요.`);
    setPendingMatch(null);
    setModal(null);
  }

  function fillDummyData() {
    const stats: TrialFormState["stats"] = {};
    const seed = activeRound * 17;
    session.participants.forEach((participant, index) => {
      const kills = 3 + ((seed + index * 3) % 10);
      const deaths = 1 + ((seed + index * 5) % 6);
      const assists = 2 + ((seed + index * 7) % 12);
      const damage = 12_000 + ((seed + index * 1_337) % 18_000);
      stats[participant.puuid] = {
        kda: `${kills}/${deaths}/${assists}`,
        damage: damage.toLocaleString("ko-KR"),
      };
    });
    // Alternate winners so multi-round flows are easy to smoke-test.
    const winnerTeam: TeamSide = activeRound % 2 === 1 ? "blue" : "red";
    updateForm({ winnerTeam, stats });
    setMessage(
      `${activeRound}판 가상 데이터로 채웠습니다 (${winnerTeam === "blue" ? "블루" : "레드"}팀 승리). 저장 전에 확인해 주세요.`,
    );
  }

  function saveRound() {
    const drafts = ([1, 2, 3] as const)
      .filter((round) => round <= Math.max(activeRound, session.rounds.length))
      .map((round) => toTrialDraft(round, forms[round]))
      .filter((draft): draft is TrialDraft => Boolean(draft));
    const next = replayTrialRounds(session, drafts);
    if (next.rounds.length < activeRound) {
      setMessage("이전 판부터 순서대로 저장해 주세요.");
      return;
    }
    save(next);
    setMessage(`${activeRound}판 결과를 저장하고 다음 팀 제안을 계산했습니다.`);
    router.push(`/session/${session.id}/rebalance?round=${activeRound + 1}`);
  }

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h2>시험 판 결과 입력</h2>
          <p className={styles.meta}>입력값은 탭과 모달을 전환해도 유지됩니다.</p>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="시험 판 선택">
          {([1, 2, 3] as const).map((round) => (
            <button
              key={round}
              type="button"
              role="tab"
              aria-selected={activeRound === round}
              className={`${styles.button} ${activeRound === round ? styles.tabActive : ""}`}
              onClick={() => setActiveRound(round)}
            >
              {round}판 {session.rounds.some((record) => record.round === round) ? "✓" : ""}
            </button>
          ))}
        </div>
      </header>
      <div className={styles.assistRow}>
        <span className={styles.hint}>기본은 수동 입력이며 보조 결과는 자동 저장되지 않습니다.</span>
        <div className={styles.assistRow}>
          <button className={styles.button} type="button" onClick={() => setModal("match")}>
            경기 ID
          </button>
          <button className={styles.button} type="button" onClick={() => setModal("recent")}>
            최근 경기
          </button>
          <button className={styles.button} type="button" onClick={() => setModal("vision")}>
            점수판 이미지
          </button>
          <button className={styles.button} type="button" onClick={fillDummyData}>
            가상 데이터 채우기
          </button>
        </div>
      </div>
      <div className={styles.winnerChoices}>
        {(["blue", "red"] as const).map((side) => (
          <label key={side} className={styles.winnerChoice}>
            <input
              type="radio"
              name={`winner-${activeRound}`}
              checked={form.winnerTeam === side}
              onChange={() => updateForm({ winnerTeam: side })}
            />{" "}
            {side === "blue" ? "블루팀 승리" : "레드팀 승리"}
          </label>
        ))}
      </div>
      <div className={styles.trialTeams}>
        {(["blue", "red"] as const).map((side) => {
          const team = side === "blue" ? proposal.blueTeam : proposal.redTeam;
          return (
            <div key={side} className={`${styles.team} ${styles[side]}`}>
              <h3>{side === "blue" ? "블루팀" : "레드팀"}</h3>
              {team.map((participant, index) => (
                <TeamSlideIn key={participant.puuid} side={side} index={index}>
                  <div className={styles.trialRow}>
                    <span>
                      <LaneIcon role={participant.riotData.mainRole} /> {participant.riotId}
                    </span>
                    <input
                      className={styles.input}
                      aria-label={`${participant.riotId} KDA`}
                      placeholder="3.5 또는 12/4/9"
                      value={form.stats[participant.puuid]?.kda ?? ""}
                      onChange={(event) => updateStat(participant.puuid, "kda", event.target.value)}
                    />
                    <input
                      className={styles.input}
                      aria-label={`${participant.riotId} 피해량`}
                      placeholder="20,170"
                      value={form.stats[participant.puuid]?.damage ?? ""}
                      onChange={(event) => updateStat(participant.puuid, "damage", event.target.value)}
                    />
                  </div>
                </TeamSlideIn>
              ))}
            </div>
          );
        })}
      </div>
      {message && <Notice kind={message.includes("못") ? "error" : "success"}>{message}</Notice>}
      <ReasonPanel
        title={`${activeRound}판 평가 근거`}
        reasons={[
          "누적 티어 변화는 이전 기록 70%, 이번 판 KDA·피해량 30%로 반영합니다.",
          "기대 이상이 이어지면 꿀벌 표시가 강화되며, 기록 부족 참가자는 연속 판정에서 제외합니다.",
          "성과 등급은 기록이 충분할 때만 표시하고 승패만 입력한 경우 평가를 생략합니다.",
        ]}
      />
      <div className={styles.actionRow}>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/session/${session.id}/finish`}>
          내전 종료하기
        </Link>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={saveRound}>
          {activeRound}판 저장 · {activeRound + 1}판 팀 보기
        </button>
      </div>
      {modal === "match" && (
        <MatchIdModal
          initialId={form.matchId}
          onClose={() => setModal(null)}
          onApply={applyMatch}
        />
      )}
      {modal === "recent" && (
        <RecentMatchesModal
          session={session}
          preferredPuuid={
            profile.myPuuid && session.participants.some(({ puuid }) => puuid === profile.myPuuid)
              ? profile.myPuuid
              : undefined
          }
          onClose={() => setModal(null)}
          onApply={applyMatch}
        />
      )}
      {modal === "vision" && (
        <VisionModal
          participants={session.participants}
          onClose={() => setModal(null)}
          onApply={(values) => {
            const stats = { ...form.stats };
            values.forEach(({ puuid, kda, damage }) => {
              if (puuid) stats[puuid] = { kda, damage };
            });
            updateForm({ stats });
            setMessage("이미지 분석 초안을 폼에 채웠습니다. 저장 전에 확인해 주세요.");
            setModal(null);
          }}
        />
      )}
      {modal === "mapping" && pendingMatch && (
        <MatchMappingModal
          match={pendingMatch}
          participants={session.participants}
          onClose={() => {
            setPendingMatch(null);
            setModal(null);
          }}
          onApply={(mapping) => applyMatchEntries(pendingMatch, mapping)}
        />
      )}
    </section>
  );
}

function RebalanceView({
  session,
  bootstrap,
  save,
}: {
  session: Session;
  bootstrap: DataDragonBootstrap | null;
  save: (session: Session) => void;
}) {
  const router = useRouter();
  const defaultTarget = Math.min(4, Math.max(2, session.rounds.length + 1)) as 2 | 3 | 4;
  const [target, setTarget] = useState<2 | 3 | 4>(defaultTarget);
  const [selected, setSelected] = useState<{ puuid: string; side: TeamSide } | null>(null);
  const record = session.rounds.find(({ nextTeamProposal }) => nextTeamProposal.targetRound === target);
  const proposal = record?.nextTeamProposal;
  const changed = new Set(proposal?.changes?.flatMap(({ outPuuid, inPuuid }) => [outPuuid, inPuuid]));
  const previous = target === 2
    ? session.preTeamProposal
    : session.rounds.find(({ round }) => round === target - 1)?.nextTeamProposal;

  if (!proposal) {
    return (
      <section className={styles.shell}>
        <header className={styles.header}>
          <h2>{target}판 재밸런스</h2>
          <RoundTargetTabs value={target} onChange={setTarget} />
        </header>
        <Notice kind="warning">{target - 1}판 결과를 먼저 저장하면 팀 제안이 생성됩니다.</Notice>
        <div className={styles.actionRow}>
          <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/session/${session.id}/finish`}>
            내전 종료하기
          </Link>
          <Link className={`${styles.button} ${styles.buttonPrimary}`} href={`/session/${session.id}/trial`}>
            시험 판 입력으로
          </Link>
        </div>
      </section>
    );
  }
  const currentProposal = proposal;

  function swap(participant: Participant, side: TeamSide) {
    if (!selected || selected.side === side) {
      setSelected({ puuid: participant.puuid, side });
      return;
    }
    const blue = [...currentProposal.blueTeam];
    const red = [...currentProposal.redTeam];
    const blueId = side === "blue" ? participant.puuid : selected.puuid;
    const redId = side === "red" ? participant.puuid : selected.puuid;
    const blueIndex = blue.findIndex(({ puuid }) => puuid === blueId);
    const redIndex = red.findIndex(({ puuid }) => puuid === redId);
    if (blueIndex < 0 || redIndex < 0) return;
    [blue[blueIndex], red[redIndex]] = [red[redIndex], blue[blueIndex]];
    const nextProposal = proposalFromTeams(blue, red, target, previous);
    const rounds = session.rounds.map((round) =>
      round.round === record?.round ? { ...round, nextTeamProposal: nextProposal } : round,
    );
    save({ ...session, rounds });
    setSelected(null);
  }

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h2>{target}판 재밸런스 제안</h2>
          <p className={styles.meta}>직전 판 누적 전력과 성과를 반영했습니다.</p>
        </div>
        <RoundTargetTabs value={target} onChange={setTarget} />
      </header>
      <PowerRatio proposal={currentProposal} />
      {currentProposal.changes?.length ? (
        <div className={styles.changeList} aria-label="팀 교체">
          {currentProposal.changes.map((change) => (
            <span className={styles.changeLabel} key={`${change.toTeam}-${change.outPuuid}`}>
              {change.toTeam === "blue" ? "블루" : "레드"}팀 ·{" "}
              {nameOf(session, change.outPuuid)} 나감 ↔ {nameOf(session, change.inPuuid)} 들어옴
            </span>
          ))}
        </div>
      ) : (
        <p className={styles.muted}>직전 구성과 비교해 팀 이동이 없습니다.</p>
      )}
      <div className={styles.boards}>
        {(["blue", "red"] as const).map((side) => (
          <TeamColumn
            key={side}
            side={side}
            proposal={currentProposal}
            bootstrap={bootstrap}
            selectedPuuid={selected?.puuid}
            changedPuuids={changed}
            previous={previous}
            round={target - 1 as RoundNumber}
            onSelect={swap}
          />
        ))}
      </div>
      <ReasonPanel
        title="재밸런스 근거"
        reasons={[
          `블루 ${currentProposal.bluePowerPct}% · 레드 ${currentProposal.redPowerPct}%의 현재 전력을 비교했습니다.`,
          "직전 판의 성과와 누적 티어 변화를 반영하되 기록 부족 참가자는 부정적으로 평가하지 않습니다.",
          "강조된 카드는 직전 팀에서 이동한 참가자이며 직접 교체하면 지표도 즉시 다시 계산됩니다.",
        ]}
      />
      <div className={styles.actionRow}>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`/session/${session.id}/finish`}>
          내전 종료하기
        </Link>
        {target < 4 ? (
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            type="button"
            onClick={() => router.push(`/session/${session.id}/trial`)}
          >
            {target}판 진행 · 결과 입력
          </button>
        ) : (
          <span className={styles.success}>4판은 팀 제안과 수동 구성만 제공됩니다.</span>
        )}
      </div>
    </section>
  );
}

type ManualTier = { tier: RankedTier; rank: string; lp: number };

function RiotSearchForm({
  existing,
  onAdd,
  compact = false,
}: {
  existing: Participant[];
  onAdd: (riotId: string, manualTier?: ManualTier) => Promise<void>;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AccountResult[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [manualEnabled, setManualEnabled] = useState(false);
  const [manualTier, setManualTier] = useState<ManualTier>({
    tier: "GOLD",
    rank: "IV",
    lp: 0,
  });

  useEffect(() => {
    const trimmed = query.trim();
    const incompleteTag = /#.$/.test(trimmed) || trimmed.endsWith("#");
    if (trimmed.length < 2 || incompleteTag) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState("loading");
      searchAccounts(trimmed, controller.signal)
        .then((accounts) => {
          const existingIds = new Set(existing.map(({ puuid }) => puuid));
          const filtered = accounts.filter(({ puuid }) => !existingIds.has(puuid));
          setResults(filtered);
          setState(filtered.length ? "ready" : "empty");
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setMessage(messageOf(cause));
          setState("error");
        });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [existing, query]);

  async function submit(riotId: string) {
    if (!riotId.trim() || adding) return;
    setAdding(true);
    setResults([]);
    try {
      await onAdd(riotId.trim(), manualEnabled ? manualTier : undefined);
      setQuery("");
      setState("idle");
    } finally {
      setAdding(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(query);
  }

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.searchRow}>
        <div className={styles.search}>
          <input
            className={styles.input}
            value={query}
            placeholder="게임명#KR1"
            aria-label="Riot ID"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setResults([]);
              setState("idle");
            }}
          />
          {(state === "loading" || state === "empty" || state === "error" || results.length > 0) && (
            <div className={styles.results} aria-live="polite">
              {state === "loading" && <div className={styles.result}>계정 검색 중…</div>}
              {state === "empty" && <div className={styles.result}>일치하는 계정이 없습니다.</div>}
              {state === "error" && <div className={styles.result}>{message}</div>}
              {results.map((account) => (
                <button
                  className={styles.result}
                  type="button"
                  key={account.puuid}
                  onClick={() => void submit(`${account.gameName}#${account.tagLine}`)}
                >
                  {account.gameName}#{account.tagLine}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          type="submit"
          disabled={!query.trim() || adding}
        >
          {adding ? "분석 중…" : compact ? "추가" : "참가자 추가"}
        </button>
      </div>
      {!compact && (
        <>
          <label className={styles.hint}>
            <input type="checkbox" checked={manualEnabled} onChange={(event) => setManualEnabled(event.target.checked)} />{" "}
            현재·이전 시즌 기록이 없는 계정의 티어를 직접 입력
          </label>
          {manualEnabled && <div className={styles.manualTier}>
            <select
              className={styles.select}
              aria-label="수동 티어"
              value={manualTier.tier}
              onChange={(event) =>
                setManualTier({ ...manualTier, tier: event.target.value as RankedTier })
              }
            >
              {TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
            </select>
            <select
              className={styles.select}
              aria-label="수동 구간"
              value={manualTier.rank}
              onChange={(event) => setManualTier({ ...manualTier, rank: event.target.value })}
            >
              {["I", "II", "III", "IV"].map((rank) => <option key={rank}>{rank}</option>)}
            </select>
            <input
              className={styles.input}
              aria-label="수동 LP"
              type="number"
              min={0}
              max={100}
              value={manualTier.lp}
              onChange={(event) => setManualTier({ ...manualTier, lp: Number(event.target.value) })}
            />
          </div>}
        </>
      )}
    </form>
  );
}

function PlayerCard({
  participant,
  bootstrap,
  compact = false,
  changed = false,
  changeText,
  selected = false,
  round,
  onSelect,
  onRemove,
}: {
  participant: Participant;
  bootstrap: DataDragonBootstrap | null;
  compact?: boolean;
  changed?: boolean;
  changeText?: string;
  selected?: boolean;
  round?: RoundNumber;
  onSelect?: () => void;
  onRemove?: () => void;
}) {
  const recent = participant.riotData.recentStats;
  const performance = round ? participant.trialPerformanceByRound?.[round] : undefined;
  const deltaRound = round ? ((round + 1) as 2 | 3 | 4) : undefined;
  const scoreDelta = deltaRound
    ? participant.personalScoreDeltaByRound?.[deltaRound]
    : undefined;
  const champion = participant.riotData.masteries?.[0]?.championId;
  const championData = champion && bootstrap?.championsByKey[String(champion)];
  const emblem = rankedEmblemUrl(participant.preTier.tier);
  return (
    <article
      className={`${styles.playerCard} ${changed ? styles.playerCardChanged : ""} ${
        onSelect ? styles.playerCardButton : ""
      }`}
      tabIndex={0}
      role={onSelect ? "button" : undefined}
      aria-pressed={onSelect ? selected : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (onSelect && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <ProfileImage participant={participant} bootstrap={bootstrap} />
      <div className={styles.identity}>
        <strong>{participant.riotId}</strong>
        <span>
          {round
            ? `${participant.preTier.label} → ${lpValueToTier(participant.currentLpValue).label}`
            : participant.preTier.label}
        </span>
        <div className={styles.badges}>
          <span className={styles.badge}>
            {participant.internalTierBadge === "OP" ? "★ OP" : `${participant.internalTierBadge}티어`}
          </span>
          <LaneIcon role={participant.riotData.mainRole} />
          {performance?.unrated && <span className={styles.badgeUnrated}>기록 부족</span>}
          {performance?.performanceGrade && (
            <span className={styles.badgeGrade}>성과 {performance.performanceGrade}</span>
          )}
          {participant.honeyBeeBadge !== "none" && (
            <span className={styles.badge}>🐝 {beeLabel(participant.honeyBeeBadge)}</span>
          )}
          {scoreDelta != null && (
            <span className={styles.badge}>
              {scoreDelta >= 0 ? "▲" : "▼"}
              {Math.abs(scoreDelta)}%
            </span>
          )}
          {changeText && <span className={styles.changeLabel}>{changeText}</span>}
        </div>
      </div>
      {championData && bootstrap && (
        <Image
          className={styles.champion}
          src={`https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(bootstrap.version)}/img/champion/${encodeURIComponent(championData.id)}.png`}
          alt={`${championData.name} 아이콘`}
          width={34}
          height={34}
          unoptimized
        />
      )}
      {emblem && (
        <Image
          className={styles.emblem}
          src={emblem}
          alt={`${participant.preTier.tier} 티어 엠블럼`}
          width={48}
          height={48}
        />
      )}
      {onRemove && (
        <button
          type="button"
          className={`${styles.button} ${styles.buttonDanger}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          제외
        </button>
      )}
      {compact && (
        <div className={styles.hoverCard}>
          <strong>상세 전력</strong>
          <dl className={styles.detailGrid}>
            <div><dt>대표 티어</dt><dd>{participant.preTier.label}</dd></div>
            <div><dt>최근 표본</dt><dd>{participant.riotData.preMainRoleGames ?? 0}판</dd></div>
            <div><dt>주 라인 KDA</dt><dd>{formatNumber(participant.riotData.preMainRoleKda)}</dd></div>
            <div><dt>평균 피해량</dt><dd>{formatNumber(participant.riotData.preMainRoleDamage, true)}</dd></div>
            <div><dt>랭크 승률</dt><dd>{recent?.games ? `${Math.round((recent.wins / recent.games) * 100)}%` : "기록 없음"}</dd></div>
            <div><dt>분석 상태</dt><dd>{isUnratedParticipant(participant) ? "기록 부족" : "평가 가능"}</dd></div>
          </dl>
          <p className={styles.hint}>
            티어·최근 주 라인 경기·승률을 함께 보고 팀 전력을 계산합니다.
          </p>
        </div>
      )}
    </article>
  );
}

function ProfileImage({
  participant,
  bootstrap,
}: {
  participant: Participant;
  bootstrap: DataDragonBootstrap | null;
}) {
  const [failed, setFailed] = useState(false);
  const iconId = participant.riotData.profileIconId;
  if (!bootstrap || iconId == null || failed) {
    return <span className={styles.profileFallback}>{participant.riotId.charAt(0).toUpperCase()}</span>;
  }
  return (
    <Image
      className={styles.profile}
      src={`https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(bootstrap.version)}/img/profileicon/${iconId}.png`}
      alt={`${participant.riotId} 프로필 아이콘`}
      width={44}
      height={44}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function LaneIcon({ role }: { role?: MainRole }) {
  const label = ROLE_LABEL[role ?? "UNKNOWN"];
  const path = {
    TOP: "M5 19 19 5M5 13V5h8M19 11v8h-8",
    JUNGLE: "M12 21c1-5 4-8 8-11-3 1-5 1-7 4 0-4-2-7-5-10 1 5 0 9-2 13-1-3-3-5-6-7 2 4 3 8 3 15",
    MIDDLE: "M5 19 19 5M8 19H5v-3M16 5h3v3",
    BOTTOM: "M5 5h14v14H5zM5 19 19 5",
    UTILITY: "M12 3v18M7 8h10M8 21h8M9 8l-3 6h6l-3-6M15 8l-3 6h6l-3-6",
    UNKNOWN: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 13v.01M10 9a2 2 0 1 1 3 1.7c-1 .6-1 1-1 2",
  }[role ?? "UNKNOWN"];
  return (
    <span className={styles.laneIcon} tabIndex={0} aria-label={`주 라인: ${label}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={styles.laneTooltip}>{label}</span>
    </span>
  );
}

function TeamColumn({
  side,
  proposal,
  bootstrap,
  selectedPuuid,
  changedPuuids,
  previous,
  round,
  onSelect,
  onRemove,
  onAdd,
  children,
}: {
  side: TeamSide;
  proposal: TeamProposal;
  bootstrap: DataDragonBootstrap | null;
  selectedPuuid?: string;
  changedPuuids?: Set<string>;
  previous?: TeamProposal;
  round?: RoundNumber;
  onSelect?: (participant: Participant, side: TeamSide) => void;
  onRemove?: (participant: Participant) => void;
  onAdd?: () => void;
  children?: ReactNode;
}) {
  const team = side === "blue" ? proposal.blueTeam : proposal.redTeam;
  const average = side === "blue" ? proposal.blueAvgTier : proposal.redAvgTier;
  const synergy = side === "blue" ? proposal.blueSynergy : proposal.redSynergy;
  const previousSide = new Map([
    ...(previous?.blueTeam.map(({ puuid }) => [puuid, "블루"] as const) ?? []),
    ...(previous?.redTeam.map(({ puuid }) => [puuid, "레드"] as const) ?? []),
  ]);
  return (
    <section className={`${styles.team} ${styles[side]}`}>
      <header className={styles.teamHeader}>
        <div>
          <h3>{side === "blue" ? "블루팀" : "레드팀"}</h3>
          <span className={styles.meta}>평균 {average.label} · 시너지 {synergyLabel(synergy)}</span>
        </div>
        {onAdd && (
          <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={onAdd}>
            선수 추가
          </button>
        )}
      </header>
      <div className={styles.reason}>
        <button className={styles.button} type="button" aria-label="밸런스 근거 보기">?</button>
        <div className={styles.reasonBox}>
          팀 평균 티어 차이는 약 {proposal.tierDiffDivisions}구간입니다. 주 포지션과 모스트
          챔피언 겹침으로 시너지 등급을 표시하며, 시너지는 자동 배정 자체를 바꾸지 않습니다.
        </div>
      </div>
      <div className={styles.teamList}>
        {team.map((participant, index) => {
          const changed = changedPuuids?.has(participant.puuid) ?? false;
          const from = previousSide.get(participant.puuid);
          return (
            <TeamSlideIn key={participant.puuid} side={side} index={index}>
              <PlayerCard
                participant={participant}
                bootstrap={bootstrap}
                selected={selectedPuuid === participant.puuid}
                changed={changed}
                changeText={changed && from ? `${from}팀에서 들어옴` : undefined}
                round={round}
                onSelect={onSelect ? () => onSelect(participant, side) : undefined}
                onRemove={onRemove ? () => onRemove(participant) : undefined}
              />
            </TeamSlideIn>
          );
        })}
      </div>
      {children}
    </section>
  );
}

function PowerRatio({ proposal }: { proposal: TeamProposal }) {
  return (
    <div className={styles.ratio} aria-label={`블루 ${proposal.bluePowerPct}%, 레드 ${proposal.redPowerPct}%`}>
      <div className={styles.ratioLabels}>
        <span>블루 {proposal.bluePowerPct}%</span>
        <span>레드 {proposal.redPowerPct}%</span>
      </div>
      <div className={styles.ratioTrack}>
        <span className={styles.ratioBlue} style={{ width: `${proposal.bluePowerPct}%` }} />
        <span className={styles.ratioRed} style={{ width: `${proposal.redPowerPct}%` }} />
      </div>
    </div>
  );
}

function MatchIdModal({
  initialId,
  onClose,
  onApply,
}: {
  initialId: string;
  onClose: () => void;
  onApply: (match: RiotMatch) => void;
}) {
  const [matchId, setMatchId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      onApply(await requestJson<RiotMatch>(`/api/riot/match/${encodeURIComponent(matchId.trim())}`));
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal title="경기 ID로 불러오기" onClose={onClose}>
      <p className={styles.muted}>세션 참가자와 PUUID가 일치하는 기록만 자동으로 매핑합니다.</p>
      <input className={styles.input} value={matchId} placeholder="KR_1234567890" onChange={(event) => setMatchId(event.target.value)} />
      {error && <Notice kind="error">{error}</Notice>}
      <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" disabled={!matchId.trim() || loading} onClick={() => void load()}>
        {loading ? "불러오는 중…" : "폼에 채우기"}
      </button>
    </Modal>
  );
}

function RecentMatchesModal({
  session,
  preferredPuuid,
  onClose,
  onApply,
}: {
  session: Session;
  preferredPuuid?: string;
  onClose: () => void;
  onApply: (match: RiotMatch) => void;
}) {
  const [puuid, setPuuid] = useState(preferredPuuid ?? session.participants[0]?.puuid ?? "");
  const [history, setHistory] = useState<MatchHistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!puuid) return;
    const controller = new AbortController();
    requestJson<MatchHistoryResult>(`/api/riot/matches?recent=1&puuid=${encodeURIComponent(puuid)}`, {
      signal: controller.signal,
    })
      .then(setHistory)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(messageOf(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [puuid]);

  async function pick(matchId: string) {
    setLoading(true);
    try {
      onApply(await requestJson<RiotMatch>(`/api/riot/match/${encodeURIComponent(matchId)}`));
    } catch (cause) {
      setError(messageOf(cause));
      setLoading(false);
    }
  }

  return (
    <Modal title="참가자 최근 경기" onClose={onClose}>
      <label>
        <span className={styles.hint}>
          {preferredPuuid ? "현재 세션의 내 플레이어를 우선 선택했습니다." : "조회할 참가자를 선택하세요."}
        </span>
        <select
          className={styles.select}
          value={puuid}
          onChange={(event) => {
            setLoading(true);
            setError("");
            setPuuid(event.target.value);
          }}
        >
          {session.participants.map((participant) => (
            <option key={participant.puuid} value={participant.puuid}>{participant.riotId}</option>
          ))}
        </select>
      </label>
      {loading && <span className={styles.loading}>최근 경기 불러오는 중</span>}
      {error && <Notice kind="error">{error}</Notice>}
      {!loading && history && !history.matches.length && <Notice kind="warning">최근 랭크 경기가 없습니다.</Notice>}
      <div className={styles.modalList}>
        {history?.matches.map((match) => (
          <button key={match.matchId} type="button" onClick={() => void pick(match.matchId)}>
            <strong>{match.win ? "승리" : "패배"}</strong> · KDA {match.kda.toFixed(2)} · 피해량{" "}
            {match.damageDealt.toLocaleString("ko-KR")}
            <br />
            <span className={styles.hint}>{new Date(match.gameCreation).toLocaleString("ko-KR")} · {match.matchId}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function MatchMappingModal({
  match,
  participants,
  onClose,
  onApply,
}: {
  match: RiotMatch;
  participants: Participant[];
  onClose: () => void;
  onApply: (mapping: Record<string, string>) => void;
}) {
  const sessionIds = new Set(participants.map(({ puuid }) => puuid));
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    Object.fromEntries(match.info.participants.map(({ puuid }) => [
      puuid,
      sessionIds.has(puuid) ? puuid : "",
    ])),
  );
  const selected = Object.values(mapping).filter(Boolean);
  const duplicate = new Set(selected).size !== selected.length;
  return (
    <Modal title="경기 참가자 수동 매핑" onClose={onClose}>
      <p className={styles.muted}>
        자동으로 일치하지 않은 경기 이름을 현재 세션 참가자와 직접 연결하세요. 연결하지 않을 행은
        제외됩니다.
      </p>
      {match.info.participants.map((entry) => (
        <div className={styles.mappingRow} key={entry.puuid}>
          <span>
            {entry.riotIdGameName ?? "이름 없음"}
            {entry.riotIdTagline ? `#${entry.riotIdTagline}` : ""} · {entry.teamId === 100 ? "블루" : "레드"}
          </span>
          <select
            className={styles.select}
            aria-label={`${entry.riotIdGameName ?? entry.puuid} 세션 참가자 매핑`}
            value={mapping[entry.puuid] ?? ""}
            onChange={(event) => setMapping((current) => ({ ...current, [entry.puuid]: event.target.value }))}
          >
            <option value="">매핑 안 함</option>
            {participants.map((participant) => (
              <option key={participant.puuid} value={participant.puuid}>{participant.riotId}</option>
            ))}
          </select>
        </div>
      ))}
      {duplicate && <Notice kind="error">한 세션 참가자를 두 경기 참가자에 중복 연결할 수 없습니다.</Notice>}
      {!duplicate && selected.length !== participants.length && (
        <Notice kind="warning">현재 세션 참가자 {participants.length}명을 모두 한 번씩 연결해 주세요.</Notice>
      )}
      <button
        className={`${styles.button} ${styles.buttonPrimary}`}
        type="button"
        disabled={selected.length !== participants.length || duplicate}
        onClick={() => onApply(mapping)}
      >
        매핑한 값 폼에 채우기
      </button>
    </Modal>
  );
}

interface VisionValue {
  puuid: string;
  kda: string;
  damage: string;
  sourceName?: string;
}

function VisionModal({
  participants,
  onClose,
  onApply,
}: {
  participants: Participant[];
  onClose: () => void;
  onApply: (values: VisionValue[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<VisionValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    const data = new FormData();
    data.set("image", file);
    try {
      const response = await requestJson<{
        draft: {
          participants: Array<{
            name: string | null;
            kills: number | null;
            deaths: number | null;
            assists: number | null;
            damageDealt: number | null;
          }>;
        };
      }>("/api/riot/vision", { method: "POST", body: data });
      setRows(response.draft.participants.map((entry, index) => ({
        puuid:
          participants.find(({ riotId }) =>
            entry.name && riotId.toLowerCase().includes(entry.name.toLowerCase()),
          )?.puuid ?? "",
        sourceName: entry.name ?? `인식 행 ${index + 1}`,
        kda:
          entry.kills != null && entry.deaths != null && entry.assists != null
            ? `${entry.kills}/${entry.deaths}/${entry.assists}`
            : "",
        damage: entry.damageDealt?.toLocaleString("ko-KR") ?? "",
      })));
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }

  const selectedPuuids = rows.map(({ puuid }) => puuid).filter(Boolean);
  const duplicateMapping = new Set(selectedPuuids).size !== selectedPuuids.length;
  return (
    <Modal title="Gemini 점수판 분석 · 검토" onClose={onClose}>
      <p className={styles.muted}>
        이미지는 저장하지 않으며 초안을 검토한 뒤에만 메인 폼에 반영합니다. Gemini 자격 증명이
        없으면 수동 입력을 계속 사용할 수 있습니다.
      </p>
      <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" disabled={!file || loading} onClick={() => void analyze()}>
        {loading ? "분석 중…" : "이미지 분석"}
      </button>
      {error && <Notice kind="error">{error}</Notice>}
      {rows.map((row, index) => (
        <div className={styles.visionRow} key={index}>
          <span className={styles.hint}>{row.sourceName}</span>
          <select
            className={styles.select}
            aria-label={`${index + 1}행 참가자 매핑`}
            value={row.puuid}
            onChange={(event) => setRows((current) => current.map((value, rowIndex) => rowIndex === index ? { ...value, puuid: event.target.value } : value))}
          >
            <option value="">매핑 안 함</option>
            {participants.map((participant) => <option key={participant.puuid} value={participant.puuid}>{participant.riotId}</option>)}
          </select>
          <input className={styles.input} aria-label={`${index + 1}행 KDA`} value={row.kda} placeholder="12/4/9" onChange={(event) => setRows((current) => current.map((value, rowIndex) => rowIndex === index ? { ...value, kda: event.target.value } : value))} />
          <input className={styles.input} aria-label={`${index + 1}행 피해량`} value={row.damage} placeholder="20,170" onChange={(event) => setRows((current) => current.map((value, rowIndex) => rowIndex === index ? { ...value, damage: event.target.value } : value))} />
        </div>
      ))}
      {duplicateMapping && <Notice kind="error">같은 세션 참가자를 여러 이미지 행에 중복 연결할 수 없습니다.</Notice>}
      <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" disabled={!rows.length || duplicateMapping} onClick={() => onApply(rows)}>
        검토한 값 폼에 채우기
      </button>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} ref={panelRef} tabIndex={-1}>
        <header className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.button} type="button" onClick={onClose}>닫기</button>
        </header>
        {children}
      </div>
    </div>
  );
}

function RoundTargetTabs({
  value,
  onChange,
}: {
  value: 2 | 3 | 4;
  onChange: (round: 2 | 3 | 4) => void;
}) {
  return (
    <div className={styles.tabs}>
      {([2, 3, 4] as const).map((round) => (
        <button
          className={`${styles.button} ${value === round ? styles.tabActive : ""}`}
          type="button"
          key={round}
          onClick={() => onChange(round)}
        >
          {round}판
        </button>
      ))}
    </div>
  );
}

function Notice({ kind, children }: { kind: "error" | "warning" | "success"; children: ReactNode }) {
  return <div className={styles[kind]} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

function buildInitialForms(session: Session): Record<RoundNumber, TrialFormState> {
  return Object.fromEntries(
    ([1, 2, 3] as const).map((round) => {
      const record = session.rounds.find((item) => item.round === round);
      const proposal = proposalForRound(session, round);
      const stats = Object.fromEntries(
        session.participants.map(({ puuid }) => {
          const saved = record?.trialResult.playerStats.find((item) => item.puuid === puuid);
          return [puuid, {
            kda: saved ? String(saved.kda) : "",
            damage: saved ? saved.damageDealt.toLocaleString("ko-KR") : "",
          }];
        }),
      );
      return [round, {
        winnerTeam: record?.trialResult.winnerTeam ?? "blue",
        matchId: record?.trialResult.matchId ?? "",
        bluePuuids: record?.trialResult.blueTeam.map(({ puuid }) => puuid)
          ?? proposal?.blueTeam.map(({ puuid }) => puuid)
          ?? [],
        redPuuids: record?.trialResult.redTeam.map(({ puuid }) => puuid)
          ?? proposal?.redTeam.map(({ puuid }) => puuid)
          ?? [],
        stats,
      }];
    }),
  ) as unknown as Record<RoundNumber, TrialFormState>;
}

function proposalForRound(session: Session, round: RoundNumber): TeamProposal | undefined {
  if (round === 1) return session.preTeamProposal;
  return session.rounds.find(({ nextTeamProposal }) => nextTeamProposal.targetRound === round)
    ?.nextTeamProposal;
}

function toTrialDraft(round: RoundNumber, form: TrialFormState): TrialDraft | null {
  if (!form.bluePuuids.length || !form.redPuuids.length) return null;
  const parsed = Object.fromEntries(
    Object.entries(form.stats).map(([puuid, value]) => [
      puuid,
      {
        kda: parseKda(value.kda),
        damageDealt: parseStat(value.damage),
      },
    ]),
  );
  return {
    round,
    winnerTeam: form.winnerTeam,
    matchId: form.matchId,
    bluePuuids: form.bluePuuids,
    redPuuids: form.redPuuids,
    stats: parsed,
  };
}

function parseKda(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/")) {
    const [kills, deaths, assists] = trimmed.split("/").map((part) => Number(part.replaceAll(",", "")));
    if (![kills, deaths, assists].every(Number.isFinite)) return null;
    return (kills + assists) / Math.max(1, deaths);
  }
  return parseStat(trimmed);
}

function parseStat(value: string): number | null {
  const parsed = Number(value.replaceAll(",", "").trim());
  return Number.isFinite(parsed) && value.trim() ? parsed : null;
}

function messageOf(cause: unknown, fallback = "요청을 처리하지 못했습니다."): string {
  return cause instanceof Error ? cause.message : fallback;
}

function isParticipant(value: Participant | undefined): value is Participant {
  return Boolean(value);
}

function isUnratedParticipant(participant: Participant): boolean {
  return (
    participant.tierSource === "manual" ||
    (participant.riotData.preMainRoleGames ?? 0) < 3 ||
    participant.riotData.preMainRoleKda == null ||
    participant.riotData.preMainRoleDamage == null
  );
}

function formatNumber(value?: number | null, integer = false): string {
  if (value == null) return "기록 없음";
  return integer ? Math.round(value).toLocaleString("ko-KR") : value.toFixed(2);
}

function synergyLabel(value: TeamProposal["blueSynergy"]): string {
  return value === "high" ? "높음" : value === "medium" ? "보통" : "낮음";
}

function beeLabel(value: Participant["honeyBeeBadge"]): string {
  return value === "rainbowBee" ? "무지개 꿀벌" : value === "glitterBee" ? "반짝 꿀벌" : "꿀벌";
}

function nameOf(session: Session, puuid: string): string {
  return session.participants.find((participant) => participant.puuid === puuid)?.riotId.split("#")[0] ?? puuid;
}

const ROLE_LABEL: Record<MainRole | "UNKNOWN", string> = {
  TOP: "탑",
  JUNGLE: "정글",
  MIDDLE: "미드",
  BOTTOM: "원딜",
  UTILITY: "서포터",
  UNKNOWN: "미확인",
};

const TIER_OPTIONS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const satisfies ReadonlyArray<RankedTier>;
