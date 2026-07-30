export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface RiotMastery {
  championId: number;
  championPoints: number;
}

export interface RiotMatch {
  metadata: { matchId: string; participants: string[] };
  info: {
    gameCreation: number;
    gameDuration: number;
    participants: Array<{
      puuid: string;
      riotIdGameName?: string;
      riotIdTagline?: string;
      teamId: number;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      totalDamageDealtToChampions: number;
      teamPosition?: string;
      championId: number;
    }>;
  };
}
