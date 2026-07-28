"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Session } from "@/lib/types";
import {
  getSessionsRawSnapshot,
  parseSessionMap,
  subscribeSessions,
} from "./sessionStore";

const getServerSnapshot = () => null;

export function useSessions(): Session[] | null {
  const raw = useSyncExternalStore(
    subscribeSessions,
    getSessionsRawSnapshot,
    getServerSnapshot,
  );

  return useMemo(() => {
    if (raw === null) return null;
    return Object.values(parseSessionMap(raw)).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }, [raw]);
}

// undefined = 아직 로드 전(SSR), null = 없는 세션
export function useSession(id: string): Session | null | undefined {
  const raw = useSyncExternalStore(
    subscribeSessions,
    getSessionsRawSnapshot,
    getServerSnapshot,
  );

  return useMemo(() => {
    if (raw === null) return undefined;
    return parseSessionMap(raw)[id] ?? null;
  }, [raw, id]);
}
