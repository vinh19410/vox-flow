import { useEffect, useRef } from "react";

import { trpcClient } from "@/utils/trpc";

import { createInitialState } from "./initial-state";
import type { AppState } from "./types";

export interface UserHydrationProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export type UserHydrationInput = string | UserHydrationProfile | null | undefined;

export function useProfileHydration(
  userInput: UserHydrationInput,
  set: (
    update: Partial<AppState> | ((prev: AppState) => Partial<AppState>),
  ) => void,
) {
  const hydratedUserRef = useRef<string | null>(null);
  const isObject = typeof userInput === "object" && userInput !== null;
  const uid = typeof userInput === "string" ? userInput : userInput?.id ?? null;
  const userName = isObject ? userInput.name : undefined;
  const userEmail = isObject ? userInput.email : undefined;

  useEffect(() => {
    // Session is pending/loading: do not touch state
    if (userInput === undefined) return;

    if (!uid) {
      hydratedUserRef.current = null;
      // Real logout: reset server/user-owned fields but preserve UI preferences (mode, voice)
      set((prev) => ({
        ...createInitialState(),
        mode: prev.mode,
        voice: prev.voice,
      }));
      return;
    }

    if (userName !== undefined || userEmail !== undefined) {
      set((prev) => ({
        name: userName ?? prev.name,
        email: userEmail ?? prev.email,
      }));
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

        if (trpcClient?.privacy?.getConsent?.query) {
          try {
            const consent = await trpcClient.privacy.getConsent.query();
            if (consent && !cancelled) {
              set({
                consent: {
                  save: consent.save ?? true,
                  calibration: consent.calibration ?? false,
                  train: consent.train ?? false,
                },
              });
            }
          } catch {
            // Non-blocking in offline / test environments
          }
        }
      } catch {
        // Non-blocking in offline / test environments
      }
    }

    void hydrateProfile();

    return () => {
      cancelled = true;
    };
  }, [uid, userName, userEmail, userInput, set]);
}
