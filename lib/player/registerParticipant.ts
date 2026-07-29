import { toTierDisplay, tierToLpValue } from "@/lib/constants/lpTable";
import { adjustedWinRate } from "@/lib/domain/winRate";
import type { RiotAccount } from "@/lib/riot/types";
import type {
  MainRole,
  Participant,
  TierSource,
} from "@/lib/types";

import type {
  PlayerProfileResponse,
  RecentMatchesResponse,
} from "./apiTypes";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "요청에 실패했습니다.");
  }
  return payload as T;
}

export interface ParticipantDraft {
  account: RiotAccount;
  profile: PlayerProfileResponse;
  matches: RecentMatchesResponse;
}

/** Fetches profile + recent matches for an account (F-03 pipeline). */
export async function fetchParticipantDraft(
  account: RiotAccount,
): Promise<ParticipantDraft> {
  const encodedPuuid = encodeURIComponent(account.puuid);
  const [profile, matches] = await Promise.all([
    fetchJson<PlayerProfileResponse>(`/api/riot/player?puuid=${encodedPuuid}`),
    fetchJson<RecentMatchesResponse>(`/api/riot/matches?puuid=${encodedPuuid}`),
  ]);
  return { account, profile, matches };
}

export interface ManualTierInput {
  tier: string;
  rank: string;
}

function buildRiotData(
  draft: ParticipantDraft,
  tier: string,
  lp: number,
  winRate: number | null,
) {
  const { profile, matches } = draft;
  const mainRole: MainRole | undefined = matches.mainRole ?? undefined;
  return {
    tier,
    lp,
    winRate: winRate ?? undefined,
    profileIconId: profile.profileIconId,
    recentStats: {
      games: matches.totalGames,
      wins: matches.wins,
      losses: matches.totalGames - matches.wins,
    },
    masteries: profile.masteries,
    mainRole,
    preMainRoleKda: matches.preMainRoleKda ?? undefined,
    preMainRoleDamage: matches.preMainRoleDamage ?? undefined,
    preMainRoleGames: matches.preMainRoleGames ?? undefined,
  };
}

/**
 * Whether a draft needs a manual tier (unranked with no ranked entry).
 * Recent-season lookup is out of MVP API scope → prompt manual (spec D-03).
 */
export function draftNeedsManualTier(draft: ParticipantDraft): boolean {
  return draft.profile.rank === null;
}

function assembleParticipant(
  draft: ParticipantDraft,
  params: {
    tier: string;
    rank: string;
    lp: number;
    tierSource: TierSource;
    winRate: number | null;
  },
): Participant {
  const preTier = toTierDisplay(params.tier, params.rank, params.lp);
  const preLpValue = tierToLpValue(params.tier, params.rank, params.lp);
  const riotData = buildRiotData(
    draft,
    params.tier,
    params.lp,
    params.winRate,
  );

  return {
    riotId: `${draft.account.gameName}#${draft.account.tagLine}`,
    puuid: draft.account.puuid,
    preTier,
    preLpValue,
    currentLpValue: preLpValue,
    personalScore: 0,
    internalTierBadge: 4,
    honeyBeeStreak: 0,
    honeyBeeBadge: "none",
    honeyBeeHistory: [],
    tierSource: params.tierSource,
    riotData,
    synergyFactors: {
      duoPartners: [],
      mainRole: draft.matches.mainRole ?? undefined,
      topChampions: draft.profile.masteries.map(
        (mastery) => mastery.championId,
      ),
    },
  };
}

/** Builds a participant from ranked data (spec D-03 solo-first). */
export function participantFromRank(draft: ParticipantDraft): Participant {
  const rank = draft.profile.rank;
  if (!rank) {
    throw new Error("랭크 정보가 없어 수동 티어 입력이 필요합니다.");
  }
  return assembleParticipant(draft, {
    tier: rank.tier,
    rank: rank.rank,
    lp: rank.lp,
    tierSource: rank.source,
    winRate: adjustedWinRate(rank.wins, rank.wins + rank.losses),
  });
}

/** Builds a participant from a manually entered tier (spec D-03 fallback). */
export function participantFromManualTier(
  draft: ParticipantDraft,
  manual: ManualTierInput,
): Participant {
  const { matches } = draft;
  const winRate =
    matches.totalGames > 0
      ? adjustedWinRate(matches.wins, matches.totalGames)
      : null;
  return assembleParticipant(draft, {
    tier: manual.tier,
    rank: manual.rank,
    lp: 0,
    tierSource: "manual",
    winRate,
  });
}
