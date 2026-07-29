import { Button } from "@/components/ui/Button";
import { ReasonPanel } from "@/components/shared/ReasonPanel";
import type { PreUnrated } from "@/lib/player/analysis";
import {
  roleReason,
  tierReason,
  unratedReason,
} from "@/lib/domain/reasonCopy";
import type { Participant } from "@/lib/types";

import { BadgeRow } from "./BadgeRow";
import { ChampionIcon } from "./ChampionIcon";
import { LANE_LABEL_KO, LaneIcon } from "./LaneIcon";
import { ProfileIcon } from "./ProfileIcon";
import { TierEmblem } from "./TierEmblem";
import styles from "./PlayerCard.module.scss";

interface PlayerCardProps {
  participant: Participant;
  preUnrated: PreUnrated;
  onRemove: (puuid: string) => void;
}

export function PlayerCard({
  participant,
  preUnrated,
  onRemove,
}: PlayerCardProps) {
  const { riotData } = participant;
  const roleLabel = riotData.mainRole
    ? LANE_LABEL_KO[riotData.mainRole]
    : "라인 미확인";
  const games = riotData.recentStats?.games ?? 0;

  const reasons: string[] = [
    tierReason(
      participant.preTier,
      typeof riotData.winRate === "number"
        ? riotData.winRate * 100
        : undefined,
    ),
    roleReason(riotData.mainRole),
    games > 0 ? `최근 ${games}판 분석` : "최근 랭크 경기 기록 없음",
  ];

  return (
    <article className={styles.card}>
      <div className={styles.summary}>
        <TierEmblem
          tier={participant.preTier.tier}
          label={participant.preTier.label}
          size={64}
        />
        <ProfileIcon
          profileIconId={riotData.profileIconId}
          name={participant.riotId}
          size={56}
        />
        <div className={styles.identity}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{participant.riotId}</h3>
            <LaneIcon role={riotData.mainRole} />
          </div>
          <BadgeRow
            tier={participant.preTier}
            internalBadge={participant.internalTierBadge}
            isOp={participant.internalTierBadge === "OP"}
            tierSource={participant.tierSource}
          />
          <p className={styles.meta}>
            {roleLabel}
            {preUnrated.unrated ? (
              <span className={styles.unrated}> · 기록 부족 (평가 보류)</span>
            ) : null}
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          className={styles.remove}
          onClick={() => onRemove(participant.puuid)}
          aria-label={`${participant.riotId} 제거`}
        >
          제거
        </Button>
      </div>

      <details className={styles.accordion}>
        <summary className={styles.trigger}>상세 분석 보기</summary>
        <div className={styles.detail}>
          {riotData.masteries.length > 0 ? (
            <div className={styles.champions}>
              <span className={styles.detailLabel}>모스트 챔피언</span>
              <div className={styles.championList}>
                {riotData.masteries.map((mastery) => (
                  <ChampionIcon
                    key={mastery.championId}
                    championId={mastery.championId}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <ReasonPanel reasons={reasons} />
          {preUnrated.unrated ? (
            <ReasonPanel
              title="평가 보류 사유"
              tone="neutral"
              reasons={[unratedReason(preUnrated.reason)]}
            />
          ) : null}
        </div>
      </details>
    </article>
  );
}
