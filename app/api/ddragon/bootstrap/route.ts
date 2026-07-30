import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/errors";
import { getDataDragonBootstrap } from "@/lib/riot/ddragon/bootstrap";

export async function GET() {
  try {
    return NextResponse.json(await getDataDragonBootstrap());
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}
