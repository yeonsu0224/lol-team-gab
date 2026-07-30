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
  const raw = useSyncExternalStore<string | null>(
    (notify) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === SESSION_STORAGE_KEY) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(SESSION_STORE_EVENT, notify);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(SESSION_STORE_EVENT, notify);
      };
    },
    () => window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "[]",
    () => null,
  );

  const snapshot = useMemo(() => {
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
    ...snapshot,
    hydrated: raw !== null,
    create(input?: NewSession) {
      return createSession(input);
    },
    update(
      id: string,
      update: Partial<Omit<Session, "id" | "createdAt">> | ((current: Session) => Session),
    ) {
      return updateSession(id, update);
    },
    remove(id: string) {
      return deleteSession(id);
    },
  };
}
