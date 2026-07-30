"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { UserProfile } from "@/lib/types";
import {
  parseUserProfile,
  saveUserProfile,
  USER_PROFILE_EVENT,
  USER_PROFILE_KEY,
} from "./userProfile";

export function useUserProfile() {
  const raw = useSyncExternalStore<string | null>(
    (notify) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === USER_PROFILE_KEY) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(USER_PROFILE_EVENT, notify);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(USER_PROFILE_EVENT, notify);
      };
    },
    () => window.localStorage.getItem(USER_PROFILE_KEY) ?? "{}",
    () => null,
  );

  return {
    profile: useMemo(() => parseUserProfile(raw), [raw]),
    hydrated: raw !== null,
    save(profile: UserProfile) {
      return saveUserProfile(profile);
    },
  };
}
