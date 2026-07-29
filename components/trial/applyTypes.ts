import type { TeamSide } from "@/lib/types";

export interface RosterEntry {
  puuid: string;
  riotId: string;
  team: TeamSide;
}

export interface AppliedStat {
  kda: number | null;
  damage: number | null;
}

export interface AppliedResult {
  stats: Record<string, AppliedStat>;
  winnerTeam?: TeamSide;
}
