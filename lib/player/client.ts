import type { Participant, TierSource } from "@/lib/types";
import type { RankedTier } from "@/lib/constants/lpTable";
import { tierToLpValue } from "@/lib/domain/lp";

export interface AccountResult {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface PlayerResult {
  puuid: string;
  profileIconId: number;
  rank: {
    source: "solo" | "flex" | "unranked";
    tier: string | null;
    rank: string | null;
    lp: number | null;
    wins: number | null;
    losses: number | null;
  };
  masteries: Array<{
    championId: number;
    championLevel: number;
    championPoints: number;
  }>;
}

export interface MatchSummary {
  matchId: string;
  gameCreation: number;
  queueId: number;
  win: boolean;
  role: Participant["riotData"]["mainRole"] | null;
  kda: number;
  damageDealt: number;
}

export interface MatchHistoryResult {
  matches: MatchSummary[];
  hasHistory: boolean;
  mainRole: Participant["riotData"]["mainRole"] | null;
  preMainRoleGames: number;
  preMainRoleKda: number | null;
  preMainRoleDamage: number | null;
}

export interface DataDragonBootstrap {
  version: string;
  championsByKey: Record<
    string,
    { id: string; key: string; name: string; title: string; image: { full: string } }
  >;
}

export class ClientApiError extends Error {
  constructor(
    message: string,
    public readonly code = "REQUEST_FAILED",
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function searchAccounts(query: string, signal?: AbortSignal): Promise<AccountResult[]> {
  return requestJson<AccountResult[]>(
    `/api/riot/account/search?q=${encodeURIComponent(query)}`,
    { signal },
  );
}

export async function loadParticipant(
  riotId: string,
  onProgress?: (message: string) => void,
  manualTier?: { tier: RankedTier; rank: string; lp: number },
): Promise<Participant> {
  onProgress?.("계정을 확인하고 있습니다.");
  const account = await requestJson<AccountResult>(
    `/api/riot/account?riotId=${encodeURIComponent(riotId)}`,
  );
  onProgress?.("랭크와 챔피언 정보를 분석하고 있습니다.");
  const player = await requestJson<PlayerResult>(
    `/api/riot/player?puuid=${encodeURIComponent(account.puuid)}`,
  );
  onProgress?.("최근 경기와 주 라인을 분석하고 있습니다.");
  const history = await requestJson<MatchHistoryResult>(
    `/api/riot/matches?puuid=${encodeURIComponent(account.puuid)}`,
  );
  const rank = player.rank.source === "unranked" ? manualTier : player.rank;
  if (!rank?.tier || !rank.rank || rank.lp == null) {
    throw new ClientApiError(
      "현재 랭크 기록이 없습니다. 수동 티어를 선택한 뒤 다시 추가해 주세요.",
      "MANUAL_TIER_REQUIRED",
    );
  }
  const tier = rank.tier.toUpperCase() as RankedTier;
  const lpValue = tierToLpValue(tier, rank.rank, rank.lp);
  const games = (player.rank.wins ?? 0) + (player.rank.losses ?? 0);
  const source: TierSource =
    player.rank.source === "unranked" ? "manual" : player.rank.source;
  return {
    riotId: `${account.gameName}#${account.tagLine}`,
    puuid: account.puuid,
    preTier: {
      tier,
      rank: rank.rank,
      lp: rank.lp,
      label: tierLabel(tier, rank.rank, rank.lp),
    },
    preLpValue: lpValue,
    currentLpValue: lpValue,
    personalScore: 0,
    internalTierBadge: 4,
    honeyBeeStreak: 0,
    honeyBeeBadge: "none",
    honeyBeeHistory: [],
    tierSource: source,
    riotData: {
      tier,
      rank: rank.rank,
      lp: rank.lp,
      winRate: games ? (player.rank.wins ?? 0) / games : undefined,
      profileIconId: player.profileIconId,
      recentStats: {
        games,
        wins: player.rank.wins ?? 0,
        kda: history.preMainRoleKda ?? undefined,
        damageDealt: history.preMainRoleDamage ?? undefined,
      },
      masteries: player.masteries,
      mainRole: history.mainRole ?? undefined,
      preMainRoleKda: history.preMainRoleKda ?? undefined,
      preMainRoleDamage: history.preMainRoleDamage ?? undefined,
      preMainRoleGames: history.preMainRoleGames,
    },
    synergyFactors: {
      duoPartners: [],
      mainRole: history.mainRole ?? undefined,
      topChampions: player.masteries.map(({ championId }) => championId),
    },
  };
}

export async function loadBootstrap(): Promise<DataDragonBootstrap> {
  return requestJson<DataDragonBootstrap>("/api/ddragon/bootstrap");
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ClientApiError("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  const body = (await response.json().catch(() => null)) as
    | T
    | { error?: { code?: string; message?: string } }
    | null;
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body ? body.error : undefined;
    throw new ClientApiError(
      error?.message || "요청을 처리하지 못했습니다.",
      error?.code,
    );
  }
  return body as T;
}

function tierLabel(tier: string, rank: string, lp: number): string {
  const labels: Record<string, string> = {
    IRON: "아이언",
    BRONZE: "브론즈",
    SILVER: "실버",
    GOLD: "골드",
    PLATINUM: "플래티넘",
    EMERALD: "에메랄드",
    DIAMOND: "다이아몬드",
    MASTER: "마스터",
    GRANDMASTER: "그랜드마스터",
    CHALLENGER: "챌린저",
  };
  const rankLabel = ({ I: 1, II: 2, III: 3, IV: 4 } as Record<string, number>)[rank];
  return `${labels[tier] ?? tier}${rankLabel ? ` ${rankLabel}` : ""} · ${lp}LP`;
}
