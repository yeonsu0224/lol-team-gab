import type { UserProfile } from "@/lib/types";

export const USER_PROFILE_STORAGE_KEY = "team-gap:user-profile:v1";
export const USER_PROFILE_EVENT = "team-gap:user-profile-changed";

/** Parses a raw storage snapshot without touching `window`. */
export function parseUserProfile(raw: string | null): UserProfile {
  if (!raw) return {};

  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" ? sanitize(value as UserProfile) : {};
  } catch {
    return {};
  }
}

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return {};
  return parseUserProfile(window.localStorage.getItem(USER_PROFILE_STORAGE_KEY));
}

export function saveUserProfile(profile: UserProfile): UserProfile {
  if (typeof window === "undefined") {
    throw new Error("브라우저에서만 프로필을 저장할 수 있습니다.");
  }
  const next = sanitize(profile);
  try {
    window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    throw new Error("프로필을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
  }
  window.dispatchEvent(new Event(USER_PROFILE_EVENT));
  return next;
}

export function updateUserProfile(update: Partial<UserProfile>): UserProfile {
  return saveUserProfile({ ...getUserProfile(), ...update });
}

function sanitize(profile: UserProfile): UserProfile {
  return {
    displayName: clean(profile.displayName),
    riotId: clean(profile.riotId),
    myPuuid: clean(profile.myPuuid),
  };
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
