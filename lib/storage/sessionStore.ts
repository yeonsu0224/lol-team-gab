import type { NewSession, RoundNumber, RoundRecord, Session } from "@/lib/types";

export const SESSION_STORAGE_KEY = "team-gap:sessions:v3";
export const SESSION_STORE_EVENT = "team-gap:sessions-changed";

export class SessionStorageError extends Error {
  constructor(
    message: string,
    public readonly code: "unavailable" | "quota_exceeded" | "invalid_data",
  ) {
    super(message);
    this.name = "SessionStorageError";
  }
}

function storage(): Storage {
  if (typeof window === "undefined") {
    throw new SessionStorageError("브라우저에서만 세션을 저장할 수 있습니다.", "unavailable");
  }
  return window.localStorage;
}

function notify(): void {
  window.dispatchEvent(new Event(SESSION_STORE_EVENT));
}

/**
 * Parses a raw storage snapshot. Kept free of `window` so that render paths can
 * derive state from a snapshot instead of re-reading storage.
 */
export function parseSessions(raw: string | null): Session[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed.filter(isSession);
  } catch {
    throw new SessionStorageError("저장된 세션 데이터를 읽을 수 없습니다.", "invalid_data");
  }
}

function readAll(): Session[] {
  return parseSessions(storage().getItem(SESSION_STORAGE_KEY));
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.participants) &&
    Array.isArray(candidate.rounds)
  );
}

function writeAll(sessions: Session[]): void {
  try {
    storage().setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    notify();
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      throw new SessionStorageError(
        "브라우저 저장 공간이 부족합니다. 오래된 세션을 삭제한 뒤 다시 시도해 주세요.",
        "quota_exceeded",
      );
    }
    throw new SessionStorageError("세션을 저장하지 못했습니다.", "unavailable");
  }
}

export function listSessions(): Session[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSession(id: string): Session | null {
  return readAll().find((session) => session.id === id) ?? null;
}

export function createSession(input: NewSession = {}): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    name: input.name?.trim() || undefined,
    createdAt: new Date().toISOString(),
    participants: input.participants ?? [],
    rounds: [],
    commentMode: "normal",
  };
  writeAll([session, ...readAll()]);
  return session;
}

export function updateSession(
  id: string,
  update: Partial<Omit<Session, "id" | "createdAt">> | ((session: Session) => Session),
): Session {
  const sessions = readAll();
  const index = sessions.findIndex((session) => session.id === id);
  if (index < 0) throw new SessionStorageError("세션을 찾을 수 없습니다.", "invalid_data");

  const current = sessions[index];
  const next =
    typeof update === "function"
      ? update(current)
      : { ...current, ...update, id: current.id, createdAt: current.createdAt };
  sessions[index] = next;
  writeAll(sessions);
  return next;
}

export function deleteSession(id: string): boolean {
  const sessions = readAll();
  const next = sessions.filter((session) => session.id !== id);
  if (next.length === sessions.length) return false;
  writeAll(next);
  return true;
}

export function getRound(sessionId: string, round: RoundNumber): RoundRecord | null {
  return getSession(sessionId)?.rounds.find((record) => record.round === round) ?? null;
}

export function addRound(sessionId: string, record: RoundRecord): Session {
  return updateSession(sessionId, (session) => {
    if (session.rounds.length >= 3) {
      throw new SessionStorageError("시험 판은 최대 3판까지 저장할 수 있습니다.", "invalid_data");
    }
    if (session.rounds.some(({ round }) => round === record.round)) {
      throw new SessionStorageError("이미 저장된 판입니다. 수정 기능을 사용해 주세요.", "invalid_data");
    }
    if (record.round !== session.rounds.length + 1) {
      throw new SessionStorageError("시험 판은 1판부터 순서대로 저장해 주세요.", "invalid_data");
    }
    return { ...session, rounds: [...session.rounds, record] };
  });
}

export function updateRound(
  sessionId: string,
  round: RoundNumber,
  record: RoundRecord,
): Session {
  return updateSession(sessionId, (session) => {
    const index = session.rounds.findIndex((item) => item.round === round);
    if (index < 0) {
      throw new SessionStorageError("수정할 시험 판을 찾을 수 없습니다.", "invalid_data");
    }
    const rounds = [...session.rounds];
    rounds[index] = { ...record, round };
    return { ...session, rounds };
  });
}
