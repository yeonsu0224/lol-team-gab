import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { lpValueToTier } from "../lib/domain/lp";
import { DEMO_ROSTER, demoRiotId } from "../lib/demo/roster";
import type { DemoAccountFixture, DemoFixturesFile, DemoPlayerFixture } from "../lib/demo/types";
import { getAccount, getMatch, getMatchIds, getPlayer } from "../lib/riot/api";
import { buildPlayerSummary } from "../lib/riot/playerSummary";
import type { RiotMatch } from "../lib/riot/types";

loadEnvLocal();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "lib/demo/fixtures.json");
const MATCHES_PER_PLAYER = 5;

async function main() {
  if (!process.env.RIOT_API_KEY?.trim()) {
    throw new Error("RIOT_API_KEY is required to generate demo fixtures.");
  }

  const realToDemo = new Map<string, string>();
  const accounts: DemoAccountFixture[] = [];
  const players: Record<string, DemoPlayerFixture> = {};
  const matchIdsByPuuid: Record<string, string[]> = {};
  const matches: Record<string, RiotMatch> = {};
  const matchIdMap = new Map<string, string>();
  let otherCounter = 0;
  const failures: string[] = [];

  for (let index = 0; index < DEMO_ROSTER.length; index += 1) {
    const entry = DEMO_ROSTER[index];
    const label = demoRiotId(entry);
    const demoPuuid = `demo-puuid-${String(index + 1).padStart(2, "0")}`;
    process.stdout.write(`Fetching ${label}… `);
    try {
      const account = await getAccount(entry.gameName, entry.tagLine);
      realToDemo.set(account.puuid, demoPuuid);
      const { summoner, entries, masteries } = await getPlayer(account.puuid);
      const ids = await getMatchIds(account.puuid, MATCHES_PER_PLAYER);
      const rawMatches = await Promise.all(ids.map((id) => getMatch(id).catch(() => null)));
      const summary = buildPlayerSummary(account.puuid, summoner, entries, masteries, rawMatches);
      const tier = summary.rank
        ? lpValueToTier(summary.rank.lpValue)
        : null;

      accounts.push({
        puuid: demoPuuid,
        gameName: entry.gameName,
        tagLine: entry.tagLine,
        profileIconId: summoner.profileIconId,
        tier: tier
          ? { tier: tier.tier, rank: tier.rank, lp: tier.lp, label: tier.label }
          : null,
      });

      players[demoPuuid] = {
        ...summary,
        puuid: demoPuuid,
        masteries: masteries.slice(0, 5),
      };

      const demoMatchIds: string[] = [];
      for (const match of rawMatches) {
        if (!match) continue;
        let demoMatchId = matchIdMap.get(match.metadata.matchId);
        if (!demoMatchId) {
          demoMatchId = `DEMO_KR_${String(matchIdMap.size + 1).padStart(4, "0")}`;
          matchIdMap.set(match.metadata.matchId, demoMatchId);
          matches[demoMatchId] = anonymizeMatch(match, realToDemo, () => {
            otherCounter += 1;
            return `demo-other-${String(otherCounter).padStart(3, "0")}`;
          }, demoMatchId);
        }
        demoMatchIds.push(demoMatchId);
      }
      matchIdsByPuuid[demoPuuid] = demoMatchIds;
      console.log(`ok (${summary.rank?.tier ?? "UNRANKED"}, ${demoMatchIds.length} matches)`);
      await sleep(1200);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      failures.push(`${label}: ${message}`);
      console.log(`FAILED — ${message}`);
    }
  }

  if (failures.length) {
    console.error("\nSome roster lookups failed:");
    for (const line of failures) console.error(`  - ${line}`);
    if (!accounts.length) process.exit(1);
    console.error("\nWriting partial fixtures for successful lookups.");
  }

  const payload: DemoFixturesFile = {
    generatedAt: new Date().toISOString(),
    accounts,
    players,
    matchIdsByPuuid,
    matches,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${accounts.length} accounts → ${OUT}`);
}

function anonymizeMatch(
  match: RiotMatch,
  realToDemo: Map<string, string>,
  nextOther: () => string,
  demoMatchId: string,
): RiotMatch {
  const participants = match.metadata.participants.map((puuid) => {
    const mapped = realToDemo.get(puuid);
    if (mapped) return mapped;
    const created = nextOther();
    realToDemo.set(puuid, created);
    return created;
  });

  return {
    metadata: { matchId: demoMatchId, participants },
    info: {
      gameCreation: match.info.gameCreation,
      gameDuration: match.info.gameDuration,
      participants: match.info.participants.map((row) => {
        const mapped = realToDemo.get(row.puuid) ?? nextOther();
        realToDemo.set(row.puuid, mapped);
        const isDemo = mapped.startsWith("demo-puuid-");
        return {
          ...row,
          puuid: mapped,
          riotIdGameName: isDemo ? row.riotIdGameName : `Player${mapped.slice(-3)}`,
          riotIdTagline: isDemo ? row.riotIdTagline : "DEMO",
        };
      }),
    },
  };
}

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

function sleep(ms: number) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

main().catch((cause) => {
  console.error(cause);
  process.exit(1);
});
