"use client";

import Image from "next/image";
import { useState } from "react";

import { lookupEasterEgg } from "@/lib/constants/easterEggs";
import { BeeIcon } from "@/components/shared/BeeIcon";
import { LaneIcon } from "@/components/shared/LaneIcon";
import { DemoDataBadge } from "@/components/demo/DemoDataBadge";
import { isDemoPuuidClient } from "@/lib/demo/useDemoStatus";
import { useTierLabel } from "@/lib/i18n/useTierLabel";
import { championIconUrl, profileIconUrl, type DataDragonBootstrap } from "@/lib/player/client";
import { useT } from "@/lib/i18n/context";
import type { Participant, RoundNumber, TierAssessment } from "@/lib/types";

export function displayGameName(riotId: string) {
  return riotId.split("#")[0] || riotId;
}

export function PlayerCard({
  participant,
  bootstrap,
  round,
  changed,
  selected,
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
  /** 팀원 트레이드 1차 선택 상태 */
  selected?: boolean;
  /** 재밸런스에서 들어온/나간 표시. 예: "블루로 이동" */
  tradeLabel?: string;
  onClick?: () => void;
  onRemove?: () => void;
  registrationDetails?: boolean;
  onEvaluationChange?: (
    patch: Partial<Pick<Participant, "manualScoreAdjustment" | "tierAssessment">>,
  ) => void;
}) {
  const t = useT();
  const { formatTier, fromLp } = useTierLabel();
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
  const preLabel = formatTier(participant.preTier);
  const currentLabel = formatTier(fromLp(participant.currentLpValue));
  const showAssessmentChip = !registrationDetails
    && participant.tierAssessment
    && participant.tierAssessment !== "fair";
  const adjustment = participant.manualScoreAdjustment ?? 0;
  const showAdjustmentChip = !registrationDetails && adjustment !== 0;
  return (
    <article
      className={`tg-player-card tg-player-card--${tier.toLowerCase()} ${changed ? "is-changed" : ""} ${selected ? "is-selected" : ""} ${open ? "is-open" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? Boolean(selected) : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
    >
      <div className="tg-player-card__main">
        <Image
          className="tg-player-card__emblem"
          src={`/ranked-emblems/Rank=${tierAssetName(participant.preTier.tier)}.png`}
          alt={t("card.emblemAlt", { tier: participant.preTier.tier })}
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
              alt={t("card.mostAlt", { name: mostChampion.name })}
              title={t("card.mostAlt", { name: mostChampion.name })}
              width={20}
              height={20}
              unoptimized
            />
          )}
          {performance?.roundHoneyBee && (
            <span className="tg-player-card__bee" title={t("card.aboveExpect")} aria-label={t("card.aboveExpect")}>
              <BeeIcon size={20} />
            </span>
          )}
        </span>
        <div className="tg-player-card__identity">
          <strong>{displayGameName(participant.riotId)}</strong>
          <span>{round ? `${preLabel} → ${currentLabel}` : preLabel}</span>
          <div className="tg-player-card__badges">
            {isDemoPuuidClient(participant.puuid) && <DemoDataBadge />}
            <span className="tg-chip is-gold">{participant.internalTierBadge === "OP" ? "★ OP" : t("card.tierBadge", { n: participant.internalTierBadge })}</span>
            <LaneIcon role={participant.riotData.mainRole} />
            {changed && (
              <span className="tg-chip tg-trade-chip" title={tradeLabel || t("card.tradedTitle")}>
                <TradeIcon />
                {tradeLabel || t("card.trade")}
              </span>
            )}
            {performance?.performanceGrade && (
              <span className={`tg-chip tg-grade tg-grade--${performance.performanceGrade.toLowerCase()}`}>
                {t("card.perf")} {performance.performanceGrade}
              </span>
            )}
            {performance?.unrated && <span className="tg-chip">{t("card.noRecord")}</span>}
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
        {registrationDetails && onEvaluationChange && (
          <div
            className="tg-player-card__evaluation"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <select
              className="tg-select"
              aria-label={t("card.tierEval")}
              title={t("card.tierEval")}
              value={participant.tierAssessment ?? "fair"}
              onChange={(event) => {
                const assessment = event.target.value as TierAssessment;
                onEvaluationChange({
                  tierAssessment: assessment,
                  manualScoreAdjustment: assessment === "overrated" ? -5 : assessment === "underrated" ? 5 : 0,
                });
              }}
            >
              <option value="overrated">{t("card.over")}</option>
              <option value="fair">{t("card.fair")}</option>
              <option value="underrated">{t("card.under")}</option>
            </select>
            <select
              className="tg-select"
              aria-label={t("card.adjust")}
              title={t("card.adjustTitle")}
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
          aria-label={open ? t("card.collapse") : t("card.expand")}
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
            {t("card.remove")}
          </button>
        )}
      </div>
      {open && (
        <div className="tg-player-card__detail">
          <strong>{t("card.detail")}</strong>
          <span>{t("card.sample", { games: participant.riotData.preMainRoleGames ?? 0 })}</span>
          <span>{t("card.kda", { value: participant.riotData.preMainRoleKda?.toFixed(2) ?? t("card.noRecord") })}</span>
          <span>{t("card.damage", { value: participant.riotData.preMainRoleDamage?.toLocaleString("ko-KR") ?? t("card.noRecord") })}</span>
          {(showAssessmentChip || showAdjustmentChip) && (
            <div className="tg-player-card__detail-badges">
              {showAssessmentChip && (
                <span className={`tg-chip is-${participant.tierAssessment === "overrated" ? "red" : "blue"}`}>
                  {t("card.tier")} {participant.tierAssessment === "overrated" ? t("card.overrated") : t("card.underrated")}
                </span>
              )}
              {showAdjustmentChip && (
                <span className={`tg-chip is-${adjustment > 0 ? "blue" : "red"}`}>
                  {t("card.internal")} {adjustment > 0 ? "+" : ""}{adjustment}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function roleLabel(role: string) {
  const map: Record<string, string> = {
    TOP: "탑",
    JUNGLE: "정글",
    MIDDLE: "미드",
    BOTTOM: "원딜",
    UTILITY: "서포터",
  };
  return map[role] ?? role;
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
