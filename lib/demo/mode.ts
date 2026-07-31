import { DEMO_ROSTER, normalizeRiotPart } from "./roster";
import type { DemoAccountFixture, DemoFixturesFile, DemoPlayerFixture } from "./types";
import fixtures from "./fixtures.json";

const data = fixtures as DemoFixturesFile;

/** Demo mode: explicit flag, or auto when no Riot key (public review / keyless). */
export function isDemoMode() {
  if (process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1") return true;
  if (process.env.DEMO_MODE === "false" || process.env.DEMO_MODE === "0") return false;
  return !process.env.RIOT_API_KEY?.trim();
}

export function listDemoPlayers(): DemoAccountFixture[] {
  return data.accounts;
}

export function findDemoAccount(gameName: string, tagLine: string): DemoAccountFixture | undefined {
  const name = normalizeRiotPart(gameName);
  const tag = normalizeRiotPart(tagLine);
  return data.accounts.find(
    (account) =>
      normalizeRiotPart(account.gameName) === name && normalizeRiotPart(account.tagLine) === tag,
  );
}

export function findDemoAccountByQuery(query: string): DemoAccountFixture | undefined {
  const separator = query.lastIndexOf("#");
  if (separator <= 0 || separator === query.length - 1) return undefined;
  return findDemoAccount(query.slice(0, separator), query.slice(separator + 1));
}

export function findDemoAccountByPuuid(puuid: string): DemoAccountFixture | undefined {
  return data.accounts.find((account) => account.puuid === puuid);
}

export function getDemoPlayer(puuid: string): DemoPlayerFixture | undefined {
  return data.players[puuid];
}

export function getDemoMatchIds(puuid: string): string[] {
  return data.matchIdsByPuuid[puuid] ?? [];
}

export function getDemoMatch(id: string) {
  return data.matches[id];
}

export function isDemoPuuid(puuid: string) {
  return Boolean(data.players[puuid]);
}

export function rosterLabels() {
  return DEMO_ROSTER.map((entry) => `${entry.gameName}#${entry.tagLine}`);
}
