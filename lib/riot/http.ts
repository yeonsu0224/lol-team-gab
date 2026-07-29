import "server-only";

import { ApiError } from "@/lib/api/errors";

const RIOT_HOSTS = {
  asia: "https://asia.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
} as const;

type RiotRegion = keyof typeof RIOT_HOSTS;

function getApiKey(): string {
  const apiKey = process.env.RIOT_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiError(
      503,
      "RIOT_API_KEY_MISSING",
      "Riot API 키가 설정되지 않았습니다.",
      "riot",
    );
  }
  return apiKey;
}

function retryDelay(response: Response): number {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isFinite(seconds)
    ? Math.min(Math.max(seconds * 1_000, 250), 5_000)
    : 1_000;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function parseUpstreamError(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

interface UpstreamError {
  status: number;
  code: string;
  message: string;
}

function mapUpstreamError(status: number): UpstreamError {
  switch (status) {
    case 401:
    case 403:
      // A rejected key is a server configuration problem, not a caller auth
      // failure, so this surfaces as 503 like a missing key does.
      return {
        status: 503,
        code: "RIOT_UNAUTHORIZED",
        message:
          "Riot API 키가 만료되었거나 유효하지 않습니다. 키를 갱신한 뒤 서버를 다시 시작해 주세요.",
      };
    case 404:
      return {
        status,
        code: "RIOT_NOT_FOUND",
        message: "Riot에서 해당 정보를 찾지 못했습니다.",
      };
    case 429:
      return {
        status,
        code: "RIOT_RATE_LIMITED",
        message: "Riot API 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
      };
    default:
      return {
        status,
        code: "RIOT_API_ERROR",
        message: "Riot 정보를 불러오지 못했습니다.",
      };
  }
}

export async function riotFetch<T>(
  region: RiotRegion,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${RIOT_HOSTS[region]}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("X-Riot-Token", getApiKey());
  headers.set("Accept", "application/json");

  let response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 429) {
    await wait(retryDelay(response));
    response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const details = await parseUpstreamError(response);
    const mapped = mapUpstreamError(response.status);

    throw new ApiError(
      mapped.status,
      mapped.code,
      mapped.message,
      "riot",
      details,
    );
  }

  return (await response.json()) as T;
}

export function encodeRiotPath(value: string): string {
  return encodeURIComponent(value);
}
