import { lpValueToTier, tierToLpValue } from "@/lib/domain/lp";
import type { MainRole, Participant } from "@/lib/types";

export class ClientApiError extends Error {
  constructor(message: string, public readonly code = "CLIENT_API_ERROR") {
    super(message);
  }
}

export interface AccountResult {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId?: number;
  tier?: {
    tier: string;
    rank: string;
    lp: number;
    label: string;
  } | null;
}

export interface DataDragonBootstrap {
  version: string;
  championsByKey: Record<string, { id: string; key: string; name: string; image: { full: string } }>;
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)tg-locale=(ko|en)(?:;|$)/);
    if (match?.[1]) headers.set("Accept-Language", match[1]);
  }
  const response = await fetch(url, { ...init, headers });
  const body = await response.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
  if (!response.ok) throw new ClientApiError(body.error?.message ?? "Request failed", body.error?.code);
  return body as T;
}

export async function searchAccounts(query: string): Promise<AccountResult[]> {
  const payload = await requestJson<{ accounts: AccountResult[] }>(
    `/api/riot/account/search?q=${encodeURIComponent(query)}`,
  );
  return payload.accounts;
}

export async function loadBootstrap(): Promise<DataDragonBootstrap> {
  return requestJson<DataDragonBootstrap>("/api/ddragon/bootstrap");
}

export async function loadParticipant(
  account: AccountResult,
  manualTier?: { tier: string; rank: string; lp: number },
): Promise<Participant> {
  const data = await requestJson<{
    profileIconId: number;
    summonerLevel: number;
    rank: null | {
      tier: string;
      rank: string;
      lp: number;
      wins: number;
      losses: number;
      lpValue: number;
      source: "solo" | "flex";
    };
    masteries: Array<{ championId: number; championPoints: number }>;
    mainRole?: MainRole;
    preMainRoleGames?: number;
    preMainRoleKda?: number;
    preMainRoleDamage?: number;
    recentStats: Participant["riotData"]["recentStats"];
  }>(`/api/riot/player?puuid=${encodeURIComponent(account.puuid)}`);
  if (!data.rank && !manualTier) {
    throw new ClientApiError("MANUAL_TIER_REQUIRED", "MANUAL_TIER_REQUIRED");
  }
  const preLpValue = data.rank?.lpValue ?? tierToLpValue(manualTier!.tier, manualTier!.rank, manualTier!.lp);
  return {
    riotId: `${account.gameName}#${account.tagLine}`,
    puuid: account.puuid,
    profileIconId: data.profileIconId,
    summonerLevel: data.summonerLevel,
    preTier: lpValueToTier(preLpValue),
    preLpValue,
    currentLpValue: preLpValue,
    personalScore: 0,
    internalTierBadge: 5,
    manualScoreAdjustment: 0,
    tierAssessment: "fair",
    honeyBeeStreak: 0,
    honeyBeeBadge: "none",
    honeyBeeHistory: [],
    tierSource: data.rank?.source ?? "manual",
    riotData: {
      recentStats: data.recentStats,
      masteries: data.masteries,
      mainRole: data.mainRole,
      preMainRoleGames: data.preMainRoleGames,
      preMainRoleKda: data.preMainRoleKda,
      preMainRoleDamage: data.preMainRoleDamage,
    },
    synergyFactors: {
      duoPartners: [],
      mainRole: data.mainRole,
      topChampions: data.masteries.map(({ championId }) => championId),
    },
  };
}

export function profileIconUrl(version: string, profileIconId?: number) {
  return profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`
    : undefined;
}

export function championIconUrl(version: string, imageFull: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageFull}`;
}
