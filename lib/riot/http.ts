import { ApiError } from "@/lib/api/errors";

const REGION = "asia";
const PLATFORM = "kr";

export async function regionalRequest<T>(path: string): Promise<T> {
  return riotRequest<T>(`https://${REGION}.api.riotgames.com${path}`);
}

export async function platformRequest<T>(path: string): Promise<T> {
  return riotRequest<T>(`https://${PLATFORM}.api.riotgames.com${path}`);
}

async function riotRequest<T>(url: string): Promise<T> {
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new ApiError("RIOT_API_KEY가 설정되지 않았습니다.", 503, "RIOT_API_KEY_MISSING");
  const response = await fetch(url, {
    headers: { "X-Riot-Token": key },
    next: { revalidate: 30 },
  });
  if (response.status === 401 || response.status === 403) {
    throw new ApiError(
      "Riot API 키가 만료되었거나 권한이 없습니다. 키를 갱신하고 서버를 재시작해 주세요.",
      503,
      "RIOT_UNAUTHORIZED",
    );
  }
  if (response.status === 404) throw new ApiError("Riot 데이터를 찾을 수 없습니다.", 404, "RIOT_NOT_FOUND");
  if (response.status === 429) {
    throw new ApiError("Riot API 요청이 많습니다. 잠시 후 다시 시도해 주세요.", 429, "RIOT_RATE_LIMITED");
  }
  if (!response.ok) throw new ApiError(`Riot API 요청 실패 (${response.status})`, 502, "RIOT_API_ERROR");
  return response.json() as Promise<T>;
}
