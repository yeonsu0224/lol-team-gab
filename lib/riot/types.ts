import type { MainRole } from "@/lib/types";

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

// Summoner-V4 no longer returns the encrypted summoner/account IDs, so all
// downstream lookups must key off the PUUID.
export interface RiotSummoner {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  queueType: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface RiotMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface RiotMatchParticipant {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  teamPosition?: MainRole | "";
  win: boolean;
  teamId: number;
}

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    queueId: number;
    participants: RiotMatchParticipant[];
  };
}
