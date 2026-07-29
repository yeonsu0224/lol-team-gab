export type CommentMode = "normal" | "friend";
export type RoundNumber = 1 | 2 | 3;
export type TargetRound = 2 | 3 | 4;
export type TeamSide = "blue" | "red";
export type TierSource = "solo" | "flex" | "past_season" | "manual";
export type HoneyBeeBadge = "none" | "bee" | "glitterBee" | "rainbowBee";
export type PerformanceGrade = "F" | "D" | "C" | "B" | "A" | "OP";
export type InternalTierBadge = "OP" | 1 | 2 | 3 | 4;
export type SynergyGrade = "high" | "medium" | "low";
export type MainRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
export type UnratedReason =
  | "no_history"
  | "insufficient_sample"
  | "missing_stats"
  | "manual_tier";

export interface TierDisplay {
  tier: string;
  rank: string;
  lp: number;
  label: string;
}

export interface RecentStats {
  games: number;
  wins: number;
  losses: number;
  averageKda?: number;
  averageDamage?: number;
  averageCs?: number;
  averageVisionScore?: number;
}

export interface ChampionMasterySummary {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface RiotData {
  tier?: string;
  lp?: number;
  winRate?: number;
  profileIconId?: number;
  recentStats?: RecentStats;
  masteries: ChampionMasterySummary[];
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
  internalTierBadge: InternalTierBadge;
  honeyBeeStreak: number;
  honeyBeeBadge: HoneyBeeBadge;
  honeyBeeHistory: boolean[];
  trialPerformanceByRound?: Partial<Record<RoundNumber, TrialPerformance>>;
  personalScoreDeltaByRound?: Partial<Record<RoundNumber, number>>;
  tierSource: TierSource;
  riotData: RiotData;
  synergyFactors: SynergyFactors;
}

export interface TeamChange {
  outPuuid: string;
  inPuuid: string;
  toTeam: TeamSide;
  reason: string;
}

export interface TeamProposal {
  type: "pre" | "rebalance";
  targetRound?: TargetRound;
  blueTeam: Participant[];
  redTeam: Participant[];
  blueAvgTier: TierDisplay;
  redAvgTier: TierDisplay;
  tierDiffDivisions: number;
  bluePowerPct: number;
  redPowerPct: number;
  blueSynergy: SynergyGrade;
  redSynergy: SynergyGrade;
  changes?: TeamChange[];
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

export interface RoundRecord {
  round: RoundNumber;
  trialResult: TrialResult;
  nextTeamProposal: TeamProposal;
  lpSnapshotAfterTrial: Record<string, number>;
}

export interface SessionWrapUp {
  endedAtRound: 1 | 2 | 3 | 4;
  mvpPuuid?: string;
  evaluationNote?: string;
  feedbackNote?: string;
  endedAt: string;
}

export interface Session {
  id: string;
  name?: string;
  createdAt: string;
  participants: Participant[];
  // A new session has no proposal until Phase 5 runs.
  preTeamProposal?: TeamProposal;
  rounds: RoundRecord[];
  commentMode: CommentMode;
  wrapUp?: SessionWrapUp;
}

export type SessionUpdate =
  | Partial<Omit<Session, "id" | "createdAt">>
  | ((session: Session) => Session);
