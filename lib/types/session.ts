export type TeamSide = "blue" | "red";
export type RoundNumber = 1 | 2 | 3;
export type PlayRound = RoundNumber | 4;
export type CommentMode = "normal" | "friend";
export type SessionStatus = "preparing" | "in_progress" | "completed";
export type MainRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
export type TierSource = "solo" | "flex" | "past_season" | "manual";
export type PerformanceGrade = "F" | "D" | "C" | "B" | "A" | "OP";
export type HoneyBeeBadge = "none" | "bee" | "glitterBee" | "rainbowBee";
export type UnratedReason =
  | "no_history"
  | "insufficient_sample"
  | "missing_stats"
  | "manual_tier";

export interface UserProfile {
  displayName?: string;
  riotId?: string;
  myPuuid?: string;
}

export interface TierDisplay {
  tier: string;
  rank: string;
  lp: number;
  label: string;
}

export interface RecentStats {
  games: number;
  wins: number;
  kda?: number;
  damageDealt?: number;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface RiotParticipantData {
  tier?: string;
  rank?: string;
  lp?: number;
  winRate?: number;
  profileIconId?: number;
  recentStats?: RecentStats;
  masteries?: ChampionMastery[];
  mainRole?: MainRole;
  preMainRoleKda?: number;
  preMainRoleDamage?: number;
  preMainRoleGames?: number;
}

export interface SynergyFactors {
  duoPartners: string[];
  mainRole?: MainRole;
  topChampions: number[];
}

export interface TrialPerformance {
  kda: number;
  damageDealt: number;
  preStatScore: number | null;
  tierExpectScore: number | null;
  trialScore: number;
  unrated: boolean;
  unratedReason?: UnratedReason;
  roundHoneyBee: boolean;
  roundBelowExpect: boolean;
  performanceGrade: PerformanceGrade | null;
}

export interface Participant {
  riotId: string;
  puuid: string;
  preTier: TierDisplay;
  preLpValue: number;
  currentLpValue: number;
  personalScore: number;
  internalTierBadge: "OP" | 1 | 2 | 3 | 4;
  honeyBeeStreak: number;
  honeyBeeBadge: HoneyBeeBadge;
  honeyBeeHistory: boolean[];
  trialPerformanceByRound?: Partial<Record<RoundNumber, TrialPerformance>>;
  personalScoreDeltaByRound?: Partial<Record<PlayRound, number>>;
  tierSource: TierSource;
  riotData: RiotParticipantData;
  synergyFactors: SynergyFactors;
}

export interface PlayerTrialStat {
  puuid: string;
  kda: number;
  damageDealt: number;
}

export interface TrialResult {
  round: RoundNumber;
  matchId?: string;
  winnerTeam: TeamSide;
  blueTeam: Participant[];
  redTeam: Participant[];
  playerStats: PlayerTrialStat[];
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
  blueAvgTier: TierDisplay;
  redAvgTier: TierDisplay;
  tierDiffDivisions: number;
  bluePowerPct: number;
  redPowerPct: number;
  blueSynergy: "high" | "medium" | "low";
  redSynergy: "high" | "medium" | "low";
  changes?: TeamChange[];
}

export interface RoundRecord {
  round: RoundNumber;
  trialResult: TrialResult;
  nextTeamProposal: TeamProposal;
  lpSnapshotAfterTrial: Record<string, number>;
}

export interface SessionWrapUp {
  endedAtRound: PlayRound;
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

export type NewSession = Pick<Session, "name"> & Partial<Pick<Session, "participants">>;
