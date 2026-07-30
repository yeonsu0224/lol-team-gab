import "server-only";

import { ApiError } from "@/lib/api/errors";
import type { ChampionSummary, ChampionsByKey } from "./types";

const cache = new Map<string, Promise<ChampionsByKey>>();

interface ChampionPayload {
  data: Record<string, ChampionSummary>;
}

export function getChampionsByKey(version: string): Promise<ChampionsByKey> {
  let request = cache.get(version);
  if (!request) {
    request = loadChampions(version);
    cache.set(version, request);
  }
  return request;
}

async function loadChampions(version: string): Promise<ChampionsByKey> {
  const response = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(version)}/data/ko_KR/champion.json`,
    { next: { revalidate: 60 * 60 * 24 }, signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) {
    cache.delete(version);
    throw new ApiError(502, "DDRAGON_CHAMPIONS_FAILED", "챔피언 정보를 불러오지 못했습니다.", {
      retryable: true,
    });
  }
  const payload = (await response.json()) as ChampionPayload;
  return Object.values(payload.data).reduce<ChampionsByKey>((result, champion) => {
    result[champion.key] = {
      id: champion.id,
      key: champion.key,
      name: champion.name,
      title: champion.title,
    };
    return result;
  }, {});
}
