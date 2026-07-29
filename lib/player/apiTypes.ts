import type { ChampionMasterySummary } from "@/lib/types";

export interface PlayerRankResponse {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  winRate: number | null;
  source: "solo" | "flex";
}

export interface PlayerProfileResponse {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  rank: PlayerRankResponse | null;
  masteries: ChampionMasterySummary[];
}

export interface RecentMatchesResponse {
  totalGames: number;
  wins: number;
  mainRole:
    | "TOP"
    | "JUNGLE"
    | "MIDDLE"
    | "BOTTOM"
    | "UTILITY"
    | null;
  preMainRoleGames: number | null;
  preMainRoleKda: number | null;
  preMainRoleDamage: number | null;
}
