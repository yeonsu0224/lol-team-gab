import type { NewSession, Session } from "@/lib/types";

export const SESSION_STORAGE_KEY = "team-gap:sessions:v4";
export const SESSION_STORE_EVENT = "team-gap:sessions-changed";

export class StorageError extends Error {
  constructor(message: string, public readonly code: "unavailable" | "quota" | "invalid") {
    super(message);
    this.name = "StorageError";
  }
}

export function parseSessions(raw: string | null): Session[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) throw new Error("not array");
    return value.filter(isSession).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    throw new StorageError("저장된 세션 데이터를 읽을 수 없습니다.", "invalid");
  }
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Session>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    Array.isArray(item.participants) &&
    Array.isArray(item.rounds)
  );
}

function storage(): Storage {
  if (typeof window === "undefined") throw new StorageError("브라우저 저장소를 사용할 수 없습니다.", "unavailable");
  return window.localStorage;
}

function read(): Session[] {
  return parseSessions(storage().getItem(SESSION_STORAGE_KEY));
}

function write(sessions: Session[]) {
  try {
    storage().setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new Event(SESSION_STORE_EVENT));
  } catch (cause) {
    if (cause instanceof DOMException && cause.name.includes("Quota")) {
      throw new StorageError("저장 공간이 부족합니다. 오래된 세션을 삭제해 주세요.", "quota");
    }
    throw new StorageError("세션을 저장하지 못했습니다.", "unavailable");
  }
}

export function listSessions(): Session[] {
  return read();
}

export function createSession(input: NewSession = {}): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    name: input.name?.trim() || "새 내전",
    createdAt: new Date().toISOString(),
    participants: input.participants ?? [],
    rounds: [],
    commentMode: "normal",
  };
  write([session, ...read()]);
  return session;
}

export function updateSession(
  id: string,
  update: Partial<Omit<Session, "id" | "createdAt">> | ((current: Session) => Session),
): Session {
  const sessions = read();
  const index = sessions.findIndex((item) => item.id === id);
  if (index < 0) throw new StorageError("세션을 찾을 수 없습니다.", "invalid");
  const current = sessions[index];
  sessions[index] =
    typeof update === "function"
      ? update(current)
      : { ...current, ...update, id: current.id, createdAt: current.createdAt };
  write(sessions);
  return sessions[index];
}

export function deleteSession(id: string): boolean {
  const sessions = read();
  const next = sessions.filter((item) => item.id !== id);
  if (next.length === sessions.length) return false;
  write(next);
  return true;
}
