import "server-only";

import { ApiError } from "@/lib/api/errors";

const MAX_RETRIES = 1;

export async function riotFetch<T>(
  url: string,
  init: RequestInit = {},
  retryCount = 0,
): Promise<T> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "RIOT_KEY_MISSING", "RIOT_API_KEY가 설정되지 않았습니다.");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "X-Riot-Token": apiKey,
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(12_000),
    });
  } catch (error) {
    throw new ApiError(502, "RIOT_NETWORK_ERROR", "Riot API에 연결하지 못했습니다.", {
      retryable: true,
      details: error instanceof Error ? error.message : undefined,
    });
  }

  if (response.status === 429 && retryCount < MAX_RETRIES) {
    const retryAfter = Number(response.headers.get("retry-after") ?? "1");
    await delay(Math.min(Math.max(retryAfter, 1), 5) * 1_000);
    return riotFetch<T>(url, init, retryCount + 1);
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? "Riot 데이터를 찾을 수 없습니다."
        : response.status === 401 || response.status === 403
          ? "Riot API 키가 만료되었거나 권한이 없습니다."
          : response.status === 429
            ? "Riot API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."
            : "Riot API 요청에 실패했습니다.";
    throw new ApiError(response.status, `RIOT_${response.status}`, message, {
      retryable: response.status === 429 || response.status >= 500,
    });
  }

  return (await response.json()) as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
