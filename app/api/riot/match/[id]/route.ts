import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { getDemoMatch, isDemoMode } from "@/lib/demo/mode";
import { localizeApiMessage } from "@/lib/i18n/apiMessages";
import { localeFromRequest } from "@/lib/i18n/locale";
import { getMatch } from "@/lib/riot/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const locale = localeFromRequest(request);
    const { id } = await params;
    if (id.startsWith("DEMO_")) {
      const match = getDemoMatch(id);
      if (!match) {
        throw new ApiError(localizeApiMessage("DEMO_MATCH_NOT_FOUND", locale), 404, "RIOT_NOT_FOUND");
      }
      return NextResponse.json(match);
    }
    if (isDemoMode()) {
      throw new ApiError(localizeApiMessage("DEMO_MATCH_NOT_FOUND", locale), 404, "RIOT_NOT_FOUND");
    }
    return NextResponse.json(await getMatch(id));
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
