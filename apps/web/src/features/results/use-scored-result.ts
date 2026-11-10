import type { ScoreStatusResult, ScoringResult } from "@vox-flow/api/scoring/types";
import { useCallback, useEffect, useState } from "react";

import { trpcClient } from "@/utils/trpc";

export type ScoredResultState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; status: ScoreStatusResult; result: ScoringResult | null };

/** Loads the scoring status and (when done) the scored result of a server attempt. */
export function useScoredResult(attemptId: string, enabled: boolean): ScoredResultState & { reload: () => void } {
  const [value, setValue] = useState<ScoredResultState>(() => (enabled ? { state: "loading" } : { state: "idle" }));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue({ state: "idle" });
      return;
    }
    let cancelled = false;
    setValue({ state: "loading" });
    Promise.all([
      trpcClient.scoring.status.query({ attemptId }),
      trpcClient.scoring.getResult.query({ attemptId }),
    ])
      .then(([status, result]) => {
        if (!cancelled) setValue({ state: "ready", status, result });
      })
      .catch((err: unknown) => {
        console.warn("Failed to load scoring result:", err);
        if (!cancelled) setValue({ state: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attemptId, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...value, reload };
}
