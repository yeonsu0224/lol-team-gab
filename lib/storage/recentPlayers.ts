import type { Participant, RecentPlayer } from "@/lib/types";

export const RECENT_PLAYERS_KEY = "team-gap:recent-players:v1";
export const RECENT_PLAYERS_EVENT = "team-gap:recent-players-changed";

export function parseRecentPlayers(raw: string | null): RecentPlayer[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is RecentPlayer => Boolean(item && typeof item.puuid === "string" && typeof item.riotId === "string"))
      .sort((a, b) => b.lastRegisteredAt.localeCompare(a.lastRegisteredAt))
      .slice(0, 50);
  } catch {
    return [];
  }
}

export function listRecentPlayers(): RecentPlayer[] {
  return parseRecentPlayers(window.localStorage.getItem(RECENT_PLAYERS_KEY));
}

export function rememberPlayer(participant: Participant): void {
  const [gameName, tagLine = ""] = participant.riotId.split("#");
  const next: RecentPlayer = {
    riotId: participant.riotId,
    puuid: participant.puuid,
    gameName,
    tagLine,
    profileIconId: participant.profileIconId,
    lastRegisteredAt: new Date().toISOString(),
  };
  const current = listRecentPlayers().filter((item) => item.puuid !== next.puuid);
  save([next, ...current]);
}

export function removeRecentPlayer(puuid: string): void {
  save(listRecentPlayers().filter((item) => item.puuid !== puuid));
}

function save(players: RecentPlayer[]): void {
  window.localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(players.slice(0, 50)));
  window.dispatchEvent(new Event(RECENT_PLAYERS_EVENT));
}
