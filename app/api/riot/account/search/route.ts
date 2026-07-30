import { NextResponse } from "next/server";

import { apiErrorResponse, requiredSearchParam } from "@/lib/api/errors";
import { searchAccounts } from "@/lib/riot/accountSearch";

export async function GET(request: Request) {
  try {
    const query = requiredSearchParam(new URL(request.url), "q");
    return NextResponse.json(await searchAccounts(query));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
