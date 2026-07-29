import type { Session, SessionUpdate, SessionWrapUp } from "@/lib/types";

const STORAGE_KEY = "team-gap:sessions:v2";
const SESSION_CHANGE_EVENT = "team-gap:sessions-changed";

export type SessionStorageErrorCode =
  | "unavailable"
  | "quota_exceeded"
  | "invalid_data"
  | "not_found";

export class SessionStorageError extends Error {
  constructor(
    public readonly code: SessionStorageErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "SessionStorageError";
  }
}

function getStorage(): Storage {
  if (typeof window === "undefined") {
    throw new SessionStorageError(
      "unavailable",
      "브라우저에서만 내전 데이터를 저장할 수 있습니다.",
    );
  }

  try {
    return window.localStorage;
  } catch (error) {
    throw new SessionStorageError(
      "unavailable",
      "브라우저 저장소를 사용할 수 없습니다.",
      { cause: error },
    );
  }
}

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Session>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.participants) &&
    Array.isArray(candidate.rounds)
  );
}

export function parseSessionsSnapshot(snapshot: string | null): Session[] {
  if (!snapshot) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed) || !parsed.every(isSession)) {
      throw new Error("Unexpected session data shape");
    }

    return parsed
      .map((session) => ({
        ...session,
        commentMode: session.commentMode ?? "normal",
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    throw new SessionStorageError(
      "invalid_data",
      "저장된 내전 데이터를 읽을 수 없습니다.",
      { cause: error },
    );
  }
}

export function getSessionsSnapshot(): string {
  try {
    return getStorage().getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function getServerSessionsSnapshot(): string {
  return "[]";
}

function notifySessionChange(): void {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

function writeSessions(sessions: Session[]): void {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(sessions));
    notifySessionChange();
  } catch (error) {
    if (isQuotaExceeded(error)) {
      throw new SessionStorageError(
        "quota_exceeded",
        "브라우저 저장 공간이 부족합니다. 사용하지 않는 내전을 삭제한 뒤 다시 시도해 주세요.",
        { cause: error },
      );
    }

    if (error instanceof SessionStorageError) {
      throw error;
    }

    throw new SessionStorageError(
      "unavailable",
      "내전 데이터를 저장하지 못했습니다.",
      { cause: error },
    );
  }
}

export function subscribeToSessions(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_CHANGE_EVENT, onStoreChange);
  };
}

export function listSessions(): Session[] {
  return parseSessionsSnapshot(getStorage().getItem(STORAGE_KEY));
}

export function getSession(id: string): Session | null {
  return listSessions().find((session) => session.id === id) ?? null;
}

export function createSession(name?: string): Session {
  const normalizedName = name?.trim();
  const session: Session = {
    id: crypto.randomUUID(),
    name: normalizedName || undefined,
    createdAt: new Date().toISOString(),
    participants: [],
    rounds: [],
    commentMode: "normal",
  };

  writeSessions([session, ...listSessions()]);
  return session;
}

export function updateSession(id: string, update: SessionUpdate): Session {
  const sessions = listSessions();
  const index = sessions.findIndex((session) => session.id === id);

  if (index === -1) {
    throw new SessionStorageError("not_found", "내전을 찾을 수 없습니다.");
  }

  const current = sessions[index];
  const next =
    typeof update === "function"
      ? update(current)
      : { ...current, ...update, id: current.id, createdAt: current.createdAt };

  sessions[index] = next;
  writeSessions(sessions);
  return next;
}

export function updateSessionWrapUp(
  id: string,
  wrapUp: SessionWrapUp,
): Session {
  return updateSession(id, { wrapUp });
}

export function deleteSession(id: string): void {
  writeSessions(listSessions().filter((session) => session.id !== id));
}
