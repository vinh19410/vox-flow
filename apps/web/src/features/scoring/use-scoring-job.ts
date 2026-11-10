import { useCallback, useEffect, useRef, useState } from "react";

import type { ScoringJob } from "@/features/app-state/types";
import { trpcClient } from "@/utils/trpc";

export const POLL_INTERVAL_MS = 2500;
/** Consecutive failed status checks before polling stops and asks the user to retry. */
export const MAX_POLL_ERRORS = 3;
/** Polls an already-submitted attempt may stay "not_scored" before it is treated as failed. */
export const MAX_NOT_SCORED_POLLS = 4;

export type ScoringView =
  | { kind: "submitting" }
  | { kind: "submit_error" }
  | { kind: "in_progress"; status: "queued" | "processing" }
  | { kind: "failed" }
  | { kind: "connection_error" }
  | { kind: "not_scorable" }
  | { kind: "done" };

export interface ScoringJobHandlers {
  /** Called once the server has accepted the submission. */
  onSubmitted: (attemptId: string) => void;
  /** Called once scoring is done. */
  onDone: (attemptId: string) => void;
  /** Called when the server reports the attempt is not scored in this mode. */
  onNotScorable: (attemptId: string) => void;
}

export interface ScoringJobValue {
  view: ScoringView;
  busy: boolean;
  actionError: string | null;
  /** Re-submits after a failed submit (falls back to re-enqueueing if already submitted). */
  resubmit: () => Promise<void>;
  /** Asks the server to score a failed attempt again, then resumes polling. */
  retryScoring: () => Promise<void>;
  /** Resumes polling after repeated connection errors. */
  resumePolling: () => void;
}

/** tRPC client errors carry the server error code in `data.code`. */
function isAlreadySubmittedError(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("data" in err)) return false;
  const data = (err as { data?: unknown }).data;
  return typeof data === "object" && data !== null && (data as { code?: unknown }).code === "BAD_REQUEST";
}

const QUEUED: ScoringView = { kind: "in_progress", status: "queued" };

/**
 * Drives a forecast practice attempt from submit to a final scoring state:
 * submit (with recovery) → poll `scoring.status` every POLL_INTERVAL_MS until
 * done/failed → hand off to the caller. Polling stops on unmount.
 */
export function useScoringJob(job: ScoringJob | null, handlers: ScoringJobHandlers): ScoringJobValue {
  const attemptId = job?.attemptId ?? null;
  const [view, setView] = useState<ScoringView>(() => (job?.submitted ? QUEUED : { kind: "submitting" }));
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  // Survives StrictMode's simulated unmount/remount, unlike an effect-local flag.
  const mountedRef = useRef(true);
  const submitStartedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const markSubmitted = useCallback((id: string) => {
    handlersRef.current.onSubmitted(id);
  }, []);

  // Initial submit. The attempt stays saved server-side whatever happens here.
  useEffect(() => {
    if (!attemptId || job?.submitted || submitStartedRef.current) return;
    submitStartedRef.current = true;

    void (async () => {
      try {
        await trpcClient.attempt.submit.mutate({ attemptId });
        if (!mountedRef.current) return;
        markSubmitted(attemptId);
        setView(QUEUED);
      } catch (submitErr) {
        console.warn("Attempt submit failed:", submitErr);
        // A lost response may hide a successful submit: trust the server state.
        try {
          const st = await trpcClient.scoring.status.query({ attemptId });
          if (!mountedRef.current) return;
          if (!st.scorable) {
            setView({ kind: "not_scorable" });
          } else if (st.status === "not_scored") {
            setView({ kind: "submit_error" });
          } else {
            markSubmitted(attemptId);
            setView(st.status === "failed" ? { kind: "failed" } : QUEUED);
          }
        } catch {
          if (mountedRef.current) setView({ kind: "submit_error" });
        }
      }
    })();
  }, [attemptId, job?.submitted, markSubmitted]);

  const polling = view.kind === "in_progress";

  useEffect(() => {
    if (!attemptId || !polling) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let errors = 0;
    let notScored = 0;

    const tick = async () => {
      try {
        const st = await trpcClient.scoring.status.query({ attemptId });
        if (cancelled) return;
        errors = 0;
        if (!st.scorable) {
          setView({ kind: "not_scorable" });
          handlersRef.current.onNotScorable(attemptId);
          return;
        }
        if (st.status === "done") {
          setView({ kind: "done" });
          handlersRef.current.onDone(attemptId);
          return;
        }
        if (st.status === "failed") {
          setView({ kind: "failed" });
          return;
        }
        if (st.status === "not_scored") {
          notScored += 1;
          if (notScored >= MAX_NOT_SCORED_POLLS) {
            setView({ kind: "failed" });
            return;
          }
        } else {
          const status = st.status;
          setView((v) => (v.kind === "in_progress" && v.status === status ? v : { kind: "in_progress", status }));
        }
      } catch (err) {
        if (cancelled) return;
        errors += 1;
        console.warn("Scoring status check failed:", err);
        if (errors >= MAX_POLL_ERRORS) {
          setView({ kind: "connection_error" });
          return;
        }
      }
      timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [attemptId, polling]);

  const retryScoring = useCallback(async () => {
    if (!attemptId) return;
    setBusy(true);
    setActionError(null);
    try {
      await trpcClient.scoring.retry.mutate({ attemptId });
      if (mountedRef.current) setView(QUEUED);
    } catch (err) {
      console.warn("Scoring retry failed:", err);
      if (mountedRef.current) setActionError("Chưa gửi được yêu cầu chấm lại. Vui lòng thử lại sau ít phút.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [attemptId]);

  const resubmit = useCallback(async () => {
    if (!attemptId) return;
    setBusy(true);
    setActionError(null);
    try {
      try {
        await trpcClient.attempt.submit.mutate({ attemptId });
      } catch (err) {
        if (!isAlreadySubmittedError(err)) throw err;
        // Already submitted on the server but never queued: enqueue scoring instead.
        await trpcClient.scoring.retry.mutate({ attemptId });
      }
      if (!mountedRef.current) return;
      markSubmitted(attemptId);
      setView(QUEUED);
    } catch (err) {
      console.warn("Attempt resubmit failed:", err);
      if (mountedRef.current) setActionError("Vẫn chưa gửi được bài. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [attemptId, markSubmitted]);

  const resumePolling = useCallback(() => {
    setActionError(null);
    setView(QUEUED);
  }, []);

  return { view, busy, actionError, resubmit, retryScoring, resumePolling };
}
