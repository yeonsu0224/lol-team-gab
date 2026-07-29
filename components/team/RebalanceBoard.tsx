import { LaneIcon } from "@/components/player/LaneIcon";
import { ProfileIcon } from "@/components/player/ProfileIcon";
import {
  GradeBadge,
  HoneyBeeStatusBadge,
  UnratedBadge,
} from "@/components/shared/StatusBadge";
import { PowerRatioBar } from "@/components/team/PowerRatioBar";
import { SYNERGY_LABEL_KO } from "@/lib/constants/synergy";
import { lpValueToTierDisplay } from "@/lib/constants/lpTable";
import { formatScoreDelta } from "@/lib/domain/personalScoreDelta";
import type {
  Participant,
  RoundNumber,
  TeamProposal,
  TeamSide,
} from "@/lib/types";

import styles from "./RebalanceBoard.module.scss";

interface RebalanceBoardProps {
  proposal: TeamProposal;
  lastRound: RoundNumber;
  changedPuuids: Set<string>;
  selectedSide: TeamSide | null;
  selectedPuuid: string | null;
  onSelect: (side: TeamSide, puuid: string) => void;
}

const TEAM_LABEL: Record<TeamSide, string> = {
  blue: "블루팀",
  red: "레드팀",
};

function MemberCard({
  participant,
  lastRound,
  changed,
  selected,
  swapHint,
  onSelect,
  side,
}: {
  participant: Participant;
  lastRound: RoundNumber;
  changed: boolean;
  selected: boolean;
  swapHint: boolean;
  side: TeamSide;
  onSelect: (side: TeamSide, puuid: string) => void;
}) {
  const perf = participant.trialPerformanceByRound?.[lastRound];
  const afterTier = lpValueToTierDisplay(participant.currentLpValue);
  const delta = formatScoreDelta(
    participant.personalScoreDeltaByRound?.[lastRound] ?? null,
  );

  return (
    <button
      type="button"
      className={[
        styles.member,
        changed ? styles.changed : "",
        selected ? styles.selected : "",
        swapHint ? styles.swapHint : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(side, participant.puuid)}
      aria-pressed={selected}
    >
      <ProfileIcon
        profileIconId={participant.riotData.profileIconId}
        name={participant.riotId}
        size={40}
      />
      <span className={styles.body}>
        <span className={styles.name}>
          <LaneIcon role={participant.riotData.mainRole} size={14} />
          {participant.riotId}
        </span>
        <span className={styles.tier}>
          {participant.preTier.label} → {afterTier.label}
        </span>
        <span className={styles.badges}>
          {perf?.performanceGrade ? (
            <GradeBadge grade={perf.performanceGrade} />
          ) : perf?.unrated ? (
            <UnratedBadge />
          ) : null}
          <HoneyBeeStatusBadge badge={participant.honeyBeeBadge} />
        </span>
      </span>
      {delta ? (
        <span
          className={
            delta.direction === "up"
              ? styles.deltaUp
              : delta.direction === "down"
                ? styles.deltaDown
                : styles.deltaFlat
          }
        >
          {delta.direction === "up"
            ? "▲"
            : delta.direction === "down"
              ? "▼"
              : "―"}
          {delta.percentAbs > 0 ? ` ${delta.percentAbs}%` : ""}
        </span>
      ) : null}
    </button>
  );
}

export function RebalanceBoard({
  proposal,
  lastRound,
  changedPuuids,
  selectedSide,
  selectedPuuid,
  onSelect,
}: RebalanceBoardProps) {
  const columns: Array<{ side: TeamSide; members: Participant[]; avg: string; synergy: string }> = [
    {
      side: "blue",
      members: proposal.blueTeam,
      avg: proposal.blueAvgTier.label,
      synergy: SYNERGY_LABEL_KO[proposal.blueSynergy],
    },
    {
      side: "red",
      members: proposal.redTeam,
      avg: proposal.redAvgTier.label,
      synergy: SYNERGY_LABEL_KO[proposal.redSynergy],
    },
  ];

  return (
    <div className={styles.board}>
      <PowerRatioBar
        bluePowerPct={proposal.bluePowerPct}
        redPowerPct={proposal.redPowerPct}
      />
      <div className={styles.columns}>
        {columns.map((column) => {
          const swapHint =
            selectedSide !== null && selectedSide !== column.side;
          return (
            <section
              key={column.side}
              className={`${styles.column} ${styles[column.side]}`}
            >
              <header className={styles.header}>
                <h2 className={styles.title}>{TEAM_LABEL[column.side]}</h2>
                <span className={styles.meta}>
                  평균 {column.avg} · 시너지 {column.synergy}
                </span>
              </header>
              <div className={styles.members}>
                {column.members.map((participant) => (
                  <MemberCard
                    key={participant.puuid}
                    participant={participant}
                    side={column.side}
                    lastRound={lastRound}
                    changed={changedPuuids.has(participant.puuid)}
                    selected={selectedPuuid === participant.puuid}
                    swapHint={swapHint}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
