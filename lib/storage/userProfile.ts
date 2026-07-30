import type { UserProfile } from "@/lib/types";

export const USER_PROFILE_KEY = "team-gap:user-profile:v1";
export const USER_PROFILE_EVENT = "team-gap:user-profile-changed";

export function parseUserProfile(raw: string | null): UserProfile {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as UserProfile;
    return {
      displayName: clean(value.displayName),
      riotId: clean(value.riotId),
      myPuuid: clean(value.myPuuid),
    };
  } catch {
    return {};
  }
}

export function saveUserProfile(profile: UserProfile): UserProfile {
  const next = parseUserProfile(JSON.stringify(profile));
  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(USER_PROFILE_EVENT));
  return next;
}

function clean(value?: string): string | undefined {
  return value?.trim() || undefined;
}
