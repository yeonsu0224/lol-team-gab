"use client";

import Image from "next/image";

import { lookupEasterEgg } from "@/lib/constants/easterEggs";
import { LaneIcon } from "@/components/shared/LaneIcon";
import { lpValueToTier } from "@/lib/domain/lp";
import { profileIconUrl, type DataDragonBootstrap } from "@/lib/player/client";
import type { Participant, RoundNumber } from "@/lib/types";

export function PlayerCard({
  participant,
  bootstrap,
  round,
  changed,
  onClick,
  onRemove,
}: {
  participant: Participant;
  bootstrap: DataDragonBootstrap | null;
  round?: RoundNumber;
  changed?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const easterEgg = lookupEasterEgg(participant.puuid, participant.riotId);
  const performance = round ? participant.trialPerformanceByRound?.[round] : undefined;
  const scoreDelta = round
    ? participant.personalScoreDeltaByRound?.[(round + 1) as 2 | 3 | 4]
    : undefined;
  const image = bootstrap ? profileIconUrl(bootstrap.version, participant.profileIconId) : undefined;
  return (
    <article
      className={`tg-player-card ${changed ? "is-changed" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
    >
      {image ? <Image className="tg-player-card__avatar" src={image} alt="" width={44} height={44} unoptimized /> : <span className="tg-player-card__avatar" />}
      <Image
        className="tg-player-card__emblem"
        src={`/ranked-emblems/Rank=${tierAssetName(participant.preTier.tier)}.png`}
        alt={`${participant.preTier.tier} 티어 엠블럼`}
        width={44}
        height={44}
      />
      <div className="tg-player-card__identity">
        <strong>{participant.riotId}</strong>
        <span>{round ? `${participant.preTier.label} → ${lpValueToTier(participant.currentLpValue).label}` : participant.preTier.label}</span>
        <div className="tg-player-card__badges">
          <span className="tg-chip is-gold">{participant.internalTierBadge === "OP" ? "★ OP" : `${participant.internalTierBadge}티어`}</span>
          <LaneIcon role={participant.riotData.mainRole} />
          {performance?.performanceGrade && <span className="tg-chip">성과 {performance.performanceGrade}</span>}
          {performance?.roundHoneyBee && <span className="tg-chip is-gold">🐝 기대 이상</span>}
          {performance?.unrated && <span className="tg-chip">기록 부족</span>}
          {scoreDelta != null && <span className={`tg-chip ${scoreDelta >= 0 ? "is-blue" : "is-red"}`}>{scoreDelta >= 0 ? "▲" : "▼"} {Math.abs(scoreDelta)}%</span>}
          {easterEgg && (
            <span
              className={`tg-easter-egg tg-easter-egg--${easterEgg.effect ?? "none"}`}
              title={easterEgg.note}
            >
              {easterEgg.emoji} {easterEgg.label}
            </span>
          )}
        </div>
      </div>
      <div className="tg-player-card__hover">
        <strong>상세 전력</strong>
        <span>주 라인 표본 {participant.riotData.preMainRoleGames ?? 0}판</span>
        <span>주 라인 KDA {participant.riotData.preMainRoleKda?.toFixed(2) ?? "기록 부족"}</span>
        <span>평균 피해량 {participant.riotData.preMainRoleDamage?.toLocaleString("ko-KR") ?? "기록 부족"}</span>
      </div>
      {onRemove && (
        <button
          className="tg-button"
          type="button"
          onClick={(event) => { event.stopPropagation(); onRemove(); }}
        >
          제외
        </button>
      )}
    </article>
  );
}

export function roleLabel(role: string) {
  return ({ TOP: "탑", JUNGLE: "정글", MIDDLE: "미드", BOTTOM: "원딜", UTILITY: "서포터" } as Record<string, string>)[role] ?? role;
}

function tierAssetName(tier: string) {
  const lower = tier.toLocaleLowerCase();
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
}
