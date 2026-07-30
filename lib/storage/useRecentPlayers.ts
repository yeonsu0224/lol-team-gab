"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  parseRecentPlayers,
  RECENT_PLAYERS_EVENT,
  RECENT_PLAYERS_KEY,
} from "./recentPlayers";

export function useRecentPlayers() {
  const raw = useSyncExternalStore<string | null>(
    (notify) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === RECENT_PLAYERS_KEY) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(RECENT_PLAYERS_EVENT, notify);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(RECENT_PLAYERS_EVENT, notify);
      };
    },
    () => window.localStorage.getItem(RECENT_PLAYERS_KEY) ?? "[]",
    () => null,
  );
  return {
    recentPlayers: useMemo(() => parseRecentPlayers(raw), [raw]),
    hydrated: raw !== null,
  };
}
