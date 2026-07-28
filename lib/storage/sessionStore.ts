import type { Session } from "@/lib/types";

// D-01: localStorage only, UUID 세션 식별
const STORAGE_KEY = "teamgap.sessions.v1";

export class SessionStorageFullError extends Error {
  constructor() {
    super("localStorage 용량이 가득 차 세션을 저장하지 못했습니다.");
    this.name = "SessionStorageFullError";
  }
}

type SessionMap = Record<string, Session>;

const CHANGE_EVENT = "teamgap:sessions-changed";

function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

export function parseSessionMap(raw: string | null): SessionMap {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SessionMap;
  } catch {
    return {};
  }
}

export function getSessionsRawSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

// storage 이벤트(다른 탭) + 커스텀 이벤트(같은 탭 쓰기) 모두 구독
export function subscribeSessions(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readAll(): SessionMap {
  if (typeof window === "undefined") return {};
  return parseSessionMap(getSessionsRawSnapshot());
}

function writeAll(sessions: SessionMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    if (isQuotaExceeded(error)) throw new SessionStorageFullError();
    throw error;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function createSession(name?: string): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    participants: [],
    preTeamProposal: null,
    rounds: [],
    commentMode: "normal",
    ...(name?.trim() ? { name: name.trim() } : {}),
  };

  const sessions = readAll();
  sessions[session.id] = session;
  writeAll(sessions);
  return session;
}

export function getSession(id: string): Session | null {
  return readAll()[id] ?? null;
}

// 최신 생성 순
export function listSessions(): Session[] {
  return Object.values(readAll()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function updateSession(
  id: string,
  patch: Partial<Omit<Session, "id" | "createdAt">>,
): Session | null {
  const sessions = readAll();
  const current = sessions[id];
  if (!current) return null;

  const next: Session = { ...current, ...patch, id: current.id, createdAt: current.createdAt };
  sessions[id] = next;
  writeAll(sessions);
  return next;
}

export function deleteSession(id: string): void {
  const sessions = readAll();
  if (!(id in sessions)) return;
  delete sessions[id];
  writeAll(sessions);
}
