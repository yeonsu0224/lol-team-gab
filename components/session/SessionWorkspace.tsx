"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AssistantSidebar } from "@/components/assistant/AssistantSidebar";
import { StepNav } from "@/components/layout/StepNav";
import { AnalysisTransition } from "@/components/motion/AnalysisTransition";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
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
  profileIconUrl,
  searchAccounts,
  type AccountResult,
  type DataDragonBootstrap,
} from "@/lib/player/client";
import {
  rememberPlayer,
  removeRecentPlayer,
} from "@/lib/storage/recentPlayers";
import { useRecentPlayers } from "@/lib/storage/useRecentPlayers";
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
import { PlayerCard, roleLabel } from "./PlayerCard";
import { TrialAssist, type MatchPayload } from "./TrialAssist";

type View = "players" | "team" | "trial" | "rebalance";

interface TrialForm {
  winnerTeam: TeamSide;
  matchId: string;
  bluePuuids: string[];
  redPuuids: string[];
  stats: Record<string, {
    kda: string;
    damage: string;
    championId: string;
    playedRole: MainRole | "";
  }>;
}

export function SessionWorkspace({ sessionId, view }: { sessionId: string; view: View }) {
  const { sessions, error, hydrated, update } = useSessions();
  const session = sessions.find(({ id }) => id === sessionId);
  const [bootstrap, setBootstrap] = useState<DataDragonBootstrap | null>(null);

  useEffect(() => {
    void loadBootstrap().then(setBootstrap).catch(() => undefined);
  }, []);

  if (error) return <main className="tg-page"><div className="tg-notice tg-notice--error">{error}</div></main>;
  if (!hydrated) return <main className="tg-page"><p aria-busy>세션을 불러오는 중입니다…</p></main>;
  if (!session) return <main className="tg-page tg-panel"><h1>세션을 찾을 수 없습니다</h1><Link className="tg-button" href="/dashboard">대시보드로</Link></main>;

  const save = (
    patch: Partial<Omit<Session, "id" | "createdAt">> | ((current: Session) => Session),
  ) => update(sessionId, patch);

  return (
    <main className="tg-page tg-stack">
      <StepNav sessionId={sessionId} active={view} />
      {view === "players" && <PlayersView session={session} bootstrap={bootstrap} save={save} />}
      {view === "team" && <TeamView session={session} bootstrap={bootstrap} save={save} />}
      {view === "trial" && <TrialView session={session} save={save} />}
      {view === "rebalance" && <RebalanceView session={session} bootstrap={bootstrap} save={save} />}
      {view !== "players" && (
        <AssistantSidebar
          session={session}
          surface={view}
          onModeChange={(commentMode) => save({ commentMode })}
        />
      )}
    </main>
  );
}

function PlayersView({
  session,
  bootstrap,
  save,
}: {
  session: Session;
  bootstrap: DataDragonBootstrap | null;
  save: (patch: Partial<Omit<Session, "id" | "createdAt">>) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [remoteAccounts, setRemoteAccounts] = useState<AccountResult[]>([]);
  const { recentPlayers: recent } = useRecentPlayers();
  const [recentOpen, setRecentOpen] = useState(false);
  const [manual, setManual] = useState<{
    account: AccountResult;
    tier: string;
    rank: string;
    lp: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [transition, setTransition] = useState(false);
  const ready = session.participants.length === 8 || session.participants.length === 10;

  useEffect(() => {
    const value = query.trim();
    if (!value.includes("#")) return;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      void searchAccounts(value)
        .then(setRemoteAccounts)
        .catch((cause) => { setRemoteAccounts([]); setError(messageOf(cause)); })
        .finally(() => setLoading(false));
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const accounts = query.includes("#")
    ? remoteAccounts
    : query.trim()
      ? recent
          .filter(({ gameName }) => gameName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
          .map(({ puuid, gameName, tagLine, profileIconId }) => ({ puuid, gameName, tagLine, profileIconId }))
      : [];

  async function add(account: AccountResult, manualTier?: { tier: string; rank: string; lp: number }) {
    if (session.participants.some(({ puuid }) => puuid === account.puuid)) {
      setError("이미 등록된 플레이어입니다.");
      return;
    }
    if (session.participants.length >= 10) return;
    setLoading(true);
    setError("");
    try {
      const participant = await loadParticipant(account, manualTier);
      const participants = refreshParticipantScores([...session.participants, participant]);
      save({ participants, preTeamProposal: undefined, rounds: [] });
      rememberPlayer(participant);
      setQuery("");
      setRemoteAccounts([]);
      setMessage(`${participant.riotId} 등록 완료`);
    } catch (cause) {
      if (cause instanceof ClientApiError && cause.code === "MANUAL_TIER_REQUIRED") {
        setManual({ account, tier: "SILVER", rank: "IV", lp: 0 });
        return;
      }
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }

  function remove(puuid: string) {
    save({
      participants: refreshParticipantScores(session.participants.filter((item) => item.puuid !== puuid)),
      preTeamProposal: undefined,
      rounds: [],
    });
  }

  function propose() {
    if (!ready) return;
    const participants = refreshParticipantScores(session.participants);
    save({ participants, preTeamProposal: buildTeamProposal(participants), rounds: [] });
    setTransition(true);
  }

  const finishTransition = useCallback(() => {
    router.push(`/session/${session.id}/team`);
  }, [router, session.id]);

  if (transition) {
    return <AnalysisTransition messages={["전력을 비교하는 중", "역할 조합을 확인하는 중", "팀 제안 완성"]} onComplete={finishTransition} />;
  }

  return (
    <section className="tg-panel tg-stack">
      <div className="tg-row tg-row--between">
        <div>
          <h1>참가자 등록 · 전력 분석</h1>
          <p className="tg-muted">{session.participants.length}/10명 · 8명 또는 10명에서 팀 제안 가능</p>
        </div>
        <button className="tg-button" type="button" onClick={() => setRecentOpen(true)}>이전 플레이어</button>
      </div>
      <p className="tg-muted">부캐라면 본캐 계정을 입력하세요. 원격 검색은 정확한 게임명#태그가 필요합니다.</p>
      <div className="tg-row">
        <input
          className="tg-input"
          style={{ flex: 1 }}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setError(""); }}
          placeholder="게임명#태그 또는 이전 플레이어 게임명"
          aria-label="Riot ID 검색"
        />
        <span>{loading ? "검색 중…" : ""}</span>
      </div>
      {!query.includes("#") && query.trim() && !accounts.length && (
        <p className="tg-muted">이전 등록 후보가 없습니다. 원격 조회하려면 #태그까지 입력해 주세요.</p>
      )}
      {accounts.length > 0 && (
        <div className="tg-grid">
          {accounts.map((account) => (
            <SearchAccountCandidate
              key={account.puuid}
              account={account}
              bootstrap={bootstrap}
              actionLabel="등록"
              onSelect={() => void add(account)}
            />
          ))}
        </div>
      )}
      {error && <div className="tg-notice tg-notice--error" role="alert">{error}</div>}
      {message && <div className="tg-notice tg-notice--success">{message}</div>}
      <div className="tg-grid tg-grid--2">
        <div className="tg-grid">
          {session.participants.slice(0, 5).map((participant) => (
            <PlayerCard key={participant.puuid} participant={participant} bootstrap={bootstrap} onRemove={() => remove(participant.puuid)} />
          ))}
        </div>
        <div className="tg-grid">
          {session.participants.slice(5, 10).map((participant) => (
            <PlayerCard key={participant.puuid} participant={participant} bootstrap={bootstrap} onRemove={() => remove(participant.puuid)} />
          ))}
        </div>
      </div>
      <ReasonPanel reasons={["랭크 LP를 70%로 가장 크게 반영합니다.", "주 라인 KDA 20%와 최근 승률 10%를 보조로 사용합니다.", "기록이 부족한 값은 0점으로 처리하지 않고 중립값으로 보완합니다."]} />
      <button className={`tg-button ${ready ? "tg-button--ready" : ""}`} type="button" disabled={!ready} onClick={propose}>
        {ready ? "팀 제안하기" : `${session.participants.length}/8명 이상 필요`}
      </button>
      {recentOpen && (
        <div className="tg-modal-backdrop" role="presentation" onMouseDown={() => setRecentOpen(false)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between"><h2>이전 플레이어</h2><button className="tg-button" onClick={() => setRecentOpen(false)}>닫기</button></div>
            {recent.length ? recent.map((item) => (
              <div className="tg-row tg-row--between" key={item.puuid}>
                <button className="tg-button" onClick={() => void add(item)}>{item.riotId} 재등록</button>
                <button className="tg-button" onClick={() => removeRecentPlayer(item.puuid)}>기록 삭제</button>
              </div>
            )) : <p className="tg-muted">이전에 등록한 플레이어가 없습니다.</p>}
          </section>
        </div>
      )}
      {manual && (
        <div className="tg-modal-backdrop" onMouseDown={() => setManual(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <h2>수동 티어 입력</h2>
            <p className="tg-muted">{manual.account.gameName}#{manual.account.tagLine}은 현재 랭크 기록이 없습니다.</p>
            <div className="tg-grid tg-grid--2">
              <label className="tg-field"><span>티어</span><select className="tg-select" value={manual.tier} onChange={(event) => setManual({ ...manual, tier: event.target.value })}>
                {["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"].map((tier) => <option key={tier}>{tier}</option>)}
              </select></label>
              <label className="tg-field"><span>구간</span><select className="tg-select" value={manual.rank} onChange={(event) => setManual({ ...manual, rank: event.target.value })}>
                {["IV", "III", "II", "I"].map((rank) => <option key={rank}>{rank}</option>)}
              </select></label>
              <label className="tg-field"><span>LP</span><input className="tg-input" type="number" min={0} max={99} value={manual.lp} onChange={(event) => setManual({ ...manual, lp: Number(event.target.value) })} /></label>
            </div>
            <div className="tg-row">
              <button className="tg-button" type="button" onClick={() => setManual(null)}>취소</button>
              <button className="tg-button tg-button--primary" type="button" onClick={() => {
                const value = manual;
                setManual(null);
                void add(value.account, value);
              }}>이 티어로 등록</button>
            </div>
          </section>
        </div>
      )}
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
  save: (patch: Partial<Omit<Session, "id" | "createdAt">>) => void;
}) {
  const proposal = session.preTeamProposal;
  const [selected, setSelected] = useState<{ puuid: string; side: TeamSide } | null>(null);
  const [editSide, setEditSide] = useState<TeamSide | null>(null);
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<AccountResult[]>([]);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  if (!proposal) return <Missing title="팀 제안" href={`/session/${session.id}/players`} />;

  function select(participant: Participant, side: TeamSide) {
    const currentProposal = session.preTeamProposal;
    if (!currentProposal) return;
    if (!selected) {
      setSelected({ puuid: participant.puuid, side });
      return;
    }
    if (selected.side === side || selected.puuid === participant.puuid) {
      setSelected(null);
      return;
    }
    const blue = [...currentProposal.blueTeam];
    const red = [...currentProposal.redTeam];
    const blueIndex = blue.findIndex(({ puuid }) => puuid === (side === "blue" ? participant.puuid : selected.puuid));
    const redIndex = red.findIndex(({ puuid }) => puuid === (side === "red" ? participant.puuid : selected.puuid));
    if (blueIndex >= 0 && redIndex >= 0) {
      [blue[blueIndex], red[redIndex]] = [red[redIndex], blue[blueIndex]];
      save({ preTeamProposal: proposalFromTeams(blue, red) });
    }
    setSelected(null);
  }

  function removeMember(participant: Participant, side: TeamSide) {
    const currentProposal = session.preTeamProposal;
    if (!currentProposal) return;
    const blue = side === "blue"
      ? currentProposal.blueTeam.filter(({ puuid }) => puuid !== participant.puuid)
      : currentProposal.blueTeam;
    const red = side === "red"
      ? currentProposal.redTeam.filter(({ puuid }) => puuid !== participant.puuid)
      : currentProposal.redTeam;
    save({
      participants: session.participants.filter(({ puuid }) => puuid !== participant.puuid),
      preTeamProposal: proposalFromTeams(blue, red),
      rounds: [],
    });
  }

  async function searchMember() {
    setEditLoading(true);
    setEditError("");
    try {
      setAccounts(await searchAccounts(query));
    } catch (cause) {
      setEditError(messageOf(cause));
    } finally {
      setEditLoading(false);
    }
  }

  async function addMember(account: AccountResult) {
    if (!editSide) return;
    if (session.participants.length >= 10) {
      setEditError("참가자는 최대 10명입니다.");
      return;
    }
    if (session.participants.some(({ puuid }) => puuid === account.puuid)) {
      setEditError("이미 참가 중인 플레이어입니다.");
      return;
    }
    setEditLoading(true);
    try {
      const participant = await loadParticipant(account);
      const currentProposal = session.preTeamProposal;
      if (!currentProposal) return;
      const participants = refreshParticipantScores([...session.participants, participant]);
      const byId = new Map(participants.map((item) => [item.puuid, item]));
      const blue = currentProposal.blueTeam.map(({ puuid }) => byId.get(puuid)).filter(isParticipant);
      const red = currentProposal.redTeam.map(({ puuid }) => byId.get(puuid)).filter(isParticipant);
      (editSide === "blue" ? blue : red).push(byId.get(participant.puuid) ?? participant);
      save({ participants, preTeamProposal: proposalFromTeams(blue, red), rounds: [] });
      rememberPlayer(participant);
      setEditSide(null);
      setQuery("");
      setAccounts([]);
    } catch (cause) {
      setEditError(messageOf(cause));
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <section className="tg-stack">
      <header className="tg-panel">
        <h1>1판 팀 제안</h1>
        <p className="tg-muted">카드 두 장을 차례로 선택하면 팀을 교체합니다.</p>
        <PowerRatio proposal={proposal} />
      </header>
      <div className="tg-grid tg-grid--2">
        <TeamBoard side="blue" proposal={proposal} bootstrap={bootstrap} selected={selected?.puuid} onSelect={select} onRemove={removeMember} onAdd={() => setEditSide("blue")} />
        <TeamBoard side="red" proposal={proposal} bootstrap={bootstrap} selected={selected?.puuid} onSelect={select} onRemove={removeMember} onAdd={() => setEditSide("red")} />
      </div>
      <section className="tg-panel tg-row tg-row--between">
        <div><strong>밸런스 근거</strong><p className="tg-muted">평균 티어 차이 {proposal.tierDiffDivisions}구간 · 전력 비율과 역할 분포를 함께 봤습니다.</p></div>
        <div className="tg-row">
          <Link className="tg-button" href={`/session/${session.id}/finish`}>내전 종료하기</Link>
          <Link className="tg-button tg-button--primary" href={`/session/${session.id}/trial`}>이 구성으로 시험 판</Link>
        </div>
      </section>
      <ReasonPanel reasons={["서로 비슷한 전력의 라이벌을 반대 팀에 배치합니다.", "내부 1~5/OP 뱃지는 설명용이며 팀 배정 점수를 바꾸지 않습니다.", "수동 교체 후 전력 비율과 평균 티어를 다시 계산합니다."]} />
      {editSide && (
        <div className="tg-modal-backdrop" onMouseDown={() => setEditSide(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between"><h2>{editSide === "blue" ? "블루팀" : "레드팀"} 선수 추가</h2><button className="tg-button" onClick={() => setEditSide(null)}>닫기</button></div>
            <div className="tg-row">
              <input className="tg-input" style={{ flex: 1 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="게임명#태그" />
              <button className="tg-button tg-button--primary" disabled={!query.includes("#") || editLoading} onClick={() => void searchMember()}>검색</button>
            </div>
            {accounts.map((account) => (
              <SearchAccountCandidate
                key={account.puuid}
                account={account}
                bootstrap={bootstrap}
                actionLabel="추가"
                onSelect={() => void addMember(account)}
              />
            ))}
            {editError && <div className="tg-notice tg-notice--error">{editError}</div>}
          </section>
        </div>
      )}
    </section>
  );
}

function TrialView({
  session,
  save,
}: {
  session: Session;
  save: (patch: Partial<Omit<Session, "id" | "createdAt">> | ((current: Session) => Session)) => void;
}) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const [round, setRound] = useState<RoundNumber>(Math.min(3, session.rounds.length + 1) as RoundNumber);
  const [forms, setForms] = useState<Record<RoundNumber, TrialForm>>(() => initialTrialForms(session));
  const [message, setMessage] = useState("");
  const [transition, setTransition] = useState(false);
  const proposal = proposalForRound(session, round);
  const form = forms[round];

  const finishTransition = useCallback(() => {
    router.push(`/session/${session.id}/rebalance?round=${Math.min(4, round + 1)}`);
  }, [router, round, session.id]);

  if (transition) {
    return <AnalysisTransition messages={["시험 판 기록을 정리하는 중", "기대치와 성과를 비교하는 중", "재밸런스 제안 완성"]} onComplete={finishTransition} />;
  }
  if (!proposal) return <Missing title="시험 판 결과" href={`/session/${session.id}/team`} />;

  function patchForm(patch: Partial<TrialForm>) {
    setForms((current) => ({ ...current, [round]: { ...current[round], ...patch } }));
  }

  function patchStat(puuid: string, patch: Partial<TrialForm["stats"][string]>) {
    setForms((current) => ({
      ...current,
      [round]: {
        ...current[round],
        stats: {
          ...current[round].stats,
          [puuid]: { ...current[round].stats[puuid], ...patch },
        },
      },
    }));
  }

  function fillDummy() {
    const stats: TrialForm["stats"] = Object.fromEntries(session.participants.map((participant, index) => [
      participant.puuid,
      {
        kda: `${3 + ((round * 13 + index * 3) % 10)}/${1 + ((round + index) % 6)}/${4 + ((round * 7 + index) % 12)}`,
        damage: (14_000 + ((round * 1201 + index * 1733) % 18_000)).toLocaleString("ko-KR"),
        championId: String(participant.riotData.masteries?.[0]?.championId ?? ""),
        playedRole: participant.riotData.mainRole ?? "" as MainRole | "",
      },
    ]));
    patchForm({ winnerTeam: round % 2 ? "blue" : "red", stats });
    setMessage(`${round}판 가상 데이터를 채웠습니다. 저장 전에 확인해 주세요.`);
  }

  function applyMatch(match: MatchPayload) {
    const known = new Set(session.participants.map(({ puuid }) => puuid));
    const rows = match.info.participants.filter(({ puuid }) => known.has(puuid));
    if (!rows.length) {
      setMessage("세션 참가자와 일치하는 선수가 없습니다.");
      return;
    }
    const stats = { ...form.stats };
    rows.forEach((row) => {
      stats[row.puuid] = {
        ...stats[row.puuid],
        kda: `${row.kills}/${row.deaths}/${row.assists}`,
        damage: row.totalDamageDealtToChampions.toLocaleString("ko-KR"),
        championId: String(row.championId),
        playedRole: matchRole(row.teamPosition),
      };
    });
    const winner = rows.find(({ win }) => win);
    patchForm({
      matchId: match.metadata.matchId,
      bluePuuids: rows.filter(({ teamId }) => teamId === 100).map(({ puuid }) => puuid),
      redPuuids: rows.filter(({ teamId }) => teamId === 200).map(({ puuid }) => puuid),
      winnerTeam: winner?.teamId === 200 ? "red" : "blue",
      stats,
    });
    setMessage(`${rows.length}명의 경기 기록을 채웠습니다. 저장 전에 확인해 주세요.`);
  }

  function applyVision(players: Array<{ riotId?: string; role?: string; kda?: string; damage?: number }>) {
    const stats = { ...form.stats };
    let matched = 0;
    players.forEach((row) => {
      const name = row.riotId?.split("#")[0]?.trim().toLocaleLowerCase();
      const participant = session.participants.find(({ riotId }) =>
        Boolean(name && riotId.split("#")[0].trim().toLocaleLowerCase() === name)
      );
      if (!participant) return;
      matched += 1;
      stats[participant.puuid] = {
        ...stats[participant.puuid],
        kda: row.kda ?? stats[participant.puuid].kda,
        damage: row.damage != null ? row.damage.toLocaleString("ko-KR") : stats[participant.puuid].damage,
        playedRole: matchRole(row.role) || stats[participant.puuid].playedRole,
      };
    });
    patchForm({ stats });
    setMessage(`${matched}명의 이미지 분석 결과를 채웠습니다. 나머지는 직접 확인해 주세요.`);
  }

  function saveRound() {
    const drafts = ([1, 2, 3] as const)
      .filter((item) => item <= Math.max(round, session.rounds.length))
      .map((item) => toTrialDraft(item, forms[item]))
      .filter((draft): draft is TrialDraft => draft !== null);
    const next = replayTrialRounds(session, drafts);
    if (next.rounds.length < round) {
      setMessage("이전 판부터 순서대로 저장해 주세요.");
      return;
    }
    save(next);
    setTransition(true);
  }

  return (
    <section className="tg-panel tg-stack">
      <header className="tg-row tg-row--between">
        <div><h1>시험 판 결과 입력</h1><p className="tg-muted">양 팀 모두 입력 스캔을 위해 좌측 정렬합니다.</p></div>
        <div className="tg-row">
          {([1, 2, 3] as const).map((item) => (
            <button className={`tg-button ${round === item ? "tg-button--primary" : ""}`} type="button" key={item} onClick={() => setRound(item)}>
              {item}판 {session.rounds.some((record) => record.round === item) ? "✓" : ""}
            </button>
          ))}
        </div>
      </header>
      <div className="tg-row">
        {(["blue", "red"] as const).map((side) => (
          <button
            className={`tg-button tg-winner-toggle ${side === "blue" ? "is-blue" : "is-red"} ${form.winnerTeam === side ? "is-selected" : ""}`}
            type="button"
            key={side}
            onClick={() => patchForm({ winnerTeam: side })}
          >
            {side === "blue" ? "블루팀 승리" : "레드팀 승리"}
          </button>
        ))}
        <button className="tg-button" type="button" onClick={fillDummy}>가상 데이터 채우기</button>
      </div>
      <TrialAssist
        session={session}
        preferredPuuid={
          profile.myPuuid && session.participants.some(({ puuid }) => puuid === profile.myPuuid)
            ? profile.myPuuid
            : undefined
        }
        onMatch={applyMatch}
        onVision={applyVision}
      />
      <div className="tg-grid tg-grid--2">
        {(["blue", "red"] as const).map((side) => {
          const team = side === "blue" ? proposal.blueTeam : proposal.redTeam;
          return (
            <section className={`tg-team-board is-${side}`} style={{ textAlign: "left" }} key={side}>
              <h2>{side === "blue" ? "블루팀" : "레드팀"}</h2>
              {team.map((participant) => {
                const stat = form.stats[participant.puuid];
                return (
                  <div className="tg-grid" style={{ gridTemplateColumns: "minmax(130px,1fr) repeat(4,minmax(90px,.7fr))" }} key={participant.puuid}>
                    <strong>{participant.riotId}</strong>
                    <input className="tg-input" aria-label={`${participant.riotId} KDA`} value={stat?.kda ?? ""} placeholder="12/4/9" onChange={(event) => patchStat(participant.puuid, { kda: event.target.value })} />
                    <input className="tg-input" aria-label={`${participant.riotId} 피해량`} value={stat?.damage ?? ""} placeholder="20,170" onChange={(event) => patchStat(participant.puuid, { damage: event.target.value })} />
                    <input className="tg-input" aria-label={`${participant.riotId} 챔피언 ID`} value={stat?.championId ?? ""} placeholder="챔피언 ID" onChange={(event) => patchStat(participant.puuid, { championId: event.target.value })} />
                    <select className="tg-select" aria-label={`${participant.riotId} 플레이 라인`} value={stat?.playedRole ?? ""} onChange={(event) => patchStat(participant.puuid, { playedRole: event.target.value as MainRole | "" })}>
                      <option value="">라인</option>
                      {(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                    </select>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
      {message && <div className="tg-notice">{message}</div>}
      <ReasonPanel title={`${round}판 평가 근거`} reasons={["직전 누적 LP를 주축으로 이번 판 성과를 반영합니다.", "KDA와 챔피언 피해량이 모두 있을 때 개인 성과 등급을 계산합니다.", "이전 기록이 부족한 참가자는 기대 이상·이하 판정을 생략합니다."]} />
      <div className="tg-row tg-row--between">
        <Link className="tg-button" href={`/session/${session.id}/finish`}>내전 종료하기</Link>
        <button className="tg-button tg-button--primary" type="button" onClick={saveRound}>{round}판 저장 · 재밸런스 보기</button>
      </div>
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
  save: (patch: Partial<Omit<Session, "id" | "createdAt">>) => void;
}) {
  const params = useSearchParams();
  const target = Math.max(2, Math.min(4, Number(params.get("round")) || session.rounds.length + 1)) as 2 | 3 | 4;
  const record = session.rounds.find(({ nextTeamProposal }) => nextTeamProposal.targetRound === target);
  const proposal = record?.nextTeamProposal ?? session.rounds.at(-1)?.nextTeamProposal;
  const [selected, setSelected] = useState<{ puuid: string; side: TeamSide } | null>(null);
  if (!proposal) return <Missing title="재밸런스" href={`/session/${session.id}/trial`} />;
  const activeProposal = proposal;
  const previous = target === 2
    ? session.preTeamProposal
    : session.rounds.find(({ round }) => round === target - 2)?.nextTeamProposal;
  const changed = new Set(proposal.changes?.flatMap(({ outPuuid, inPuuid }) => [outPuuid, inPuuid]) ?? []);

  function select(participant: Participant, side: TeamSide) {
    if (!selected) {
      setSelected({ puuid: participant.puuid, side });
      return;
    }
    if (selected.side === side || selected.puuid === participant.puuid) {
      setSelected(null);
      return;
    }
    const blue = [...activeProposal.blueTeam];
    const red = [...activeProposal.redTeam];
    const blueIndex = blue.findIndex(({ puuid }) => puuid === (side === "blue" ? participant.puuid : selected.puuid));
    const redIndex = red.findIndex(({ puuid }) => puuid === (side === "red" ? participant.puuid : selected.puuid));
    if (blueIndex >= 0 && redIndex >= 0) {
      [blue[blueIndex], red[redIndex]] = [red[redIndex], blue[blueIndex]];
      const next = proposalFromTeams(blue, red, target, previous);
      save({
        rounds: session.rounds.map((item) =>
          item.nextTeamProposal.targetRound === target ? { ...item, nextTeamProposal: next } : item
        ),
      });
    }
    setSelected(null);
  }

  return (
    <section className="tg-stack">
      <header className="tg-panel">
        <h1>{target}판 재밸런스 제안</h1>
        <p className="tg-muted">프로필과 칩 방향을 팀 대치 구도에 맞췄습니다.</p>
        <PowerRatio proposal={proposal} />
      </header>
      <div className="tg-grid tg-grid--2">
        <TeamBoard side="blue" proposal={proposal} bootstrap={bootstrap} round={(target - 1) as RoundNumber} changed={changed} selected={selected?.puuid} onSelect={select} />
        <TeamBoard side="red" proposal={proposal} bootstrap={bootstrap} round={(target - 1) as RoundNumber} changed={changed} selected={selected?.puuid} onSelect={select} />
      </div>
      {proposal.changes?.length ? (
        <section className="tg-panel">
          <h2>교체된 팀원</h2>
          {proposal.changes.filter(({ outPuuid }) => outPuuid).map((change) => {
            const out = session.participants.find(({ puuid }) => puuid === change.outPuuid);
            const incoming = session.participants.find(({ puuid }) => puuid === change.inPuuid);
            return <p key={`${change.toTeam}-${change.inPuuid}`}>{out?.riotId} ↔ {incoming?.riotId} · {change.reason}</p>;
          })}
        </section>
      ) : null}
      <ReasonPanel reasons={["직전 판 결과를 누적 전력에 반영해 다시 팀을 나눴습니다.", "강조 테두리는 직전 구성에서 팀이 바뀐 참가자입니다.", "총무가 필요하면 팀 제안 화면과 같은 방식으로 수동 조정할 수 있습니다."]} />
      <div className="tg-panel tg-row tg-row--between">
        <Link className="tg-button" href={`/session/${session.id}/finish`}>내전 종료하기</Link>
        {target <= 3 ? <Link className="tg-button tg-button--primary" href={`/session/${session.id}/trial`}>{target}판 결과 입력</Link> : <Link className="tg-button tg-button--primary" href={`/session/${session.id}/finish`}>최종 결과 보기</Link>}
      </div>
      <span className="tg-sr-only">{previous ? "직전 팀 구성과 비교됨" : ""}</span>
    </section>
  );
}

function TeamBoard({
  side,
  proposal,
  bootstrap,
  round,
  selected,
  changed,
  onSelect,
  onRemove,
  onAdd,
}: {
  side: TeamSide;
  proposal: TeamProposal;
  bootstrap: DataDragonBootstrap | null;
  round?: RoundNumber;
  selected?: string;
  changed?: Set<string>;
  onSelect?: (participant: Participant, side: TeamSide) => void;
  onRemove?: (participant: Participant, side: TeamSide) => void;
  onAdd?: () => void;
}) {
  const team = side === "blue" ? proposal.blueTeam : proposal.redTeam;
  const average = side === "blue" ? proposal.blueAvgTier : proposal.redAvgTier;
  const name = side === "blue" ? proposal.blueTeamName || "블루팀" : proposal.redTeamName || "레드팀";
  return (
    <section className={`tg-team-board is-${side}`}>
      <header className="tg-row tg-row--between"><h2>{name} <span className="tg-chip">평균 {average.label}</span></h2>{onAdd && <button className="tg-button" type="button" onClick={onAdd}>선수 추가</button>}</header>
      {team.map((participant) => (
        <PlayerCard
          key={participant.puuid}
          participant={participant}
          bootstrap={bootstrap}
          round={round}
          changed={changed?.has(participant.puuid)}
          onClick={onSelect ? () => onSelect(participant, side) : undefined}
          onRemove={onRemove ? () => onRemove(participant, side) : undefined}
        />
      ))}
      {selected && team.some(({ puuid }) => puuid === selected) && <span className="tg-chip is-gold">교체할 반대 팀 선수를 선택하세요</span>}
    </section>
  );
}

function PowerRatio({ proposal }: { proposal: TeamProposal }) {
  return (
    <div className="tg-stack">
      <div className="tg-row tg-row--between"><span>블루 {proposal.bluePowerPct}%</span><span>레드 {proposal.redPowerPct}%</span></div>
      <div style={{ display: "flex", height: 12, overflow: "hidden", borderRadius: 999, background: "#111" }}>
        <span style={{ width: `${proposal.bluePowerPct}%`, background: "#2589ff" }} />
        <span style={{ width: `${proposal.redPowerPct}%`, background: "#ef4f67" }} />
      </div>
    </div>
  );
}

function Missing({ title, href }: { title: string; href: string }) {
  return <section className="tg-panel tg-stack"><h1>{title}</h1><p className="tg-muted">이전 단계를 먼저 완료해 주세요.</p><Link className="tg-button" href={href}>이전 단계로</Link></section>;
}

function proposalForRound(session: Session, round: RoundNumber): TeamProposal | undefined {
  if (round === 1) return session.preTeamProposal;
  return session.rounds.find(({ nextTeamProposal }) => nextTeamProposal.targetRound === round)?.nextTeamProposal;
}

function initialTrialForms(session: Session): Record<RoundNumber, TrialForm> {
  return Object.fromEntries(([1, 2, 3] as const).map((round) => {
    const record = session.rounds.find((item) => item.round === round);
    const proposal = proposalForRound(session, round);
    return [round, {
      winnerTeam: record?.trialResult.winnerTeam ?? "blue",
      matchId: record?.trialResult.matchId ?? "",
      bluePuuids: record?.trialResult.blueTeam.map(({ puuid }) => puuid) ?? proposal?.blueTeam.map(({ puuid }) => puuid) ?? [],
      redPuuids: record?.trialResult.redTeam.map(({ puuid }) => puuid) ?? proposal?.redTeam.map(({ puuid }) => puuid) ?? [],
      stats: Object.fromEntries(session.participants.map((participant) => {
        const saved = record?.trialResult.playerStats.find(({ puuid }) => puuid === participant.puuid);
        return [participant.puuid, {
          kda: saved ? String(saved.kda) : "",
          damage: saved ? saved.damageDealt.toLocaleString("ko-KR") : "",
          championId: saved?.championId ? String(saved.championId) : "",
          playedRole: saved?.playedRole ?? "",
        }];
      })),
    } satisfies TrialForm];
  })) as Record<RoundNumber, TrialForm>;
}

function toTrialDraft(round: RoundNumber, form: TrialForm): TrialDraft | null {
  if (!form.bluePuuids.length || !form.redPuuids.length) return null;
  return {
    round,
    winnerTeam: form.winnerTeam,
    matchId: form.matchId,
    bluePuuids: form.bluePuuids,
    redPuuids: form.redPuuids,
    stats: Object.fromEntries(Object.entries(form.stats).map(([puuid, stat]) => [puuid, {
      kda: parseKda(stat.kda),
      damageDealt: parseNumber(stat.damage),
      championId: stat.championId ? Number(stat.championId) : undefined,
      playedRole: stat.playedRole || undefined,
    }])),
  };
}

function parseKda(value: string): number | null {
  const clean = value.trim();
  if (!clean) return null;
  if (!clean.includes("/")) return parseNumber(clean);
  const [kills, deaths, assists] = clean.split("/").map((part) => Number(part.replaceAll(",", "")));
  return [kills, deaths, assists].every(Number.isFinite) ? (kills + assists) / Math.max(1, deaths) : null;
}

function parseNumber(value: string): number | null {
  const parsed = Number(value.replaceAll(",", "").trim());
  return value.trim() && Number.isFinite(parsed) ? parsed : null;
}

function messageOf(cause: unknown) {
  if (cause instanceof ClientApiError || cause instanceof Error) return cause.message;
  return "요청을 처리하지 못했습니다.";
}

function SearchAccountCandidate({
  account,
  bootstrap,
  actionLabel,
  onSelect,
}: {
  account: AccountResult;
  bootstrap: DataDragonBootstrap | null;
  actionLabel: string;
  onSelect: () => void;
}) {
  const icon = bootstrap ? profileIconUrl(bootstrap.version, account.profileIconId) : undefined;
  return (
    <button className="tg-player-card" type="button" onClick={onSelect}>
      {icon
        ? <Image className="tg-player-card__avatar" src={icon} alt="" width={44} height={44} unoptimized />
        : <span className="tg-player-card__avatar" aria-hidden />}
      <span className="tg-player-card__identity">
        <strong>{account.gameName}#{account.tagLine}</strong>
        <span>{account.tier?.label ?? "언랭크 · 수동 티어 입력 필요"}</span>
      </span>
      <span className="tg-chip is-gold">{actionLabel}</span>
    </button>
  );
}

function matchRole(value?: string): MainRole | "" {
  const normalized = value?.toUpperCase();
  if (normalized === "MID") return "MIDDLE";
  if (normalized === "ADC" || normalized === "BOT") return "BOTTOM";
  if (normalized === "SUPPORT") return "UTILITY";
  return ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"].includes(normalized ?? "")
    ? normalized as MainRole
    : "";
}

function isParticipant(value: Participant | undefined): value is Participant {
  return Boolean(value);
}
