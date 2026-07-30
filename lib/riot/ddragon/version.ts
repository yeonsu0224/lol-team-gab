import "server-only";

import { ApiError } from "@/lib/api/errors";

let versionPromise: Promise<string> | undefined;

export function getDataDragonVersion(): Promise<string> {
  versionPromise ??= loadVersion();
  return versionPromise;
}

async function loadVersion(): Promise<string> {
  try {
    const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 60 * 60 * 6 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const versions = (await response.json()) as unknown;
    if (!Array.isArray(versions) || typeof versions[0] !== "string") {
      throw new Error("invalid versions response");
    }
    return versions[0];
  } catch {
    const fallback = process.env.DDRAGON_FALLBACK_VERSION?.trim();
    if (fallback) return fallback;
    versionPromise = undefined;
    throw new ApiError(
      503,
      "DDRAGON_VERSION_UNAVAILABLE",
      "Data Dragon 버전을 확인하지 못했습니다.",
      { retryable: true },
    );
  }
}
