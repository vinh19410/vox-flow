import { useCallback, useEffect, useRef, useState } from "react";

import type { ScoringJob } from "@/features/app-state/types";
import { flushAnswerUploads } from "@/features/exam/answer-uploads";
import { trpcClient } from "@/utils/trpc";

/** Poll interval for the first minute, when most attempts finish. */
export const POLL_INTERVAL_MS = 2500;
/** Poll interval after the first minute. */
export const POLL_BACKOFF_INTERVAL_MS = 5000;
/** Poll interval once scoring has taken more than three minutes. */
export const POLL_MAX_INTERVAL_MS = 10_000;
/** After this long without a final state, polling stops and the screen says scoring is slow. */
export const SLOW_SCORING_AFTER_MS = 10 * 60 * 1000;

/** Delay before the next status check, backing off the longer scoring takes. */
export function pollDelayMs(elapsedMs: number): number {
  if (elapsedMs < 60_000) return POLL_INTERVAL_MS;
  if (elapsedMs < 3 * 60_000) return POLL_BACKOFF_INTERVAL_MS;
  return POLL_MAX_INTERVAL_MS;
}
/** Consecutive failed status checks before polling stops and asks the user to retry. */
export const MAX_POLL_ERRORS = 3;
/** Polls an already-submitted attempt may stay "not_scored" before it is treated as failed. */
export const MAX_NOT_SCORED_POLLS = 4;

export type ScoringView =
  | { kind: "submitting" }
  | { kind: "submit_error" }
  /**
   * Some recordings never reached the server; they are still stored on this
   * device. `missing` is 0 when the device copies could not be read, so it is
   * unknown whether anything is missing.
   */
  | { kind: "upload_error"; missing: number }
  | { kind: "in_progress"; status: "queued" | "processing" }
  | { kind: "failed"; manualRetries?: number; canRetry?: boolean }
  | { kind: "connection_error" }
  /** Still queued/processing after SLOW_SCORING_AFTER_MS; polling paused until the user checks again. */
  | { kind: "slow" }
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
  /**
   * Re-sends any recordings still on the device, then re-submits. If the attempt
   * was already submitted, resumes polling, or re-enqueues scoring when it failed.
   */
  resubmit: () => Promise<void>;
  /** Submits with only the recordings the server already has, after the learner chose to. */
  submitWithoutMissing: () => Promise<void>;
  /** Asks the server to score a failed attempt again, then resumes polling. */
  retryScoring: () => Promise<void>;
  /** Resumes polling after repeated connection errors or a slow-scoring pause. */
  resumePolling: () => void;
}

/** Must match ATTEMPT_ALREADY_SUBMITTED_MESSAGE in packages/api/src/routers/attempt.ts. */
export const ATTEMPT_ALREADY_SUBMITTED_MESSAGE = "Attempt is already submitted";

/** Must match the retry rejection messages in packages/api/src/routers/scoring.ts. */
export const DAILY_RETRY_LIMIT_EXCEEDED = "DAILY_RETRY_LIMIT_EXCEEDED";
export const RETRY_LIMIT_EXCEEDED = "RETRY_LIMIT_EXCEEDED";

export const DAILY_RETRY_LIMIT_MESSAGE =
  "Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai.";
export const RETRY_LIMIT_MESSAGE = "Bài thi đã hết số lần thử lại cho phép.";

/** Server retry-quota codes; any other error keeps the generic wording. */
function retryLimitMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  if (err.message === DAILY_RETRY_LIMIT_EXCEEDED) return DAILY_RETRY_LIMIT_MESSAGE;
  if (err.message === RETRY_LIMIT_EXCEEDED) return RETRY_LIMIT_MESSAGE;
  return null;
}

/**
 * True only for the server's "already submitted" rejection. Other BAD_REQUESTs
 * (e.g. an abandoned attempt) must surface as errors, not trigger a re-score.
 * tRPC client errors carry the server error code in `data.code`.
 */
export function isAlreadySubmittedError(err: unknown): boolean {
  if (!(err instanceof Error) || !("data" in err)) return false;
  const data = (err as { data?: unknown }).data;
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { code?: unknown }).code === "BAD_REQUEST" &&
    err.message === ATTEMPT_ALREADY_SUBMITTED_MESSAGE
  );
}

/** True for any other tRPC BAD_REQUEST rejection — a permanent, non-network failure. */
export function isBadRequestError(err: unknown): boolean {
  if (!(err instanceof Error) || !("data" in err)) return false;
  const data: unknown = err.data;
  return typeof data === "object" && data !== null && "code" in data && data.code === "BAD_REQUEST";
}

const QUEUED: ScoringView = { kind: "in_progress", status: "queued" };

/** Maps a status result onto the failed view, carrying the retry budget for the screen. */
function failedView(st: { manualRetries?: number; canRetry?: boolean }): ScoringView {
  return {
    kind: "failed",
    manualRetries: st.manualRetries ?? 0,
    canRetry: st.canRetry ?? (st.manualRetries ?? 0) < 1,
  };
}

/**
 * Drives a forecast practice attempt from submit to a final scoring state:
 * upload check → submit (with recovery) → poll `scoring.status`, backing off
 * from POLL_INTERVAL_MS, until done/failed → hand off to the caller. Polling
 * pauses after SLOW_SCORING_AFTER_MS and stops on unmount.
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

  /**
   * Waits for (and retries) the attempt's answer uploads. Returns false and
   * shows the upload error when some recording is still only on this device,
   * so the attempt is never scored on a silently incomplete set of answers.
   */
  const ensureUploaded = useCallback(async (id: string): Promise<boolean> => {
    const { failedQuestionKeys, storageUnreadable } = await flushAnswerUploads(id);
    if (failedQuestionKeys.length === 0 && !storageUnreadable) return true;
    if (mountedRef.current) setView({ kind: "upload_error", missing: failedQuestionKeys.length });
    return false;
  }, []);

  // Initial submit. The attempt stays saved server-side whatever happens here.
  useEffect(() => {
    if (!attemptId || job?.submitted || submitStartedRef.current) return;
    submitStartedRef.current = true;

    void (async () => {
      if (!(await ensureUploaded(attemptId))) return;
      if (!mountedRef.current) return;
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
            setView(st.status === "failed" ? failedView(st) : QUEUED);
          }
        } catch {
          if (mountedRef.current) setView({ kind: "submit_error" });
        }
      }
    })();
  }, [attemptId, job?.submitted, markSubmitted, ensureUploaded]);

  const polling = view.kind === "in_progress";

  useEffect(() => {
    if (!attemptId || !polling) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let errors = 0;
    let notScored = 0;
    const startedAt = Date.now();

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
          setView(failedView(st));
          return;
        }
        if (st.status === "not_scored") {
          notScored += 1;
          if (notScored >= MAX_NOT_SCORED_POLLS) {
            setView(failedView(st));
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
      const elapsed = Date.now() - startedAt;
      if (elapsed >= SLOW_SCORING_AFTER_MS) {
        setView({ kind: "slow" });
        return;
      }
      timer = setTimeout(() => void tick(), pollDelayMs(elapsed));
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
      if (mountedRef.current) {
        setActionError(retryLimitMessage(err) ?? "Chưa gửi được yêu cầu chấm lại. Vui lòng thử lại sau ít phút.");
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [attemptId]);

  const sendSubmit = useCallback(
    async (checkUploads: boolean) => {
      if (!attemptId) return;
      setBusy(true);
      setActionError(null);
      try {
        if (checkUploads && !(await ensureUploaded(attemptId))) {
          if (mountedRef.current) {
            setActionError("Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại.");
          }
          return;
        }
        try {
          await trpcClient.attempt.submit.mutate({ attemptId });
        } catch (err) {
          if (!isAlreadySubmittedError(err)) throw err;
          // An earlier submit went through but its response was lost. The server
          // only accepts a retry for a failed or unscored attempt, so ask where
          // scoring stands first; polling takes over for queued, processing,
          // done and unscorable attempts.
          const st = await trpcClient.scoring.status.query({ attemptId });
          if (st.scorable && st.status === "not_scored") {
            // Rescue path: the score row never existed, so the server re-enqueues
            // without spending any of the learner's manual-retry budget.
            await trpcClient.scoring.retry.mutate({ attemptId });
          } else if (st.scorable && st.status === "failed") {
            // Auto-retrying a failed attempt would silently spend its single
            // manual retry. Keep retrying an explicit choice: show the failed
            // state (with its budget) directly instead of flashing "queued".
            if (!mountedRef.current) return;
            markSubmitted(attemptId);
            setView(failedView(st));
            return;
          }
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
    },
    [attemptId, markSubmitted, ensureUploaded],
  );

  const resubmit = useCallback(() => sendSubmit(true), [sendSubmit]);
  const submitWithoutMissing = useCallback(() => sendSubmit(false), [sendSubmit]);

  const resumePolling = useCallback(() => {
    setActionError(null);
    setView(QUEUED);
  }, []);

  return { view, busy, actionError, resubmit, submitWithoutMissing, retryScoring, resumePolling };
}
