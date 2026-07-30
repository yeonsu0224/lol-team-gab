import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/errors";
import { getMatch } from "@/lib/riot/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return NextResponse.json(await getMatch(id));
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
