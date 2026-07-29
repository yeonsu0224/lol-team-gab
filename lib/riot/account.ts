import "server-only";

import { ApiError } from "@/lib/api/errors";

import { encodeRiotPath, riotFetch } from "./http";
import type { RiotAccount } from "./types";

export function parseRiotId(
  riotId: string,
): { gameName: string; tagLine: string } | null {
  const separator = riotId.lastIndexOf("#");
  if (separator <= 0 || separator === riotId.length - 1) {
    return null;
  }

  const gameName = riotId.slice(0, separator).trim();
  const tagLine = riotId.slice(separator + 1).trim();
  return gameName && tagLine ? { gameName, tagLine } : null;
}

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
): Promise<RiotAccount> {
  return riotFetch<RiotAccount>(
    "asia",
    `/riot/account/v1/accounts/by-riot-id/${encodeRiotPath(gameName)}/${encodeRiotPath(tagLine)}`,
  );
}

export async function searchAccounts(query: string): Promise<RiotAccount[]> {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }

  if (normalized.includes("#")) {
    const parsed = parseRiotId(normalized);
    if (!parsed) {
      return [];
    }

    try {
      return [await getAccountByRiotId(parsed.gameName, parsed.tagLine)];
    } catch (error) {
      if (error instanceof ApiError && error.code === "RIOT_NOT_FOUND") {
        return [];
      }
      throw error;
    }
  }

  const accounts: RiotAccount[] = [];
  for (const tagLine of ["KR1", "KR2", "KR3", "KR4", "KR5"]) {
    try {
      accounts.push(await getAccountByRiotId(normalized, tagLine));
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== "RIOT_NOT_FOUND") {
        throw error;
      }
    }
  }
  return accounts;
}
