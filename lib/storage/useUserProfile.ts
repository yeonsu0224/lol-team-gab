"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { UserProfile } from "@/lib/types";
import {
  parseUserProfile,
  saveUserProfile,
  USER_PROFILE_EVENT,
  USER_PROFILE_STORAGE_KEY,
} from "./userProfile";

export function useUserProfile() {
  const raw = useSyncExternalStore<string | null>(
    (onStoreChange) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === USER_PROFILE_STORAGE_KEY) onStoreChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(USER_PROFILE_EVENT, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(USER_PROFILE_EVENT, onStoreChange);
      };
    },
    () => window.localStorage.getItem(USER_PROFILE_STORAGE_KEY) ?? "{}",
    () => null,
  );
  const profile = useMemo(() => parseUserProfile(raw), [raw]);

  return {
    profile,
    hydrated: raw !== null,
    save(next: UserProfile) {
      return saveUserProfile(next);
    },
  };
}
