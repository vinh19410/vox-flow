import { useEffect, useRef } from "react";

import { trpcClient } from "@/utils/trpc";

import type { AppState } from "./types";

export function useProfileHydration(
  uid: string | null,
  set: (
    update: Partial<AppState> | ((prev: AppState) => Partial<AppState>),
  ) => void,
) {
  const hydratedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uid) {
      hydratedUserRef.current = null;
      set({ target: 7.0, examDate: null });
      return;
    }

    if (hydratedUserRef.current === uid) return;

    let cancelled = false;

    async function hydrateProfile() {
      try {
        if (!trpcClient?.profile?.get?.query) return;

        let profile = null;
        try {
          profile = await trpcClient.profile.get.query();
        } catch {
          // Network or server error: do not mark hydrated so it can retry later
          return;
        }

        if (cancelled) return;

        hydratedUserRef.current = uid;
        if (profile) {
          set({
            target: profile.targetBand,
            examDate: profile.examDate ?? null,
          });
        } else {
          set({ target: 7.0, examDate: null });
        }
      } catch {
        // Non-blocking in offline / test environments
      }
    }

    void hydrateProfile();

    return () => {
      cancelled = true;
    };
  }, [uid, set]);
}
