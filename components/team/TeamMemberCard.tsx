import { LaneIcon } from "@/components/player/LaneIcon";
import { ProfileIcon } from "@/components/player/ProfileIcon";
import {
  getInternalTierVariant,
  getLolTierVariant,
} from "@/lib/ui/badgeClassNames";
import type { Participant, TeamSide } from "@/lib/types";

import styles from "./TeamMemberCard.module.scss";

interface TeamMemberCardProps {
  participant: Participant;
  side: TeamSide;
  selected: boolean;
  swapHint: boolean;
  onSelect: (side: TeamSide, puuid: string) => void;
  onRemove: (puuid: string) => void;
}

export function TeamMemberCard({
  participant,
  side,
  selected,
  swapHint,
  onSelect,
  onRemove,
}: TeamMemberCardProps) {
  const isOp = participant.internalTierBadge === "OP";
  const classes = [
    styles.card,
    selected ? styles.selected : "",
    swapHint ? styles.swapHint : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <button
        type="button"
        className={styles.main}
        onClick={() => onSelect(side, participant.puuid)}
        aria-pressed={selected}
        title={swapHint ? "클릭하면 선택한 상대와 교체" : "교체할 선수 선택"}
      >
        <ProfileIcon
          profileIconId={participant.riotData.profileIconId}
          name={participant.riotId}
          size={40}
        />
        <span className={styles.identity}>
          <span className={styles.name}>{participant.riotId}</span>
          <span className={styles.meta}>
            <LaneIcon role={participant.riotData.mainRole} size={16} />
            {participant.preTier.label}
          </span>
        </span>
        <span
          className={`${styles.badge} ${
            isOp
              ? styles.opBadge
              : styles[getInternalTierVariant(participant.internalTierBadge)]
          }`}
        >
          {isOp ? "OP" : `${participant.internalTierBadge}티어`}
        </span>
        <span className={`${styles.tierDot} ${styles[getLolTierVariant(participant.preTier.tier)]}`} />
      </button>
      <button
        type="button"
        className={styles.remove}
        onClick={() => onRemove(participant.puuid)}
        aria-label={`${participant.riotId} 제거`}
      >
        ✕
      </button>
    </div>
  );
}
