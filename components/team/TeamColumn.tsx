import { SYNERGY_LABEL_KO } from "@/lib/constants/synergy";
import type { Participant, SynergyGrade, TeamSide, TierDisplay } from "@/lib/types";

import { TeamMemberCard } from "./TeamMemberCard";
import styles from "./TeamColumn.module.scss";

interface TeamColumnProps {
  side: TeamSide;
  members: Participant[];
  avgTier: TierDisplay;
  synergy: SynergyGrade;
  selectedPuuid: string | null;
  selectedSide: TeamSide | null;
  onSelect: (side: TeamSide, puuid: string) => void;
  onRemove: (puuid: string) => void;
}

const TEAM_LABEL: Record<TeamSide, string> = {
  blue: "블루팀",
  red: "레드팀",
};

export function TeamColumn({
  side,
  members,
  avgTier,
  synergy,
  selectedPuuid,
  selectedSide,
  onSelect,
  onRemove,
}: TeamColumnProps) {
  const swapHint = selectedSide !== null && selectedSide !== side;

  return (
    <section className={`${styles.column} ${styles[side]}`}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{TEAM_LABEL[side]}</h2>
          <span className={styles.synergy}>시너지 {SYNERGY_LABEL_KO[synergy]}</span>
        </div>
        <p className={styles.avg}>평균 {avgTier.label}</p>
      </header>
      <div className={styles.members}>
        {members.map((participant) => (
          <TeamMemberCard
            key={participant.puuid}
            participant={participant}
            side={side}
            selected={selectedPuuid === participant.puuid}
            swapHint={swapHint}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
