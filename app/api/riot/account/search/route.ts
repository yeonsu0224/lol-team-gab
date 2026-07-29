import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/errors";
import { searchAccounts } from "@/lib/riot/account";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    return NextResponse.json({ accounts: await searchAccounts(query) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
