import "server-only";

import { ApiError } from "@/lib/api/errors";
import type { RiotAccount } from "./types";
import { encodePath, regionalRequest } from "./api";

export function parseRiotId(riotId: string): { gameName: string; tagLine: string } {
  const separator = riotId.lastIndexOf("#");
  const gameName = riotId.slice(0, separator).trim();
  const tagLine = riotId.slice(separator + 1).trim();
  if (separator <= 0 || !gameName || !tagLine) {
    throw new ApiError(400, "INVALID_RIOT_ID", "Riot ID를 게임명#태그 형식으로 입력해 주세요.");
  }
  return { gameName, tagLine };
}

export async function getAccountByRiotId(riotId: string): Promise<RiotAccount> {
  const { gameName, tagLine } = parseRiotId(riotId);
  return regionalRequest<RiotAccount>(
    `/riot/account/v1/accounts/by-riot-id/${encodePath(gameName)}/${encodePath(tagLine)}`,
  );
}
