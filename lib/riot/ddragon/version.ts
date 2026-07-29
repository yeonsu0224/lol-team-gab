import "server-only";

import { ApiError } from "@/lib/api/errors";

const VERSIONS_URL =
  "https://ddragon.leagueoflegends.com/api/versions.json";

let versionPromise: Promise<string> | null = null;

function validVersion(value: unknown): value is string {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value);
}

async function resolveVersion(): Promise<string> {
  try {
    const response = await fetch(VERSIONS_URL, {
      next: { revalidate: 60 * 60 },
    });
    if (!response.ok) {
      throw new Error(`Data Dragon versions returned ${response.status}`);
    }

    const versions: unknown = await response.json();
    if (!Array.isArray(versions) || !validVersion(versions[0])) {
      throw new Error("Data Dragon versions response was invalid");
    }
    return versions[0];
  } catch (error) {
    const fallback = process.env.DDRAGON_FALLBACK_VERSION?.trim();
    if (validVersion(fallback)) {
      return fallback;
    }

    throw new ApiError(
      503,
      "DDRAGON_VERSION_UNAVAILABLE",
      "Data Dragon 버전을 확인하지 못했습니다.",
      "ddragon",
      undefined,
      { cause: error },
    );
  }
}

export function getDataDragonVersion(): Promise<string> {
  if (!versionPromise) {
    versionPromise = resolveVersion().catch((error) => {
      versionPromise = null;
      throw error;
    });
  }
  return versionPromise;
}
