"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { PageHeader } from "@/components/layout/PageHeader";
import { LaneIcon } from "@/components/player/LaneIcon";
import { ProfileIcon } from "@/components/player/ProfileIcon";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
import { MatchIdModal } from "@/components/trial/MatchIdModal";
import { VisionModal } from "@/components/trial/VisionModal";
import type { AppliedResult, RosterEntry } from "@/components/trial/applyTypes";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { BootstrapProvider } from "@/lib/ddragon/BootstrapProvider";
import { buildRebalanceSummaryPayload } from "@/lib/domain/summaryPayload";
import { parseKdaInput, parseStatNumber } from "@/lib/utils/parseStatNumber";
import { saveTrialRound } from "@/lib/storage/roundStore";
import { useSession } from "@/lib/storage/useSessions";
import type {
  Participant,
  RoundNumber,
  Session,
  TeamProposal,
  TeamSide,
  TrialResult,
} from "@/lib/types";

import styles from "./trial.module.scss";

interface StatDraft {
  kdaText: string;
  damageText: string;
}

interface RoundForm {
  winnerTeam: TeamSide | null;
  stats: Record<string, StatDraft>;
}

const ROUND_TABS: RoundNumber[] = [1, 2, 3];

function proposalForRound(
  session: Session | null,
  round: RoundNumber,
): TeamProposal | null {
  if (!session) {
    return null;
  }
  if (round === 1) {
    return session.preTeamProposal ?? null;
  }
  const previous = session.rounds.find(
    (record) => record.trialResult.round === round - 1,
  );
  return previous?.nextTeamProposal ?? null;
}

function buildDefaultForm(
  session: Session | null,
  round: RoundNumber,
  proposal: TeamProposal | null,
): RoundForm {
  const existing = session?.rounds.find(
    (record) => record.trialResult.round === round,
  );
  const stats: Record<string, StatDraft> = {};
  const members = proposal
    ? [...proposal.blueTeam, ...proposal.redTeam]
    : [];
  for (const member of members) {
    const saved = existing?.trialResult.playerStats.find(
      (stat) => stat.puuid === member.puuid,
    );
    stats[member.puuid] = {
      kdaText: saved && saved.kda > 0 ? String(Math.round(saved.kda * 100) / 100) : "",
      damageText: saved && saved.damageDealt > 0 ? String(saved.damageDealt) : "",
    };
  }
  return {
    winnerTeam: existing?.trialResult.winnerTeam ?? null,
    stats,
  };
}

export default function TrialPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const router = useRouter();

  const searchParams = useSearchParams();
  const requestedRound = Number(searchParams.get("round"));
  const initialRound: RoundNumber =
    requestedRound === 2 || requestedRound === 3 ? requestedRound : 1;

  const { session, isHydrated } = useSession(sessionId);
  const [activeRound, setActiveRound] = useState<RoundNumber>(initialRound);
  const [drafts, setDrafts] = useState<Partial<Record<RoundNumber, RoundForm>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [visionModalOpen, setVisionModalOpen] = useState(false);

  const proposal = useMemo(
    () => proposalForRound(session, activeRound),
    [session, activeRound],
  );

  const form =
    drafts[activeRound] ?? buildDefaultForm(session, activeRound, proposal);

  const roster: RosterEntry[] = useMemo(() => {
    if (!proposal) {
      return [];
    }
    return [
      ...proposal.blueTeam.map((p) => ({
        puuid: p.puuid,
        riotId: p.riotId,
        team: "blue" as TeamSide,
      })),
      ...proposal.redTeam.map((p) => ({
        puuid: p.puuid,
        riotId: p.riotId,
        team: "red" as TeamSide,
      })),
    ];
  }, [proposal]);

  function updateForm(updater: (current: RoundForm) => RoundForm) {
    setDrafts((previous) => ({
      ...previous,
      [activeRound]: updater(
        previous[activeRound] ??
          buildDefaultForm(session, activeRound, proposal),
      ),
    }));
  }

  function setStat(puuid: string, field: keyof StatDraft, value: string) {
    updateForm((current) => ({
      ...current,
      stats: {
        ...current.stats,
        [puuid]: {
          ...(current.stats[puuid] ?? { kdaText: "", damageText: "" }),
          [field]: value,
        },
      },
    }));
  }

  function applyFromModal(result: AppliedResult) {
    updateForm((current) => {
      const stats = { ...current.stats };
      for (const [puuid, applied] of Object.entries(result.stats)) {
        stats[puuid] = {
          kdaText:
            applied.kda !== null
              ? String(Math.round(applied.kda * 100) / 100)
              : (stats[puuid]?.kdaText ?? ""),
          damageText:
            applied.damage !== null
              ? String(Math.round(applied.damage))
              : (stats[puuid]?.damageText ?? ""),
        };
      }
      return {
        winnerTeam: result.winnerTeam ?? current.winnerTeam,
        stats,
      };
    });
  }

  /** Dev/QA helper: fill plausible KDA·damage + a winner for the active round. */
  function fillMockTrialData() {
    if (!proposal) {
      return;
    }
    const winnerTeam: TeamSide =
      activeRound % 2 === 1 ? "blue" : "red";
    // Spread values so grades/honeybee can differ across players.
    const mockRows = [
      { kda: "8.5", damage: "28,400" },
      { kda: "5.2", damage: "21,300" },
      { kda: "3.1", damage: "16,800" },
      { kda: "2.4", damage: "12,100" },
      { kda: "1.1", damage: "8,600" },
    ];
    updateForm((current) => {
      const stats = { ...current.stats };
      const fillSide = (members: Participant[], winning: boolean) => {
        members.forEach((member, index) => {
          const row = mockRows[index % mockRows.length];
          // Winners skew high; losers skew low (last rows / lower scale).
          const loserRow = mockRows[mockRows.length - 1 - (index % mockRows.length)];
          const pick = winning ? row : loserRow;
          stats[member.puuid] = {
            kdaText: pick.kda,
            damageText: pick.damage,
          };
        });
      };
      fillSide(proposal.blueTeam, winnerTeam === "blue");
      fillSide(proposal.redTeam, winnerTeam === "red");
      return { winnerTeam, stats };
    });
    setError(null);
  }

  function handleSave(navigateNext: boolean) {
    if (!proposal || !form.winnerTeam) {
      setError("승리 팀을 선택해 주세요.");
      return;
    }
    // Players who entered both stats become rated inputs; the rest stay
    // win/loss-only (0 → treated as missing downstream, spec F-05).
    const playerStats = [...proposal.blueTeam, ...proposal.redTeam].map(
      (member) => {
        const draft = form.stats[member.puuid] ?? {
          kdaText: "",
          damageText: "",
        };
        return {
          puuid: member.puuid,
          kda: parseKdaInput(draft.kdaText) ?? 0,
          damageDealt: parseStatNumber(draft.damageText) ?? 0,
        };
      },
    );

    const trial: TrialResult = {
      round: activeRound,
      winnerTeam: form.winnerTeam,
      blueTeam: proposal.blueTeam,
      redTeam: proposal.redTeam,
      playerStats,
    };

    try {
      saveTrialRound(sessionId, trial);
      setError(null);
      if (navigateNext) {
        router.push(
          `/session/${sessionId}/rebalance?round=${activeRound + 1}`,
        );
      }
    } catch {
      setError("결과를 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  const renderTeam = (side: TeamSide, members: Participant[]) => (
    <div className={`${styles.team} ${styles[side]}`}>
      <button
        type="button"
        className={`${styles.winnerToggle} ${
          form.winnerTeam === side ? styles.winnerActive : ""
        }`}
        onClick={() => updateForm((current) => ({ ...current, winnerTeam: side }))}
        aria-pressed={form.winnerTeam === side}
      >
        {side === "blue" ? "블루팀" : "레드팀"} 승리
      </button>
      <div className={styles.members}>
        {members.map((member) => {
          const draft = form.stats[member.puuid] ?? {
            kdaText: "",
            damageText: "",
          };
          return (
            <div key={member.puuid} className={styles.memberRow}>
              <ProfileIcon
                profileIconId={member.riotData.profileIconId}
                name={member.riotId}
                size={36}
              />
              <span className={styles.memberName}>
                <LaneIcon role={member.riotData.mainRole} size={14} />
                {member.riotId}
              </span>
              <input
                className={styles.statInput}
                value={draft.kdaText}
                onChange={(event) =>
                  setStat(member.puuid, "kdaText", event.target.value)
                }
                placeholder="KDA 3.5 또는 12/4/9"
                inputMode="text"
                aria-label={`${member.riotId} KDA`}
              />
              <input
                className={styles.statInput}
                value={draft.damageText}
                onChange={(event) =>
                  setStat(member.puuid, "damageText", event.target.value)
                }
                placeholder="딜량 20,170"
                inputMode="text"
                aria-label={`${member.riotId} 딜량`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <BootstrapProvider>
      <PageHeader
        title="시험 판 결과 입력"
        description="1~3판 결과를 입력하면 매 판 LP가 누적되고 꿀벌·성과가 갱신됩니다. 승리 팀만 선택해도 저장됩니다."
      />

      <div className={styles.layout}>
        <Tabs
          ariaLabel="시험 판 선택"
          activeId={String(activeRound)}
          onChange={(id) => setActiveRound(Number(id) as RoundNumber)}
          items={ROUND_TABS.map((round) => ({
            id: String(round),
            label: `${round}판`,
            disabled: proposalForRound(session, round) === null,
          }))}
        />

        {!isHydrated ? (
          <p className={styles.state}>결과 화면을 불러오는 중…</p>
        ) : !proposal ? (
          <Banner tone="warning">
            {activeRound}판을 입력하려면 먼저 이전 단계(팀 제안 또는 직전 판)를
            완료해야 합니다.
          </Banner>
        ) : (
          <>
            <div className={styles.assistButtons}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMatchModalOpen(true)}
              >
                경기 ID로 불러오기
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVisionModalOpen(true)}
              >
                점수판 이미지 분석
              </Button>
              <Button variant="ghost" size="sm" onClick={fillMockTrialData}>
                가상 데이터 채우기
              </Button>
            </div>

            {error ? <Banner tone="error">{error}</Banner> : null}

            <div className={styles.teams}>
              {renderTeam("blue", proposal.blueTeam)}
              {renderTeam("red", proposal.redTeam)}
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => handleSave(false)}>
                저장
              </Button>
              <Button onClick={() => handleSave(true)}>
                저장하고 다음 판 제안 →
              </Button>
            </div>

            <Panel tone="soft">
              <ReasonPanel
                title="점수 반영 방식"
                reasons={[
                  "매 판 직전 LP 70% + 이번 판 성과 30%를 합쳐 누적합니다.",
                  "꿀벌: 사전 스탯·티어 기대치를 모두 넘으면 달성, 연속 달성 시 반짝이는·무지개 꿀벌로 승급합니다.",
                  "KDA·딜량을 넣으면 성과 등급(F~OP)이 산출되고, 승패만 입력하면 팀 단위로만 반영됩니다.",
                  "이전 기록이 부족한 참가자는 이번 판 평가를 생략하고 LP만 반영합니다.",
                ]}
              />
            </Panel>

            <MatchIdModal
              open={matchModalOpen}
              onClose={() => setMatchModalOpen(false)}
              roster={roster}
              onApply={(result) => {
                applyFromModal(result);
                setMatchModalOpen(false);
              }}
            />
            <VisionModal
              open={visionModalOpen}
              onClose={() => setVisionModalOpen(false)}
              roster={roster}
              onApply={(result) => {
                applyFromModal(result);
                setVisionModalOpen(false);
              }}
            />
          </>
        )}
      </div>

      <FloatingAssistant
        sessionId={sessionId}
        initialMode={session?.commentMode ?? "normal"}
        buildPayload={() => {
          const saved = session?.rounds ?? [];
          if (saved.length === 0) {
            return null;
          }
          const latest = saved.reduce((a, b) =>
            b.trialResult.round > a.trialResult.round ? b : a,
          );
          return buildRebalanceSummaryPayload(
            latest.nextTeamProposal,
            latest.trialResult.round,
          );
        }}
      />
    </BootstrapProvider>
  );
}
