"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { NewSession, Session } from "@/lib/types";
import {
  createSession,
  deleteSession,
  parseSessions,
  SESSION_STORAGE_KEY,
  SESSION_STORE_EVENT,
  updateSession,
} from "./sessionStore";

export function useSessions() {
  // `null` marks "storage not read yet", which is what both the server render
  // and the hydration render see. Deriving state from this snapshot instead of
  // reading localStorage keeps server and client markup identical.
  const raw = useSyncExternalStore<string | null>(
    (onStoreChange) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === SESSION_STORAGE_KEY) onStoreChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(SESSION_STORE_EVENT, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(SESSION_STORE_EVENT, onStoreChange);
      };
    },
    () => window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "[]",
    () => null,
  );
  const hydrated = raw !== null;

  const { sessions, error } = useMemo(() => {
    try {
      return { sessions: parseSessions(raw), error: null };
    } catch (cause) {
      return {
        sessions: [] as Session[],
        error: cause instanceof Error ? cause.message : "세션을 불러오지 못했습니다.",
      };
    }
  }, [raw]);

  return {
    sessions,
    error,
    hydrated,
    refresh() {
      window.dispatchEvent(new Event(SESSION_STORE_EVENT));
    },
    create(input?: NewSession) {
      return createSession(input);
    },
    update(id: string, update: Partial<Omit<Session, "id" | "createdAt">>) {
      return updateSession(id, update);
    },
    remove(id: string) {
      return deleteSession(id);
    },
  };
}
