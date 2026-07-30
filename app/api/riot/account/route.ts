import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { getAccount } from "@/lib/riot/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameName = searchParams.get("gameName")?.trim();
    const tagLine = searchParams.get("tagLine")?.trim();
    if (!gameName || !tagLine) throw new ApiError("gameName과 tagLine이 필요합니다.", 400, "INVALID_REQUEST");
    return NextResponse.json(await getAccount(gameName, tagLine));
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
