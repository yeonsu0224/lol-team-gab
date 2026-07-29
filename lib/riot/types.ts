import type { MainRole } from "@/lib/types";

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  puuid: string;
  profileIconId: number;
  revisionDate: number;
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

export interface RiotChampionMastery {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface RiotMatchParticipant {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  profileIcon: number;
  teamId: 100 | 200;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  championId: number;
  championName: string;
  teamPosition: MainRole | "";
  individualPosition: MainRole | "";
}

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: RiotMatchParticipant[];
  };
}

export interface MatchParticipantSummary {
  puuid: string;
  riotId: string | null;
  team: "blue" | "red";
  win: boolean;
  championId: number;
  championName: string;
  role: MainRole | null;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  damageDealt: number;
  cs: number;
  visionScore: number;
}
