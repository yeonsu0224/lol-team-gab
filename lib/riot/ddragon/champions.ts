import "server-only";

import { ApiError } from "@/lib/api/errors";

import type { ChampionSummary } from "./types";

export type { ChampionSummary } from "./types";

interface ChampionDataResponse {
  data: Record<string, ChampionSummary>;
}

const championCache = new Map<
  string,
  Promise<Record<string, ChampionSummary>>
>();

async function fetchChampions(
  version: string,
): Promise<Record<string, ChampionSummary>> {
  const response = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`,
    { next: { revalidate: 60 * 60 * 24 } },
  );
  if (!response.ok) {
    throw new ApiError(
      502,
      "DDRAGON_CHAMPIONS_UNAVAILABLE",
      "챔피언 정보를 불러오지 못했습니다.",
      "ddragon",
      { status: response.status },
    );
  }

  const payload = (await response.json()) as ChampionDataResponse;
  return Object.fromEntries(
    Object.values(payload.data).map((champion) => [
      champion.key,
      {
        id: champion.id,
        key: champion.key,
        name: champion.name,
        title: champion.title,
        image: { full: champion.image.full },
      },
    ]),
  );
}

export function getChampionsByKey(
  version: string,
): Promise<Record<string, ChampionSummary>> {
  const cached = championCache.get(version);
  if (cached) {
    return cached;
  }

  const request = fetchChampions(version).catch((error) => {
    championCache.delete(version);
    throw error;
  });
  championCache.set(version, request);
  return request;
}

export function getChampionByNumericId(
  championsByKey: Record<string, ChampionSummary>,
  championId: number,
): ChampionSummary | null {
  return championsByKey[String(championId)] ?? null;
}
