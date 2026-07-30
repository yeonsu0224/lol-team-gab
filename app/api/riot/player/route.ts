import { NextResponse } from "next/server";

import { apiErrorResponse, requireQuery } from "@/lib/api/errors";
import { tierToLpValue } from "@/lib/domain/lp";
import { getMatch, getMatchIds, getPlayer } from "@/lib/riot/api";
import type { MainRole } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const puuid = requireQuery(request.url, "puuid");
    const [{ summoner, entries, masteries }, ids] = await Promise.all([
      getPlayer(puuid),
      getMatchIds(puuid, 20),
    ]);
    const matches = await Promise.all(ids.slice(0, 12).map((id) => getMatch(id).catch(() => null)));
    const rows = matches
      .filter((match) => match !== null)
      .map((match) => match.info.participants.find((item) => item.puuid === puuid))
      .filter((row) => row !== undefined);
    const roles = rows.map(({ teamPosition }) => roleOf(teamPosition)).filter((role) => role !== undefined);
    const mainRole = mostCommon(roles);
    const mainRows = mainRole ? rows.filter(({ teamPosition }) => roleOf(teamPosition) === mainRole) : rows;
    const solo = entries.find(({ queueType }) => queueType === "RANKED_SOLO_5x5");
    const flex = entries.find(({ queueType }) => queueType === "RANKED_FLEX_SR");
    const rank = solo ?? flex;
    return NextResponse.json({
      puuid,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      rank: rank ? {
        tier: rank.tier,
        rank: rank.rank,
        lp: rank.leaguePoints,
        wins: rank.wins,
        losses: rank.losses,
        lpValue: tierToLpValue(rank.tier, rank.rank, rank.leaguePoints),
        source: solo ? "solo" : "flex",
      } : null,
      masteries,
      mainRole,
      preMainRoleGames: mainRows.length,
      preMainRoleKda: mainRows.length
        ? average(mainRows.map(({ kills, deaths, assists }) => (kills + assists) / Math.max(1, deaths)))
        : null,
      preMainRoleDamage: mainRows.length
        ? average(mainRows.map(({ totalDamageDealtToChampions }) => totalDamageDealtToChampions))
        : null,
      recentStats: {
        games: rows.length,
        wins: rows.filter(({ win }) => win).length,
        kills: sum(rows.map(({ kills }) => kills)),
        deaths: sum(rows.map(({ deaths }) => deaths)),
        assists: sum(rows.map(({ assists }) => assists)),
        damageDealt: sum(rows.map(({ totalDamageDealtToChampions }) => totalDamageDealtToChampions)),
      },
    });
  } catch (cause) {
    return apiErrorResponse(cause);
  }
}

function roleOf(value?: string): MainRole | undefined {
  const normalized = value === "MIDDLE" ? "MIDDLE" : value === "BOTTOM" ? "BOTTOM" : value;
  return ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"].includes(normalized ?? "")
    ? normalized as MainRole
    : undefined;
}

function mostCommon(values: MainRole[]): MainRole | undefined {
  return values.sort((a, b) =>
    values.filter((item) => item === b).length - values.filter((item) => item === a).length
  )[0];
}

function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
