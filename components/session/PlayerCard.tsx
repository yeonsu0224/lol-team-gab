"use client";

import Image from "next/image";
import { useState } from "react";

import { lookupEasterEgg } from "@/lib/constants/easterEggs";
import { BeeIcon } from "@/components/shared/BeeIcon";
import { LaneIcon } from "@/components/shared/LaneIcon";
import { lpValueToTier } from "@/lib/domain/lp";
import { championIconUrl, profileIconUrl, type DataDragonBootstrap } from "@/lib/player/client";
import type { Participant, RoundNumber, TierAssessment } from "@/lib/types";

export function displayGameName(riotId: string) {
  return riotId.split("#")[0] || riotId;
}

export function PlayerCard({
  participant,
  bootstrap,
  round,
  changed,
  tradeLabel,
  onClick,
  onRemove,
  registrationDetails = false,
  onEvaluationChange,
}: {
  participant: Participant;
  bootstrap: DataDragonBootstrap | null;
  round?: RoundNumber;
  changed?: boolean;
  /** 재밸런스에서 들어온/나간 표시. 예: "블루로 이동" */
  tradeLabel?: string;
  onClick?: () => void;
  onRemove?: () => void;
  registrationDetails?: boolean;
  onEvaluationChange?: (
    patch: Partial<Pick<Participant, "manualScoreAdjustment" | "tierAssessment">>,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const easterEgg = lookupEasterEgg(participant.puuid, participant.riotId);
  const performance = round ? participant.trialPerformanceByRound?.[round] : undefined;
  const scoreDelta = round
    ? participant.personalScoreDeltaByRound?.[(round + 1) as 2 | 3 | 4]
    : undefined;
  const image = bootstrap ? profileIconUrl(bootstrap.version, participant.profileIconId) : undefined;
  const topMastery = participant.riotData.masteries?.[0];
  const mostChampion = topMastery && bootstrap?.championsByKey[String(topMastery.championId)];
  const tier = participant.preTier.tier.toUpperCase();
  return (
    <article
      className={`tg-player-card tg-player-card--${tier.toLowerCase()} ${changed ? "is-changed" : ""} ${open ? "is-open" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
    >
      <div className="tg-player-card__main">
        <Image
          className="tg-player-card__emblem"
          src={`/ranked-emblems/Rank=${tierAssetName(participant.preTier.tier)}.png`}
          alt={`${participant.preTier.tier} 티어 엠블럼`}
          width={44}
          height={44}
        />
        <span className="tg-player-card__avatar-wrap">
          {image
            ? <Image className="tg-player-card__avatar" src={image} alt="" width={44} height={44} unoptimized />
            : <span className="tg-player-card__avatar" />}
          {registrationDetails && mostChampion && bootstrap && (
            <Image
              className="tg-player-card__most"
              src={championIconUrl(bootstrap.version, mostChampion.image.full)}
              alt={`모스트 챔피언 ${mostChampion.name}`}
              title={`모스트 챔피언: ${mostChampion.name}`}
              width={20}
              height={20}
              unoptimized
            />
          )}
          {performance?.roundHoneyBee && (
            <span className="tg-player-card__bee" title="기대 이상" aria-label="기대 이상">
              <BeeIcon size={20} />
            </span>
          )}
        </span>
        <div className="tg-player-card__identity">
          <strong>{displayGameName(participant.riotId)}</strong>
          <span>{round ? `${participant.preTier.label} → ${lpValueToTier(participant.currentLpValue).label}` : participant.preTier.label}</span>
          <div className="tg-player-card__badges">
            <span className="tg-chip is-gold">{participant.internalTierBadge === "OP" ? "★ OP" : `${participant.internalTierBadge}티어`}</span>
            <LaneIcon role={participant.riotData.mainRole} />
            {changed && (
              <span className="tg-chip tg-trade-chip" title={tradeLabel || "팀이 교체되었습니다"}>
                <TradeIcon />
                {tradeLabel || "트레이드"}
              </span>
            )}
            {performance?.performanceGrade && (
              <span className={`tg-chip tg-grade tg-grade--${performance.performanceGrade.toLowerCase()}`}>
                성과 {performance.performanceGrade}
              </span>
            )}
            {performance?.unrated && <span className="tg-chip">기록 부족</span>}
            {scoreDelta != null && <span className={`tg-chip ${scoreDelta >= 0 ? "is-blue" : "is-red"}`}>{scoreDelta >= 0 ? "▲" : "▼"} {Math.abs(scoreDelta)}%</span>}
            {!registrationDetails && participant.tierAssessment && participant.tierAssessment !== "fair" && (
              <span className={`tg-chip is-${participant.tierAssessment === "overrated" ? "red" : "blue"}`}>
                티어 {participant.tierAssessment === "overrated" ? "과대평가됨" : "과소평가됨"}
              </span>
            )}
            {!registrationDetails && (participant.manualScoreAdjustment ?? 0) !== 0 && (
              <span className={`tg-chip is-${(participant.manualScoreAdjustment ?? 0) > 0 ? "blue" : "red"}`}>
                내부 {(participant.manualScoreAdjustment ?? 0) > 0 ? "+" : ""}{participant.manualScoreAdjustment}
              </span>
            )}
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
        {registrationDetails && onEvaluationChange && (
          <div
            className="tg-player-card__evaluation"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <select
              className="tg-select"
              aria-label="티어 평가"
              title="티어 평가"
              value={participant.tierAssessment ?? "fair"}
              onChange={(event) => {
                const assessment = event.target.value as TierAssessment;
                onEvaluationChange({
                  tierAssessment: assessment,
                  manualScoreAdjustment: assessment === "overrated" ? -5 : assessment === "underrated" ? 5 : 0,
                });
              }}
            >
              <option value="overrated">과대</option>
              <option value="fair">적정</option>
              <option value="underrated">과소</option>
            </select>
            <select
              className="tg-select"
              aria-label="내부 보정"
              title="내부 보정 (-10~+10)"
              value={participant.manualScoreAdjustment ?? 0}
              onChange={(event) => onEvaluationChange({
                manualScoreAdjustment: Number(event.target.value),
              })}
            >
              {Array.from({ length: 21 }, (_, index) => index - 10).map((value) => (
                <option value={value} key={value}>{value > 0 ? `+${value}` : value}</option>
              ))}
            </select>
          </div>
        )}
        <button
          className="tg-player-card__toggle"
          type="button"
          aria-expanded={open}
          aria-label={open ? "상세 전력 접기" : "상세 전력 펼치기"}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
        >
          {open ? "▲" : "▼"}
        </button>
        {onRemove && (
          <button
            className="tg-button"
            type="button"
            onClick={(event) => { event.stopPropagation(); onRemove(); }}
          >
            제외
          </button>
        )}
      </div>
      {open && (
        <div className="tg-player-card__detail">
          <strong>상세 전력</strong>
          <span>주 라인 표본 {participant.riotData.preMainRoleGames ?? 0}판</span>
          <span>주 라인 KDA {participant.riotData.preMainRoleKda?.toFixed(2) ?? "기록 부족"}</span>
          <span>평균 피해량 {participant.riotData.preMainRoleDamage?.toLocaleString("ko-KR") ?? "기록 부족"}</span>
        </div>
      )}
    </article>
  );
}

export function roleLabel(role: string) {
  return ({ TOP: "탑", JUNGLE: "정글", MIDDLE: "미드", BOTTOM: "원딜", UTILITY: "서포터" } as Record<string, string>)[role] ?? role;
}

function TradeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 7h11l-2.5-2.5M18 17H7l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function tierAssetName(tier: string) {
  const lower = tier.toLocaleLowerCase();
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
}
