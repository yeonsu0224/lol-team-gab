export type TeamSide = "blue" | "red";
export type MainRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
export type RoundNumber = 1 | 2 | 3;
export type InternalTier = "OP" | 1 | 2 | 3 | 4 | 5;
export type PerformanceGrade = "F" | "D" | "C" | "B" | "A" | "OP";
export type CommentMode = "normal" | "friend";
export type TierAssessment = "overrated" | "fair" | "underrated";

export interface TierDisplay {
  tier: string;
  rank: string;
  lp: number;
  label: string;
}

export interface RecentStats {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
}

export interface Participant {
  riotId: string;
  puuid: string;
  profileIconId?: number;
  summonerLevel?: number;
  preTier: TierDisplay;
  preLpValue: number;
  currentLpValue: number;
  personalScore: number;
  internalTierBadge: InternalTier;
  /** 총무의 정성 평가 보정값. 자동 점수에 -10~+10%p로 더한다. */
  manualScoreAdjustment?: number;
  /** 표시·설명용 티어 평가. 점수 영향은 manualScoreAdjustment로만 준다. */
  tierAssessment?: TierAssessment;
  honeyBeeStreak: number;
  honeyBeeBadge: "none" | "bee" | "glitterBee" | "rainbowBee";
  honeyBeeHistory: boolean[];
  trialPerformanceByRound?: Partial<Record<RoundNumber, TrialPerformance>>;
  personalScoreDeltaByRound?: Partial<Record<2 | 3 | 4, number>>;
  tierSource: "solo" | "flex" | "past_season" | "manual";
  riotData: {
    recentStats?: RecentStats;
    masteries?: Array<{ championId: number; championPoints: number }>;
    mainRole?: MainRole;
    preMainRoleKda?: number;
    preMainRoleDamage?: number;
    preMainRoleGames?: number;
  };
  synergyFactors: {
    duoPartners: string[];
    mainRole?: MainRole;
    topChampions: number[];
  };
}

export interface TrialPerformance {
  kda: number;
  damageDealt: number;
  preStatScore: number | null;
  tierExpectScore: number | null;
  trialScore: number;
  unrated: boolean;
  unratedReason?: "no_history" | "insufficient_sample" | "missing_stats" | "manual_tier";
  roundHoneyBee: boolean;
  roundBelowExpect: boolean;
  performanceGrade: PerformanceGrade | null;
}

export interface TeamChange {
  outPuuid: string;
  inPuuid: string;
  toTeam: TeamSide;
  reason: string;
}

export interface TeamProposal {
  type: "pre" | "rebalance";
  targetRound?: 2 | 3 | 4;
  blueTeam: Participant[];
  redTeam: Participant[];
  blueTeamName?: string;
  redTeamName?: string;
  blueAvgTier: TierDisplay;
  redAvgTier: TierDisplay;
  tierDiffDivisions: number;
  bluePowerPct: number;
  redPowerPct: number;
  blueSynergy: "high" | "medium" | "low";
  redSynergy: "high" | "medium" | "low";
  changes?: TeamChange[];
}

export interface TrialPlayerStat {
  puuid: string;
  kda: number;
  damageDealt: number;
  championId?: number;
  playedRole?: MainRole;
}

export interface TrialResult {
  round: RoundNumber;
  matchId?: string;
  winnerTeam: TeamSide;
  blueTeam: Participant[];
  redTeam: Participant[];
  playerStats: TrialPlayerStat[];
}

export interface RoundRecord {
  round: RoundNumber;
  trialResult: TrialResult;
  nextTeamProposal: TeamProposal;
  lpSnapshotAfterTrial: Record<string, number>;
}

export interface SessionWrapUp {
  endedAtRound: 1 | 2 | 3 | 4;
  winnerTeam?: TeamSide;
  mvpPuuid?: string;
  performanceRating?: 1 | 2 | 3 | 4 | 5;
  evaluationNote?: string;
  feedbackNote?: string;
  endedAt: string;
}

export interface Session {
  id: string;
  name?: string;
  createdAt: string;
  participants: Participant[];
  preTeamProposal?: TeamProposal;
  rounds: RoundRecord[];
  commentMode?: CommentMode;
  wrapUp?: SessionWrapUp;
}

export type NewSession = Partial<Pick<Session, "name" | "participants">>;

export interface UserProfile {
  displayName?: string;
  riotId?: string;
  myPuuid?: string;
  profileIconId?: number;
}

export interface RecentPlayer {
  riotId: string;
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId?: number;
  lastRegisteredAt: string;
}
