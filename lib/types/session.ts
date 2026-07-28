// spec.md §6 데이터 모델 — 1:1 대응 타입

export type TeamSide = "blue" | "red";

export type TierSource = "solo" | "flex" | "past_season" | "manual";

export type InternalTierBadge = "OP" | 1 | 2 | 3 | 4;

export type HoneyBeeBadge = "none" | "bee" | "glitterBee" | "rainbowBee";

export type SynergyLevel = "high" | "medium" | "low";

export type CommentMode = "normal" | "friend";

export type TrialRound = 1 | 2 | 3;

export type RebalanceTargetRound = 2 | 3 | 4;

export type MainRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

export interface TierDisplay {
  tier: string; // "PLATINUM"
  rank: string; // "II"
  lp: number;
  label: string; // "플래티넘 2 · 67LP"
}

// F-03: 최근 20판 요약 (KDA, CS, 피해량, 시야)
export interface RecentStatsSummary {
  games: number;
  wins: number;
  kda: number;
  averageCs: number;
  averageDamageDealt: number;
  averageVisionScore: number;
}

export interface MasteryEntry {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface RiotData {
  tier: string;
  rank: string;
  lp: number;
  winRate: number; // 원시 승률 0~1 (보정 승률은 F-03 도메인 로직에서 계산)
  rankedGames: number; // 보정 승률 판수 입력
  recentStats: RecentStatsSummary | null;
  masteries: MasteryEntry[];
  mainRole: MainRole | null;
  preMainRoleKda?: number; // D-07 1판 사전 기대치
  preMainRoleDamage?: number;
}

export interface SynergyFactors {
  duoPartners: string[]; // 함께 플레이한 참가자 puuid
  mainRole: MainRole | null;
  topChampions: number[]; // championId 상위 N개
}

// D-07: 판별 기대 이상(꿀벌)·기대 이하 판정 근거
export interface TrialPerformance {
  kda: number;
  damageDealt: number;
  preStatScore: number;
  tierExpectScore: number;
  trialScore: number;
  roundHoneyBee: boolean;
  roundBelowExpect: boolean; // friend 모드·AI 입력용
}

export interface Participant {
  riotId: string;
  puuid: string;
  preTier: TierDisplay; // F-03: "플래티넘 2 · 67LP"
  preLpValue: number; // 사전 LP (1판 전)
  currentLpValue: number; // 최신 누적 LP (매 판 F-05 후 갱신)
  personalScore: number; // 배정용 (UI 미노출, 재밸런스 전 갱신)
  internalTierBadge: InternalTierBadge; // 뱃지 전용 (1판 전)
  honeyBeeStreak: number; // 연속 꿀벌 판정 횟수
  honeyBeeBadge: HoneyBeeBadge;
  honeyBeeHistory: boolean[]; // [1판, 2판, 3판] 달성 여부
  trialPerformanceByRound?: Partial<Record<TrialRound, TrialPerformance>>;
  tierSource: TierSource;
  riotData: RiotData;
  synergyFactors: SynergyFactors;
}

// F-06 비교 뷰: 이동 인원·방향·사유
export interface TeamChange {
  puuid: string;
  from: TeamSide;
  to: TeamSide;
  reason?: string;
}

export interface TeamProposal {
  type: "pre" | "rebalance";
  targetRound?: RebalanceTargetRound; // rebalance 시 대상 판
  blueTeam: Participant[]; // length = n/2 (4 or 5)
  redTeam: Participant[];
  blueAvgTier: TierDisplay;
  redAvgTier: TierDisplay;
  tierDiffDivisions: number;
  blueSynergy: SynergyLevel;
  redSynergy: SynergyLevel;
  changes?: TeamChange[]; // rebalance only
}

export interface PlayerTrialStats {
  puuid: string;
  kda: number;
  damageDealt: number;
}

export interface TrialResult {
  round: TrialRound;
  matchId?: string;
  winnerTeam: TeamSide;
  blueTeam: Participant[];
  redTeam: Participant[];
  playerStats: PlayerTrialStats[];
}

export interface RoundRecord {
  round: TrialRound; // 입력된 판
  trialResult: TrialResult;
  nextTeamProposal: TeamProposal; // round+1 제안 (2·3·4판)
  lpSnapshotAfterTrial: Record<string, number>; // puuid → 누적 LP
}

export interface Session {
  id: string;
  name?: string;
  createdAt: string;
  participants: Participant[]; // 2~10
  preTeamProposal: TeamProposal | null; // 1판 제안 (round 1), 팀 생성 전 null
  rounds: RoundRecord[]; // length 0~3 (입력된 시험 판)
  commentMode?: CommentMode; // F-08 AI 요약 톤 (기본 normal)
}
