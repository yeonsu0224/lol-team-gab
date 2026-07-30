import { NextResponse } from "next/server";

import { apiErrorResponse, requiredSearchParam } from "@/lib/api/errors";
import { getAccountByRiotId } from "@/lib/riot/account";

export async function GET(request: Request) {
  try {
    const riotId = requiredSearchParam(new URL(request.url), "riotId");
    return NextResponse.json(await getAccountByRiotId(riotId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
