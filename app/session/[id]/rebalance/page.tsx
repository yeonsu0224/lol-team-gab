"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
import { RebalanceBoard } from "@/components/team/RebalanceBoard";
import { Banner } from "@/components/ui/Banner";
import { Panel } from "@/components/ui/Panel";
import { BootstrapProvider } from "@/lib/ddragon/BootstrapProvider";
import { swapMembers } from "@/lib/domain/teamProposal";
import { buildRebalanceSummaryPayload } from "@/lib/domain/summaryPayload";
import { powerRatioReason, tierDiffReason } from "@/lib/domain/reasonCopy";
import { updateSession } from "@/lib/storage/sessionStore";
import { useSession } from "@/lib/storage/useSessions";
import type {
  RoundNumber,
  Session,
  TargetRound,
  TeamProposal,
  TeamSide,
} from "@/lib/types";

import styles from "./rebalance.module.scss";

type Selection = { side: TeamSide; puuid: string } | null;

function resolveTargetRound(
  session: Session | null,
  requested: number | null,
): TargetRound {
  if (requested === 2 || requested === 3 || requested === 4) {
    return requested;
  }
  const played = session?.rounds.length ?? 0;
  return Math.min(4, Math.max(2, played + 1)) as TargetRound;
}

export default function RebalancePage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const searchParams = useSearchParams();
  const requestedRound = Number(searchParams.get("round"));

  const { session, isHydrated } = useSession(sessionId);
  const [selection, setSelection] = useState<Selection>(null);

  const targetRound = resolveTargetRound(
    session,
    Number.isFinite(requestedRound) ? requestedRound : null,
  );
  const lastRound = (targetRound - 1) as RoundNumber;

  const record = useMemo(
    () =>
      session?.rounds.find((item) => item.trialResult.round === lastRound) ??
      null,
    [session, lastRound],
  );
  const proposal: TeamProposal | null = record?.nextTeamProposal ?? null;

  const changedPuuids = useMemo(() => {
    const set = new Set<string>();
    for (const change of proposal?.changes ?? []) {
      set.add(change.outPuuid);
      set.add(change.inPuuid);
    }
    return set;
  }, [proposal]);

  function handleSelect(side: TeamSide, puuid: string) {
    if (!proposal) {
      return;
    }
    if (!selection || selection.side === side) {
      setSelection({ side, puuid });
      return;
    }
    const bluePuuid = side === "blue" ? puuid : selection.puuid;
    const redPuuid = side === "red" ? puuid : selection.puuid;
    const swapped = swapMembers(proposal, bluePuuid, redPuuid);
    updateSession(sessionId, (current) => ({
      ...current,
      rounds: current.rounds.map((item) =>
        item.trialResult.round === lastRound
          ? { ...item, nextTeamProposal: { ...swapped, changes: proposal.changes } }
          : item,
      ),
    }));
    setSelection(null);
  }

  const tradeReasons = (proposal?.changes ?? []).map((change) => {
    const out = [...(proposal?.blueTeam ?? []), ...(proposal?.redTeam ?? [])].find(
      (p) => p.puuid === change.outPuuid,
    );
    const incoming = [
      ...(proposal?.blueTeam ?? []),
      ...(proposal?.redTeam ?? []),
    ].find((p) => p.puuid === change.inPuuid);
    const outName = out?.riotId.split("#")[0] ?? "선수";
    const inName = incoming?.riotId.split("#")[0] ?? "선수";
    return `${outName} ↔ ${inName} 트레이드`;
  });

  const reasons = proposal
    ? [
        tierDiffReason(proposal.tierDiffDivisions),
        powerRatioReason(proposal.bluePowerPct, proposal.redPowerPct),
        ...tradeReasons,
      ]
    : [];

  const nextHref =
    targetRound === 4
      ? `/session/${sessionId}/finish`
      : `/session/${sessionId}/trial?round=${targetRound}`;
  const nextLabel = targetRound === 4 ? "내전 종료로 →" : `${targetRound}판 결과 입력 →`;

  return (
    <BootstrapProvider>
      <PageHeader
        title={`${targetRound}판 재밸런스 제안`}
        description="직전 판 결과를 반영한 누적 LP로 다음 판 팀을 제안합니다. 선수를 눌러 교체할 수 있습니다."
        action={
          proposal ? (
            <Link className={styles.nextButton} href={nextHref}>
              {nextLabel}
            </Link>
          ) : null
        }
      />

      <div className={styles.layout}>
        {!isHydrated ? (
          <p className={styles.state}>재밸런스 제안을 불러오는 중…</p>
        ) : !proposal ? (
          <Banner tone="warning">
            {lastRound}판 결과가 아직 입력되지 않았습니다. 먼저 시험 판에서{" "}
            {lastRound}판을 저장하세요.
          </Banner>
        ) : (
          <>
            {targetRound === 4 ? (
              <Banner tone="info">
                4판은 결과 입력 없이 제안·수동 구성만 제공합니다.
              </Banner>
            ) : null}
            <RebalanceBoard
              proposal={proposal}
              lastRound={lastRound}
              changedPuuids={changedPuuids}
              selectedSide={selection?.side ?? null}
              selectedPuuid={selection?.puuid ?? null}
              onSelect={handleSelect}
            />
            <Panel tone="soft">
              <ReasonPanel title="재밸런스 근거" reasons={reasons} />
            </Panel>
          </>
        )}
      </div>

      <FloatingAssistant
        sessionId={sessionId}
        initialMode={session?.commentMode ?? "normal"}
        buildPayload={() =>
          proposal
            ? buildRebalanceSummaryPayload(proposal, lastRound)
            : null
        }
      />
    </BootstrapProvider>
  );
}
