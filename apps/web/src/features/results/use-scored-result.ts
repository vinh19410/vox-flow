import type { ScoreStatusResult, ScoringResult } from "@vox-flow/api/scoring/types";
import { useCallback, useEffect, useState } from "react";

import { trpcClient } from "@/utils/trpc";

/**
 * Why loading failed:
 * - `not_found` / `forbidden`: the attempt does not exist or is not the caller's; reloading cannot help.
 * - `unavailable`: scoring reports done but the result could not be read.
 * - `network`: anything else (connection, server error); reloading may help.
 */
export type ScoredResultError = "not_found" | "forbidden" | "unavailable" | "network";

export type ScoredResultState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; reason: ScoredResultError }
  | { state: "ready"; status: ScoreStatusResult; result: ScoringResult | null };

function errorReason(err: unknown): ScoredResultError {
  if (typeof err === "object" && err !== null && "data" in err) {
    const code = (err as { data?: { code?: unknown } | null }).data?.code;
    if (code === "NOT_FOUND") return "not_found";
    if (code === "FORBIDDEN") return "forbidden";
  }
  return "network";
}

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
    (async () => {
      const [status, first] = await Promise.all([
        trpcClient.scoring.status.query({ attemptId }),
        trpcClient.scoring.getResult.query({ attemptId }),
      ]);
      let result = first;
      // Both reads run in parallel, so the status may already say done while the
      // result read saw the row just before it was written: read it once more.
      if (status.status === "done" && result === null) {
        result = await trpcClient.scoring.getResult.query({ attemptId });
      }
      if (cancelled) return;
      if (status.status === "done" && result === null) {
        setValue({ state: "error", reason: "unavailable" });
        return;
      }
      setValue({ state: "ready", status, result });
    })().catch((err: unknown) => {
      console.warn("Failed to load scoring result:", err);
      if (!cancelled) setValue({ state: "error", reason: errorReason(err) });
    });
    return () => {
      cancelled = true;
    };
  }, [attemptId, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...value, reload };
}
