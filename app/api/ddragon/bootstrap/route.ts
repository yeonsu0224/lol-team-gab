import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/errors";
import { getChampionsByKey } from "@/lib/riot/ddragon/champions";
import { getDataDragonVersion } from "@/lib/riot/ddragon/version";

export async function GET() {
  try {
    const version = await getDataDragonVersion();
    const championsByKey = await getChampionsByKey(version);
    return NextResponse.json(
      { version, championsByKey },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
