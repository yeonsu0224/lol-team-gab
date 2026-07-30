import "server-only";

import { riotFetch } from "./http";

const PLATFORM_BASE = "https://kr.api.riotgames.com";
const REGIONAL_BASE = "https://asia.api.riotgames.com";

export function platformRequest<T>(path: string): Promise<T> {
  return riotFetch<T>(`${PLATFORM_BASE}${path}`);
}

export function regionalRequest<T>(path: string): Promise<T> {
  return riotFetch<T>(`${REGIONAL_BASE}${path}`);
}

export function encodePath(value: string): string {
  return encodeURIComponent(value);
}
