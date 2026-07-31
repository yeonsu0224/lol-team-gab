import { NextResponse } from "next/server";

import { isDemoMode, listDemoPlayers } from "@/lib/demo/mode";

export async function GET() {
  const players = listDemoPlayers().map(({ gameName, tagLine, puuid, tier }) => ({
    gameName,
    tagLine,
    riotId: `${gameName}#${tagLine}`,
    puuid,
    tier: tier
      ? { tier: tier.tier, rank: tier.rank, lp: tier.lp }
      : null,
  }));
  // Show demo UX whenever fixtures exist so an expired key still presents a usable review path.
  return NextResponse.json({
    demoMode: isDemoMode() || players.length > 0,
    players,
  });
}
