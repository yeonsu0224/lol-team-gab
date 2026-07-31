"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AssistantSidebar } from "@/components/assistant/AssistantSidebar";
import { DemoDataBadge } from "@/components/demo/DemoDataBadge";
import { DemoPlayerChips } from "@/components/demo/DemoPlayerChips";
import { ActionBar } from "@/components/layout/ActionBar";
import { StepNav } from "@/components/layout/StepNav";
import { AnalysisTransition } from "@/components/motion/AnalysisTransition";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
import { isDemoPuuidClient } from "@/lib/demo/useDemoStatus";
import { useT } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/messages/ko";
import { useTierLabel } from "@/lib/i18n/useTierLabel";
import {
  buildTeamProposal,
  proposalFromTeams,
  refreshParticipantScores,
  replayTrialRounds,
  type TrialDraft,
} from "@/lib/domain/sessionWorkflow";
import {
  ClientApiError,
  championIconUrl,
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
import { PlayerCard, displayGameName } from "./PlayerCard";
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
  const t = useT();
  const { sessions, error, hydrated, update } = useSessions();
  const session = sessions.find(({ id }) => id === sessionId);
  const [bootstrap, setBootstrap] = useState<DataDragonBootstrap | null>(null);

  useEffect(() => {
    void loadBootstrap().then(setBootstrap).catch(() => undefined);
  }, []);

  if (error) return <main className="tg-page"><div className="tg-notice tg-notice--error">{error}</div></main>;
  if (!hydrated) return <main className="tg-page"><p aria-busy>{t("session.loading")}</p></main>;
  if (!session) {
    return (
      <main className="tg-page tg-panel">
        <h1>{t("session.notFound")}</h1>
        <Link className="tg-button" href="/dashboard">{t("session.toDashboard")}</Link>
      </main>
    );
  }

  const save = (
    patch: Partial<Omit<Session, "id" | "createdAt">> | ((current: Session) => Session),
  ) => update(sessionId, patch);

  return (
    <main className="tg-page tg-stack">
      <StepNav sessionId={sessionId} active={view} />
      {view === "players" && <PlayersView session={session} bootstrap={bootstrap} save={save} />}
      {view === "team" && <TeamView session={session} bootstrap={bootstrap} save={save} />}
      {view === "trial" && <TrialView session={session} bootstrap={bootstrap} save={save} />}
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
  const t = useT();
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

  const [tagHint, setTagHint] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      const timer = window.setTimeout(() => {
        setRemoteAccounts([]);
        setTagHint(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timeout = window.setTimeout(() => {
      setLoading(true);
      const remoteQuery = value.includes("#") ? value : `${value}#KR1`;
      void searchAccounts(remoteQuery)
        .then((accounts) => {
          setRemoteAccounts(accounts);
          setTagHint(!value.includes("#") && accounts.length === 0);
          setError("");
        })
        .catch((cause) => {
          setRemoteAccounts([]);
          setTagHint(!value.includes("#"));
          if (value.includes("#")) setError(messageOf(cause));
        })
        .finally(() => setLoading(false));
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const localAccounts = !query.includes("#") && query.trim()
    ? recent
        .filter(({ gameName }) => gameName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
        .map(({ puuid, gameName, tagLine, profileIconId }) => ({ puuid, gameName, tagLine, profileIconId }))
    : [];
  const accounts = query.includes("#")
    ? remoteAccounts
    : localAccounts.length
      ? localAccounts
      : remoteAccounts;

  async function add(account: AccountResult, manualTier?: { tier: string; rank: string; lp: number }) {
    if (session.participants.some(({ puuid }) => puuid === account.puuid)) {
      setError(t("players.alreadyAdded"));
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
      setMessage(t("players.added", { riotId: participant.riotId }));
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

  function updateEvaluation(
    puuid: string,
    patch: Partial<Pick<Participant, "manualScoreAdjustment" | "tierAssessment">>,
  ) {
    const participants = refreshParticipantScores(
      session.participants.map((participant) =>
        participant.puuid === puuid ? { ...participant, ...patch } : participant,
      ),
    );
    // 팀 제안 이후 점수를 바꾸면 기존 제안과 판 기록이 새 점수와 불일치하므로 초기화한다.
    save({ participants, preTeamProposal: undefined, rounds: [] });
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
    return <AnalysisTransition messages={[t("players.analyzing1"), t("players.analyzing2"), t("players.analyzing3")]} onComplete={finishTransition} />;
  }

  return (
    <section className="tg-stack">
      <div className="tg-panel tg-stack">
        <div className="tg-row tg-row--between">
          <div>
            <h1 className="tg-row" style={{ gap: 8 }}>
              {t("players.title")}
              <DemoDataBadge />
            </h1>
            <p className="tg-muted">{t("players.count", { count: session.participants.length })}</p>
          </div>
          <button className="tg-button" type="button" onClick={() => setRecentOpen(true)}>{t("players.recent")}</button>
        </div>
        <p className="tg-muted">{t("players.hint")}</p>
        <div className="tg-row">
          <input
            className="tg-input"
            style={{ flex: 1 }}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setError(""); setTagHint(false); }}
            placeholder={t("players.placeholder")}
            aria-label={t("players.searchAria")}
          />
          <span>{loading ? t("dashboard.searching") : ""}</span>
        </div>
        <DemoPlayerChips onSelect={(riotId) => { setQuery(riotId); setError(""); setTagHint(false); }} />
        {tagHint && (
          <p className="tg-muted">{t("players.tagHint")}</p>
        )}
        {!query.includes("#") && query.trim() && !accounts.length && !tagHint && !loading && (
          <p className="tg-muted">{t("players.noRecent")}</p>
        )}
        {accounts.length > 0 && (
          <div className="tg-grid">
            {accounts.map((account) => (
              <SearchAccountCandidate
                key={account.puuid}
                account={account}
                bootstrap={bootstrap}
                actionLabel={t("players.register")}
                onSelect={() => void add(account)}
              />
            ))}
          </div>
        )}
      </div>
      {error && <div className="tg-notice tg-notice--error" role="alert">{error}</div>}
      {message && <div className="tg-notice tg-notice--success">{message}</div>}
      <div className="tg-player-register">
        {session.participants.map((participant) => (
          <PlayerCard
            key={participant.puuid}
            participant={participant}
            bootstrap={bootstrap}
            onRemove={() => remove(participant.puuid)}
            registrationDetails
            onEvaluationChange={(patch) => updateEvaluation(participant.puuid, patch)}
          />
        ))}
      </div>
      <ReasonPanel reasons={[t("players.reason1"), t("players.reason2"), t("players.reason3"), t("players.reason4")]} />
      <ActionBar>
        <button className={`tg-button ${ready ? "tg-button--ready" : ""}`} type="button" disabled={!ready} onClick={propose}>
          {ready ? t("players.propose") : t("players.needMore", { count: session.participants.length })}
        </button>
      </ActionBar>
      {recentOpen && (
        <div className="tg-modal-backdrop" role="presentation" onMouseDown={() => setRecentOpen(false)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between"><h2>{t("players.recent")}</h2><button className="tg-button" onClick={() => setRecentOpen(false)}>{t("players.close")}</button></div>
            {recent.length ? recent.map((item) => (
              <div className="tg-row tg-row--between" key={item.puuid}>
                <button className="tg-button" onClick={() => void add(item)}>{item.riotId} {t("players.reregister")}</button>
                <button className="tg-button" onClick={() => removeRecentPlayer(item.puuid)}>{t("players.removeRecent")}</button>
              </div>
            )) : <p className="tg-muted">{t("players.noRecentList")}</p>}
          </section>
        </div>
      )}
      {manual && (
        <div className="tg-modal-backdrop" onMouseDown={() => setManual(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <h2>{t("manual.title")}</h2>
            <p className="tg-muted">{t("manual.body", { riotId: `${manual.account.gameName}#${manual.account.tagLine}` })}</p>
            <div className="tg-grid tg-grid--2">
              <label className="tg-field"><span>{t("manual.tier")}</span><select className="tg-select" value={manual.tier} onChange={(event) => setManual({ ...manual, tier: event.target.value })}>
                {["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"].map((tier) => <option key={tier}>{tier}</option>)}
              </select></label>
              <label className="tg-field"><span>{t("manual.rank")}</span><select className="tg-select" value={manual.rank} onChange={(event) => setManual({ ...manual, rank: event.target.value })}>
                {["IV", "III", "II", "I"].map((rank) => <option key={rank}>{rank}</option>)}
              </select></label>
              <label className="tg-field"><span>{t("manual.lp")}</span><input className="tg-input" type="number" min={0} max={99} value={manual.lp} onChange={(event) => setManual({ ...manual, lp: Number(event.target.value) })} /></label>
            </div>
            <div className="tg-row">
              <button className="tg-button" type="button" onClick={() => setManual(null)}>{t("common.cancel")}</button>
              <button className="tg-button tg-button--primary" type="button" onClick={() => {
                const value = manual;
                setManual(null);
                void add(value.account, value);
              }}>{t("manual.submit")}</button>
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
  const t = useT();
  const proposal = session.preTeamProposal;
  const [selected, setSelected] = useState<{ puuid: string; side: TeamSide } | null>(null);
  const [editSide, setEditSide] = useState<TeamSide | null>(null);
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<AccountResult[]>([]);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  if (!proposal) return <Missing title={t("team.title")} href={`/session/${session.id}/players`} />;

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
      setEditError(t("team.maxPlayers"));
      return;
    }
    if (session.participants.some(({ puuid }) => puuid === account.puuid)) {
      setEditError(t("session.alreadyIn"));
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
        <h1>{t("team.title")}</h1>
        <p className="tg-muted">{t("team.hint")}</p>
        <PowerRatio proposal={proposal} />
      </header>
      <div className="tg-versus">
        <TeamBoard side="blue" proposal={proposal} bootstrap={bootstrap} selected={selected?.puuid} onSelect={select} onRemove={removeMember} onAdd={() => setEditSide("blue")} />
        <span className="tg-versus__mark" aria-hidden>VS</span>
        <TeamBoard side="red" proposal={proposal} bootstrap={bootstrap} selected={selected?.puuid} onSelect={select} onRemove={removeMember} onAdd={() => setEditSide("red")} />
      </div>
      <section className="tg-panel">
        <div><strong>{t("team.balance")}</strong><p className="tg-muted">{t("team.balanceMeta", { diff: proposal.tierDiffDivisions })}</p></div>
      </section>
      <ReasonPanel reasons={[t("team.reason1"), t("team.reason2"), t("team.reason3")]} />
      <ActionBar>
        <Link className="tg-button" href={`/session/${session.id}/finish`}>{t("team.finish")}</Link>
        <Link className="tg-button tg-button--primary" href={`/session/${session.id}/trial`}>{t("team.trial")}</Link>
      </ActionBar>
      {editSide && (
        <div className="tg-modal-backdrop" onMouseDown={() => setEditSide(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between"><h2>{t("team.addMember", { side: editSide === "blue" ? t("team.blue") : t("team.red") })}</h2><button className="tg-button" onClick={() => setEditSide(null)}>{t("common.close")}</button></div>
            <div className="tg-row">
              <input className="tg-input" style={{ flex: 1 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("players.placeholder")} />
              <button className="tg-button tg-button--primary" disabled={!query.includes("#") || editLoading} onClick={() => void searchMember()}>{t("common.search")}</button>
            </div>
            <DemoPlayerChips onSelect={(riotId) => { setQuery(riotId); }} />
            {accounts.map((account) => (
              <SearchAccountCandidate
                key={account.puuid}
                account={account}
                bootstrap={bootstrap}
                actionLabel={t("team.add")}
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
  bootstrap,
  save,
}: {
  session: Session;
  bootstrap: DataDragonBootstrap | null;
  save: (patch: Partial<Omit<Session, "id" | "createdAt">> | ((current: Session) => Session)) => void;
}) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const [round, setRound] = useState<RoundNumber>(Math.min(3, session.rounds.length + 1) as RoundNumber);
  const [forms, setForms] = useState<Record<RoundNumber, TrialForm>>(() => initialTrialForms(session));
  const [message, setMessage] = useState("");
  const [transition, setTransition] = useState(false);
  const [champPickerFor, setChampPickerFor] = useState<string | null>(null);
  const [championQuery, setChampionQuery] = useState("");
  const [visionMap, setVisionMap] = useState<Array<{ riotId?: string; role?: string; kda?: string; damage?: number; championName?: string }> | null>(null);
  const t = useT();
  const proposal = proposalForRound(session, round);
  const form = forms[round];
  const champions = bootstrap
    ? uniqueCurrentChampions(Object.values(bootstrap.championsByKey))
    : [];
  const normalizedChampionQuery = normalizeChampionSearch(championQuery);
  const visibleChampions = normalizedChampionQuery
    ? champions.filter((champion) =>
        normalizeChampionSearch(champion.name).includes(normalizedChampionQuery)
        || normalizeChampionSearch(champion.id).includes(normalizedChampionQuery)
      )
    : champions;

  const finishTransition = useCallback(() => {
    router.push(`/session/${session.id}/rebalance?round=${Math.min(4, round + 1)}`);
  }, [router, round, session.id]);

  if (transition) {
    return <AnalysisTransition messages={[t("trial.analyzing1"), t("trial.analyzing2"), t("trial.analyzing3")]} onComplete={finishTransition} />;
  }
  if (!proposal) return <Missing title={t("trial.missing")} href={`/session/${session.id}/team`} />;

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
    setMessage(t("trial.dummyFilled", { round }));
  }

  function applyMatch(match: MatchPayload) {
    const known = new Set(session.participants.map(({ puuid }) => puuid));
    const rows = match.info.participants.filter(({ puuid }) => known.has(puuid));
    if (!rows.length) {
      setMessage(t("trial.noMatchPlayers"));
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
    setMessage(t("trial.matchFilled", { count: rows.length }));
  }

  function applyVision(players: Array<{ riotId?: string; role?: string; kda?: string; damage?: number; championName?: string }>) {
    const unmatched = players.filter((row) => {
      const name = row.riotId?.split("#")[0]?.trim().toLocaleLowerCase();
      return !session.participants.some(({ riotId }) => Boolean(name && riotId.split("#")[0].trim().toLocaleLowerCase() === name));
    });
    if (unmatched.length) {
      setVisionMap(players);
      setMessage(t("trial.visionPartial"));
      return;
    }
    const stats = { ...form.stats };
    players.forEach((row) => {
      const name = row.riotId?.split("#")[0]?.trim().toLocaleLowerCase();
      const participant = session.participants.find(({ riotId }) =>
        Boolean(name && riotId.split("#")[0].trim().toLocaleLowerCase() === name)
      );
      if (!participant) return;
      const champion = row.championName
        ? champions.find((item) => item.name === row.championName || item.id === row.championName)
        : undefined;
      stats[participant.puuid] = {
        ...stats[participant.puuid],
        kda: row.kda ?? stats[participant.puuid].kda,
        damage: row.damage != null ? row.damage.toLocaleString("ko-KR") : stats[participant.puuid].damage,
        playedRole: matchRole(row.role) || stats[participant.puuid].playedRole,
        championId: champion?.key ?? stats[participant.puuid].championId,
      };
    });
    patchForm({ stats });
    setMessage(t("trial.visionFilled", { count: players.length }));
  }

  function bindVisionRow(index: number, puuid: string) {
    if (!visionMap) return;
    const row = visionMap[index];
    const champion = row.championName
      ? champions.find((item) => item.name === row.championName || item.id === row.championName)
      : undefined;
    patchStat(puuid, {
      kda: row.kda ?? form.stats[puuid]?.kda ?? "",
      damage: row.damage != null ? row.damage.toLocaleString("ko-KR") : form.stats[puuid]?.damage ?? "",
      playedRole: matchRole(row.role) || form.stats[puuid]?.playedRole || "",
      championId: champion?.key ?? form.stats[puuid]?.championId ?? "",
    });
    setVisionMap((current) => current?.filter((_, itemIndex) => itemIndex !== index) ?? null);
  }

  function saveRound() {
    const drafts = ([1, 2, 3] as const)
      .filter((item) => item <= Math.max(round, session.rounds.length))
      .map((item) => toTrialDraft(item, forms[item]))
      .filter((draft): draft is TrialDraft => draft !== null);
    const next = replayTrialRounds(session, drafts);
    if (next.rounds.length < round) {
      setMessage(t("trial.saveOrder"));
      return;
    }
    save(next);
    setTransition(true);
  }

  return (
    <section className="tg-stack">
      <div className="tg-panel tg-stack">
        <header className="tg-row tg-row--between">
          <div><h1>{t("trial.title")}</h1><p className="tg-muted">{t("trial.hint")}</p></div>
          <div className="tg-row">
            {([1, 2, 3] as const).map((item) => (
              <button className={`tg-button ${round === item ? "tg-button--primary" : ""}`} type="button" key={item} onClick={() => setRound(item)}>
                {t("trial.roundTab", { round: item })} {session.rounds.some((record) => record.round === item) ? "✓" : ""}
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
              {side === "blue" ? t("trial.blueWin") : t("trial.redWin")}
            </button>
          ))}
          <button className="tg-button" type="button" onClick={fillDummy}>{t("trial.fillDummy")}</button>
        </div>
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
      <div className="tg-grid tg-grid--2 tg-trial-form">
        {(["blue", "red"] as const).map((side) => {
          const team = side === "blue" ? proposal.blueTeam : proposal.redTeam;
          const takenRoles = new Set(
            team
              .map(({ puuid }) => form.stats[puuid]?.playedRole)
              .filter((role): role is MainRole => Boolean(role)),
          );
          return (
            <section className={`tg-team-board is-${side}`} style={{ textAlign: "left" }} key={side}>
              <h2>{side === "blue" ? t("team.blue") : t("team.red")}</h2>
              {team.map((participant) => {
                const stat = form.stats[participant.puuid];
                const avatar = bootstrap ? profileIconUrl(bootstrap.version, participant.profileIconId) : undefined;
                const champ = stat?.championId && bootstrap?.championsByKey[stat.championId];
                return (
                  <div className="tg-grid" style={{ gridTemplateColumns: "auto minmax(90px,1fr) repeat(3,minmax(70px,.7fr))" }} key={participant.puuid}>
                    <span className="tg-row">
                      {avatar
                        ? <Image className="tg-player-card__avatar" src={avatar} alt="" width={36} height={36} unoptimized />
                        : <span className="tg-player-card__avatar" />}
                      <strong>{displayGameName(participant.riotId)}</strong>
                    </span>
                    <input className="tg-input" aria-label={`${participant.riotId} KDA`} value={stat?.kda ?? ""} placeholder="12/4/9" onChange={(event) => patchStat(participant.puuid, { kda: event.target.value })} />
                    <input className="tg-input" aria-label={`${participant.riotId} ${t("trial.damageAria")}`} value={stat?.damage ?? ""} placeholder="20,170" onChange={(event) => patchStat(participant.puuid, { damage: event.target.value })} />
                    <button className="tg-button" type="button" onClick={() => {
                      setChampionQuery("");
                      setChampPickerFor(participant.puuid);
                    }}>
                      {champ && bootstrap
                        ? <Image src={championIconUrl(bootstrap.version, champ.image.full)} alt={champ.name} width={28} height={28} unoptimized />
                        : t("trial.champion")}
                    </button>
                    <select
                      className="tg-select"
                      aria-label={`${participant.riotId} ${t("trial.roleAria")}`}
                      value={stat?.playedRole ?? ""}
                      onChange={(event) => patchStat(participant.puuid, { playedRole: event.target.value as MainRole | "" })}
                    >
                      <option value="">{t("trial.roleEmpty")}</option>
                      {(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const).map((role) => (
                        <option
                          key={role}
                          value={role}
                          disabled={takenRoles.has(role) && stat?.playedRole !== role}
                        >
                          {t(`role.${role}` as MessageKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
      {message && <div className="tg-notice">{message}</div>}
      <ReasonPanel title={t("trial.reasonTitle", { round })} reasons={[t("trial.reason1"), t("trial.reason2"), t("trial.reason3")]} />
      <ActionBar>
        <Link className="tg-button" href={`/session/${session.id}/finish`}>{t("team.finish")}</Link>
        <button className="tg-button tg-button--primary" type="button" onClick={saveRound}>{t("trial.saveRebalance", { round })}</button>
      </ActionBar>
      {champPickerFor && bootstrap && (
        <div className="tg-modal-backdrop" onMouseDown={() => setChampPickerFor(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between"><h2>{t("trial.champion")}</h2><button className="tg-button" type="button" onClick={() => setChampPickerFor(null)}>{t("common.close")}</button></div>
            <input
              className="tg-input"
              type="search"
              autoFocus
              value={championQuery}
              onChange={(event) => setChampionQuery(event.target.value)}
              placeholder={t("trial.championSearch")}
              aria-label={t("trial.championSearch")}
            />
            <div className="tg-champion-picker">
              {visibleChampions.map((champion) => (
                <button
                  className={`tg-champion-picker__item ${form.stats[champPickerFor]?.championId === champion.key ? "is-selected" : ""}`}
                  type="button"
                  key={champion.key}
                  onClick={() => {
                    patchStat(champPickerFor, { championId: champion.key });
                    setChampPickerFor(null);
                  }}
                >
                  <Image src={championIconUrl(bootstrap.version, champion.image.full)} alt="" width={36} height={36} unoptimized />
                  <span>{champion.name}</span>
                </button>
              ))}
              {!visibleChampions.length && <p className="tg-champion-picker__empty">{t("trial.noChampions")}</p>}
            </div>
          </section>
        </div>
      )}
      {visionMap && (
        <div className="tg-modal-backdrop" onMouseDown={() => setVisionMap(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between"><h2>{t("trial.visionMatchTitle")}</h2><button className="tg-button" type="button" onClick={() => setVisionMap(null)}>{t("common.close")}</button></div>
            {visionMap.map((row, index) => (
              <div className="tg-row tg-row--between" key={`${row.riotId}-${index}`}>
                <span>{row.riotId || row.championName || t("trial.visionDetected", { index: index + 1 })} · {row.kda} · {row.damage}</span>
                <select className="tg-select" defaultValue="" onChange={(event) => { if (event.target.value) bindVisionRow(index, event.target.value); }}>
                  <option value="">{t("trial.visionBind")}</option>
                  {session.participants.map((participant) => (
                    <option value={participant.puuid} key={participant.puuid}>{displayGameName(participant.riotId)}</option>
                  ))}
                </select>
              </div>
            ))}
          </section>
        </div>
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
  save: (patch: Partial<Omit<Session, "id" | "createdAt">>) => void;
}) {
  const params = useSearchParams();
  const t = useT();
  const target = Math.max(2, Math.min(4, Number(params.get("round")) || session.rounds.length + 1)) as 2 | 3 | 4;
  const record = session.rounds.find(({ nextTeamProposal }) => nextTeamProposal.targetRound === target);
  const proposal = record?.nextTeamProposal ?? session.rounds.at(-1)?.nextTeamProposal;
  const [selected, setSelected] = useState<{ puuid: string; side: TeamSide } | null>(null);
  if (!proposal) return <Missing title={t("rebalance.missing")} href={`/session/${session.id}/trial`} />;
  const activeProposal = proposal;
  const previous = target === 2
    ? session.preTeamProposal
    : session.rounds.find(({ round }) => round === target - 2)?.nextTeamProposal;
  const trades = (proposal.changes ?? []).filter(({ outPuuid, inPuuid }) => outPuuid && inPuuid);
  // 같은 스왑이 양쪽으로 두 번 적힐 수 있어, 정렬한 쌍으로 한 번만 센다.
  const uniqueTrades = Array.from(
    new Map(
      trades.map((change) => {
        const key = [change.outPuuid, change.inPuuid].sort().join(":");
        return [key, change] as const;
      }),
    ).values(),
  );
  const changed = new Set(trades.flatMap(({ outPuuid, inPuuid }) => [outPuuid, inPuuid]));
  const changedCount = changed.size;
  const tradeLabelByPuuid = new Map<string, string>();
  for (const change of trades) {
    tradeLabelByPuuid.set(change.inPuuid, change.toTeam === "blue" ? t("rebalance.moveBlue") : t("rebalance.moveRed"));
    tradeLabelByPuuid.set(change.outPuuid, change.toTeam === "blue" ? t("rebalance.moveRed") : t("rebalance.moveBlue"));
  }

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

  function retryWithPreviousTeam() {
    if (!previous) return;
    const currentByPuuid = new Map(session.participants.map((participant) => [participant.puuid, participant]));
    const blue = previous.blueTeam
      .map(({ puuid }) => currentByPuuid.get(puuid))
      .filter((participant): participant is Participant => Boolean(participant));
    const red = previous.redTeam
      .map(({ puuid }) => currentByPuuid.get(puuid))
      .filter((participant): participant is Participant => Boolean(participant));
    const next = proposalFromTeams(blue, red, target, previous);
    save({
      rounds: session.rounds.map((item) =>
        item.nextTeamProposal.targetRound === target ? { ...item, nextTeamProposal: next } : item
      ),
    });
    setSelected(null);
  }

  return (
    <section className="tg-stack">
      <header className="tg-panel">
        <div className="tg-row tg-row--between">
          <h1>{t("rebalance.title", { round: target })}</h1>
          <button className="tg-button" type="button" onClick={retryWithPreviousTeam} disabled={!previous}>
            {t("rebalance.retry")}
          </button>
        </div>
        <p className={` ${changedCount ? "is-trade" : "is-gold"}`}>
          {changedCount
            ? t("rebalance.traded", { count: changedCount / 2 })
            : t("rebalance.golden")}
        </p>
        <PowerRatio proposal={proposal} />
      </header>
      <div className="tg-versus">
        <TeamBoard
          side="blue"
          proposal={proposal}
          bootstrap={bootstrap}
          round={(target - 1) as RoundNumber}
          changed={changed}
          tradeLabelByPuuid={tradeLabelByPuuid}
          selected={selected?.puuid}
          onSelect={select}
        />
        <span className="tg-versus__mark" aria-hidden>VS</span>
        <TeamBoard
          side="red"
          proposal={proposal}
          bootstrap={bootstrap}
          round={(target - 1) as RoundNumber}
          changed={changed}
          tradeLabelByPuuid={tradeLabelByPuuid}
          selected={selected?.puuid}
          onSelect={select}
        />
      </div>
      <section className="tg-panel tg-stack">
        <h2>{t("rebalance.tradesTitle")}</h2>
        {uniqueTrades.length ? (
          <ul className="tg-trade-list">
            {uniqueTrades.map((change) => {
              const out = session.participants.find(({ puuid }) => puuid === change.outPuuid);
              const incoming = session.participants.find(({ puuid }) => puuid === change.inPuuid);
              if (!out || !incoming) return null;
              return (
                <li className="tg-trade-list__item" key={`${change.outPuuid}-${change.inPuuid}`}>
                  <TradePlayer participant={out} bootstrap={bootstrap} />
                  <span className="tg-trade-list__mark" aria-hidden>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 7h11l-2.5-2.5M18 17H7l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <TradePlayer participant={incoming} bootstrap={bootstrap} />
                  <span className="tg-chip is-gold">{change.toTeam === "blue" ? t("rebalance.swapBlueRed") : t("rebalance.swapRedBlue")}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="tg-muted">{t("rebalance.noTrades")}</p>
        )}
      </section>
      <ReasonPanel reasons={[t("rebalance.reason1"), t("rebalance.reason2"), t("rebalance.reason3")]} />
      <ActionBar>
        <Link className="tg-button" href={`/session/${session.id}/finish`}>{t("team.finish")}</Link>
        {target <= 3
          ? <Link className="tg-button tg-button--primary" href={`/session/${session.id}/trial`}>{t("rebalance.enterRound", { round: target })}</Link>
          : <Link className="tg-button tg-button--primary" href={`/session/${session.id}/finish`}>{t("rebalance.finalResults")}</Link>}
      </ActionBar>
      <span className="tg-sr-only">{previous ? t("rebalance.compared") : ""}</span>
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
  tradeLabelByPuuid,
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
  tradeLabelByPuuid?: Map<string, string>;
  onSelect?: (participant: Participant, side: TeamSide) => void;
  onRemove?: (participant: Participant, side: TeamSide) => void;
  onAdd?: () => void;
}) {
  const t = useT();
  const { formatTier } = useTierLabel();
  const team = side === "blue" ? proposal.blueTeam : proposal.redTeam;
  const average = side === "blue" ? proposal.blueAvgTier : proposal.redAvgTier;
  const name = side === "blue" ? proposal.blueTeamName || t("team.blue") : proposal.redTeamName || t("team.red");
  return (
    <section className={`tg-team-board is-${side}`}>
      <header className="tg-team-board__header">
        <h2>
          <span>{name}</span>
          <span className="tg-chip">{t("team.avg", { label: formatTier(average) })}</span>
        </h2>
        {onAdd && <button className="tg-button" type="button" onClick={onAdd}>{t("team.add")}</button>}
      </header>
      {team.map((participant) => (
        <PlayerCard
          key={participant.puuid}
          participant={participant}
          bootstrap={bootstrap}
          round={round}
          changed={changed?.has(participant.puuid)}
          tradeLabel={tradeLabelByPuuid?.get(participant.puuid)}
          onClick={onSelect ? () => onSelect(participant, side) : undefined}
          onRemove={onRemove ? () => onRemove(participant, side) : undefined}
        />
      ))}
      {selected && team.some(({ puuid }) => puuid === selected) && <span className="tg-chip is-gold">{t("team.pickOpposite")}</span>}
    </section>
  );
}

function TradePlayer({
  participant,
  bootstrap,
}: {
  participant: Participant;
  bootstrap: DataDragonBootstrap | null;
}) {
  const src = bootstrap && participant.profileIconId != null
    ? profileIconUrl(bootstrap.version, participant.profileIconId)
    : undefined;
  return (
    <span className="tg-trade-list__player">
      {src
        ? <Image className="tg-player-card__avatar" src={src} alt="" width={36} height={36} unoptimized />
        : <span className="tg-player-card__avatar" />}
      <strong>{displayGameName(participant.riotId)}</strong>
    </span>
  );
}

function PowerRatio({ proposal }: { proposal: TeamProposal }) {
  const t = useT();
  return (
    <div className="tg-stack">
      <div className="tg-row tg-row--between"><span>{t("team.blue")} {proposal.bluePowerPct}%</span><span>{t("team.red")} {proposal.redPowerPct}%</span></div>
      <div style={{ display: "flex", height: 12, overflow: "hidden", borderRadius: 999, background: "#111" }}>
        <span style={{ width: `${proposal.bluePowerPct}%`, background: "#2589ff" }} />
        <span style={{ width: `${proposal.redPowerPct}%`, background: "#ef4f67" }} />
      </div>
    </div>
  );
}

function Missing({ title, href }: { title: string; href: string }) {
  const t = useT();
  return (
    <section className="tg-panel tg-stack">
      <h1>{title}</h1>
      <p className="tg-muted">{t("session.prevRequired")}</p>
      <Link className="tg-button" href={href}>{t("session.prevStep")}</Link>
    </section>
  );
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

type ChampionSummary = DataDragonBootstrap["championsByKey"][string];

function normalizeChampionSearch(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
}

/**
 * 최신 Data Dragon에 섞인 모드 전용 Jade 변형을 제외한다.
 * 서버 캐시가 갱신되기 전에도 선택 UI에 같은 이름이 두 번 나오지 않도록
 * 정규화된 이름으로 한 번 더 방어적으로 중복을 제거한다.
 */
function uniqueCurrentChampions(champions: ChampionSummary[]) {
  const unique = new Map<string, ChampionSummary>();
  champions
    .filter((champion) => !champion.id.startsWith("Jade_"))
    .sort((a, b) => Number(a.key) - Number(b.key))
    .forEach((champion) => {
      const name = normalizeChampionSearch(champion.name);
      if (!unique.has(name)) unique.set(name, champion);
    });
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function messageOf(cause: unknown) {
  if (cause instanceof ClientApiError || cause instanceof Error) return cause.message;
  return "Request failed";
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
  const t = useT();
  const { formatTier } = useTierLabel();
  const icon = bootstrap ? profileIconUrl(bootstrap.version, account.profileIconId) : undefined;
  return (
    <button className="tg-player-card" type="button" onClick={onSelect}>
      {icon
        ? <Image className="tg-player-card__avatar" src={icon} alt="" width={44} height={44} unoptimized />
        : <span className="tg-player-card__avatar" aria-hidden />}
      <span className="tg-player-card__identity">
        <strong className="tg-row" style={{ gap: 6 }}>
          {account.gameName}#{account.tagLine}
          {isDemoPuuidClient(account.puuid) && <DemoDataBadge />}
        </strong>
        <span>{account.tier ? formatTier(account.tier) : t("players.unranked")}</span>
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
