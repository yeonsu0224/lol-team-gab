import type { MainRole } from "@/lib/types";
import type { RiotMatch } from "@/lib/riot/types";

export interface DemoAccountFixture {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  tier: {
    tier: string;
    rank: string;
    lp: number;
    label: string;
  } | null;
}

export interface DemoPlayerFixture {
  puuid: string;
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
  preMainRoleKda?: number | null;
  preMainRoleDamage?: number | null;
  recentStats: {
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
  };
}

export interface DemoFixturesFile {
  generatedAt: string;
  accounts: DemoAccountFixture[];
  players: Record<string, DemoPlayerFixture>;
  matchIdsByPuuid: Record<string, string[]>;
  matches: Record<string, RiotMatch>;
}
