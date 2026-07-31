import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { findDemoAccount, isDemoMode } from "@/lib/demo/mode";
import { getAccount } from "@/lib/riot/api";
import { localizeApiMessage } from "@/lib/i18n/apiMessages";
import { localeFromRequest } from "@/lib/i18n/locale";

export async function GET(request: Request) {
  try {
    const locale = localeFromRequest(request);
    const { searchParams } = new URL(request.url);
    const gameName = searchParams.get("gameName")?.trim();
    const tagLine = searchParams.get("tagLine")?.trim();
    if (!gameName || !tagLine) {
      throw new ApiError(localizeApiMessage("INVALID_ACCOUNT_QUERY", locale), 400, "INVALID_REQUEST");
    }
    const demoAccount = findDemoAccount(gameName, tagLine);
    if (demoAccount) {
      return NextResponse.json({
        puuid: demoAccount.puuid,
        gameName: demoAccount.gameName,
        tagLine: demoAccount.tagLine,
      });
    }
    if (isDemoMode()) {
      throw new ApiError(localizeApiMessage("DEMO_PLAYER_ONLY", locale), 400, "DEMO_PLAYER_ONLY");
    }
    return NextResponse.json(await getAccount(gameName, tagLine));
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
