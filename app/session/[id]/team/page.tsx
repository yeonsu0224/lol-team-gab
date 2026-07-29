"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { PageHeader } from "@/components/layout/PageHeader";
import { ParticipantRegistration } from "@/components/player/ParticipantRegistration";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
import { PowerRatioBar } from "@/components/team/PowerRatioBar";
import { TeamColumn } from "@/components/team/TeamColumn";
import { Banner } from "@/components/ui/Banner";
import { Panel } from "@/components/ui/Panel";
import { BootstrapProvider } from "@/lib/ddragon/BootstrapProvider";
import { isSupportedTeamCount } from "@/lib/domain/teamBalance";
import { buildTeamSummaryPayload } from "@/lib/domain/summaryPayload";
import {
  buildPreTeamProposal,
  swapMembers,
} from "@/lib/domain/teamProposal";
import { analyzeSession } from "@/lib/player/analysis";
import { powerRatioReason, tierDiffReason } from "@/lib/domain/reasonCopy";
import { SYNERGY_LABEL_KO } from "@/lib/constants/synergy";
import { updateSession } from "@/lib/storage/sessionStore";
import { useSession } from "@/lib/storage/useSessions";
import type { Participant, TeamProposal, TeamSide } from "@/lib/types";

import styles from "./team.module.scss";

type Selection = { side: TeamSide; puuid: string } | null;

function memberPuuids(proposal: TeamProposal): string[] {
  return [...proposal.blueTeam, ...proposal.redTeam]
    .map((participant) => participant.puuid)
    .sort();
}

function sameRoster(proposal: TeamProposal, participants: Participant[]): boolean {
  const a = memberPuuids(proposal).join("|");
  const b = participants
    .map((participant) => participant.puuid)
    .sort()
    .join("|");
  return a === b;
}

export default function TeamPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const { session, isHydrated } = useSession(sessionId);
  const participants = useMemo(() => session?.participants ?? [], [session]);
  const [selection, setSelection] = useState<Selection>(null);

  const count = participants.length;
  const rosterValid = isSupportedTeamCount(count);
  const stored = session?.preTeamProposal ?? null;
  const storedMatches =
    stored !== null && stored.type === "pre" && sameRoster(stored, participants);

  const proposal = useMemo<TeamProposal | null>(() => {
    if (!rosterValid) {
      return null;
    }
    if (storedMatches && stored) {
      return stored;
    }
    return buildPreTeamProposal(participants);
  }, [rosterValid, storedMatches, stored, participants]);

  const rosterSignature = participants
    .map((participant) => participant.puuid)
    .sort()
    .join("|");

  // Persist a freshly balanced proposal whenever the roster changes (external
  // store write, not React state — safe in an effect). Terminates once stored.
  useEffect(() => {
    if (!isHydrated || !rosterValid || storedMatches) {
      return;
    }
    updateSession(sessionId, {
      preTeamProposal: buildPreTeamProposal(participants),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterSignature, rosterValid, storedMatches, isHydrated, sessionId]);

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
    updateSession(sessionId, {
      preTeamProposal: swapMembers(proposal, bluePuuid, redPuuid),
    });
    setSelection(null);
  }

  function handleRemove(puuid: string) {
    const next = participants.filter(
      (participant) => participant.puuid !== puuid,
    );
    updateSession(sessionId, {
      participants: analyzeSession(next),
      preTeamProposal: undefined,
    });
    setSelection(null);
  }

  const reasons = proposal
    ? [
        tierDiffReason(proposal.tierDiffDivisions),
        powerRatioReason(proposal.bluePowerPct, proposal.redPowerPct),
        `블루 시너지 ${SYNERGY_LABEL_KO[proposal.blueSynergy]} · 레드 시너지 ${SYNERGY_LABEL_KO[proposal.redSynergy]}`,
      ]
    : [];

  return (
    <BootstrapProvider>
      <PageHeader
        title="1판 팀 제안"
        description="사전 전력 기준 추천 구성입니다. 선수를 눌러 반대 팀 선수와 교체할 수 있습니다."
        action={
          proposal ? (
            <Link className={styles.nextButton} href={`/session/${sessionId}/trial`}>
              이 구성으로 시험 판 →
            </Link>
          ) : null
        }
      />

      <div className={styles.layout}>
        {!isHydrated ? (
          <p className={styles.state}>팀 제안을 불러오는 중…</p>
        ) : !rosterValid ? (
          <Banner tone="warning">
            팀 제안은 8명 또는 10명일 때만 가능합니다. 현재 {count}명입니다. 아래에서
            인원을 조정하세요.
          </Banner>
        ) : proposal ? (
          <>
            <PowerRatioBar
              bluePowerPct={proposal.bluePowerPct}
              redPowerPct={proposal.redPowerPct}
            />
            <div className={styles.teams}>
              <TeamColumn
                side="blue"
                members={proposal.blueTeam}
                avgTier={proposal.blueAvgTier}
                synergy={proposal.blueSynergy}
                selectedPuuid={selection?.side === "blue" ? selection.puuid : null}
                selectedSide={selection?.side ?? null}
                onSelect={handleSelect}
                onRemove={handleRemove}
              />
              <TeamColumn
                side="red"
                members={proposal.redTeam}
                avgTier={proposal.redAvgTier}
                synergy={proposal.redSynergy}
                selectedPuuid={selection?.side === "red" ? selection.puuid : null}
                selectedSide={selection?.side ?? null}
                onSelect={handleSelect}
                onRemove={handleRemove}
              />
            </div>
            <Panel tone="soft">
              <ReasonPanel title="팀 밸런스 근거" reasons={reasons} />
            </Panel>
          </>
        ) : null}

        <Panel>
          <h2 className={styles.editTitle}>선수 추가·교체</h2>
          <p className={styles.editHint}>
            이 화면에서 바로 참가자를 추가하거나 카드의 ✕로 제거할 수 있습니다. 등록
            화면으로 돌아가지 않아도 됩니다.
          </p>
          <ParticipantRegistration
            sessionId={sessionId}
            participants={participants}
          />
        </Panel>
      </div>

      <FloatingAssistant
        sessionId={sessionId}
        initialMode={session?.commentMode ?? "normal"}
        buildPayload={() =>
          proposal ? buildTeamSummaryPayload(proposal) : null
        }
      />
    </BootstrapProvider>
  );
}
