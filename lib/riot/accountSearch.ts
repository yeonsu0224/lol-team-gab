import "server-only";

import { ApiError } from "@/lib/api/errors";
import type { RiotAccount } from "./types";
import { getAccountByRiotId } from "./account";

const COMMON_KR_TAGS = ["KR1", "KR2", "KR3", "KR4", "KR5"] as const;

export async function searchAccounts(query: string): Promise<RiotAccount[]> {
  const normalized = query.trim();
  if (normalized.length < 2 || normalized.endsWith("#")) return [];

  if (normalized.includes("#")) {
    const tag = normalized.slice(normalized.lastIndexOf("#") + 1);
    if (tag.length < 2) return [];
    try {
      return [await getAccountByRiotId(normalized)];
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return [];
      throw error;
    }
  }

  const results: RiotAccount[] = [];
  for (const tag of COMMON_KR_TAGS) {
    try {
      const account = await getAccountByRiotId(`${normalized}#${tag}`);
      if (!results.some(({ puuid }) => puuid === account.puuid)) results.push(account);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
  }
  return results;
}
