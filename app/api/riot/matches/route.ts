import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireQuery } from "@/lib/api/errors";
import { getDemoMatch, getDemoMatchIds, isDemoMode, isDemoPuuid } from "@/lib/demo/mode";
import { localizeApiMessage } from "@/lib/i18n/apiMessages";
import { localeFromRequest } from "@/lib/i18n/locale";
import { getMatch, getMatchIds } from "@/lib/riot/api";

export async function GET(request: Request) {
  try {
    const locale = localeFromRequest(request);
    const puuid = requireQuery(request.url, "puuid");

    if (isDemoPuuid(puuid)) {
      const matches = getDemoMatchIds(puuid)
        .map((id) => getDemoMatch(id))
        .filter((match): match is NonNullable<typeof match> => Boolean(match));
      return NextResponse.json({ matches });
    }

    if (isDemoMode()) {
      throw new ApiError(localizeApiMessage("DEMO_PLAYER_ONLY", locale), 400, "DEMO_PLAYER_ONLY");
    }

    const ids = await getMatchIds(puuid, 10);
    const matches = await Promise.all(ids.map((id) => getMatch(id)));
    return NextResponse.json({ matches });
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
