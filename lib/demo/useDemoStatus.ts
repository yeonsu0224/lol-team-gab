"use client";

import { useEffect, useState } from "react";

export interface DemoStatusPlayer {
  gameName: string;
  tagLine: string;
  riotId: string;
  puuid: string;
  tier: { tier: string; rank: string; lp: number } | null;
}

export interface DemoStatus {
  demoMode: boolean;
  players: DemoStatusPlayer[];
}

let cached: DemoStatus | null = null;
let pending: Promise<DemoStatus> | null = null;

async function fetchDemoStatus(): Promise<DemoStatus> {
  if (cached && "tier" in (cached.players[0] ?? { tier: null })) return cached;
  cached = null;
  if (!pending) {
    pending = fetch("/api/demo/status")
      .then(async (response) => {
        if (!response.ok) return { demoMode: false, players: [] };
        return response.json() as Promise<DemoStatus>;
      })
      .then((data) => {
        cached = data;
        pending = null;
        return data;
      })
      .catch(() => {
        pending = null;
        return { demoMode: false, players: [] };
      });
  }
  return pending;
}

export function useDemoStatus() {
  const [status, setStatus] = useState<DemoStatus>(cached ?? { demoMode: false, players: [] });

  useEffect(() => {
    let active = true;
    void fetchDemoStatus().then((data) => {
      if (active) setStatus(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return status;
}

export function isDemoPuuidClient(puuid?: string) {
  return Boolean(puuid?.startsWith("demo-puuid-"));
}
