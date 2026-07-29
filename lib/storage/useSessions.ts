"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { Session } from "@/lib/types";

import {
  createSession,
  deleteSession,
  getServerSessionsSnapshot,
  getSessionsSnapshot,
  parseSessionsSnapshot,
  subscribeToSessions,
} from "./sessionStore";

export interface UseSessionsResult {
  sessions: Session[];
  isHydrated: boolean;
  create: (name?: string) => Session;
  remove: (id: string) => void;
}

const subscribeToHydration = () => () => {};

export function useSessions(): UseSessionsResult {
  const snapshot = useSyncExternalStore(
    subscribeToSessions,
    getSessionsSnapshot,
    getServerSessionsSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const sessions = useMemo(() => {
    try {
      return parseSessionsSnapshot(snapshot);
    } catch {
      return [];
    }
  }, [snapshot]);

  const create = useCallback((name?: string) => createSession(name), []);
  const remove = useCallback((id: string) => deleteSession(id), []);

  return {
    sessions,
    isHydrated,
    create,
    remove,
  };
}

export interface UseSessionResult {
  session: Session | null;
  isHydrated: boolean;
}

/** Subscribes to a single session by id (storage is the source of truth). */
export function useSession(id: string): UseSessionResult {
  const snapshot = useSyncExternalStore(
    subscribeToSessions,
    getSessionsSnapshot,
    getServerSessionsSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const session = useMemo(() => {
    try {
      return parseSessionsSnapshot(snapshot).find((item) => item.id === id) ?? null;
    } catch {
      return null;
    }
  }, [snapshot, id]);

  return { session, isHydrated };
}
