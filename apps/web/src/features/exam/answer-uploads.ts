import { ENV } from "@/env.public";

import { deleteAudioBlob, listPendingUploads, saveAudioBlob, type AudioBlobRecord } from "./storage";

/** Extra upload tries per answer when flushing before submit (after the original upload). */
export const UPLOAD_RETRIES = 2;
/** Base delay between flush retries; grows linearly per try. */
export const UPLOAD_RETRY_DELAY_MS = 1500;
/** Upper bound for one upload request, so a stalled connection cannot block submit forever. */
const UPLOAD_TIMEOUT_MS = 120_000;

export type AnswerUpload = Omit<AudioBlobRecord, "createdAt">;

export type FlushResult = {
  /** Question keys whose recording is still only on this device (or only in this page's memory). */
  failedQuestionKeys: string[];
  /**
   * True when the recordings kept on this device could not be read, so it is
   * unknown whether some answer from an earlier page load is still missing.
   */
  storageUnreadable: boolean;
};

/** Outcome of one tracked upload; `record` is null when there was nothing to upload. */
type UploadOutcome = { record: AnswerUpload | null; ok: boolean };

/** Upload promises per attempt that have not settled yet; they never reject. */
const inFlight = new Map<string, Set<Promise<UploadOutcome>>>();

/**
 * Recordings per attempt (by question) whose last upload failed, kept in memory
 * so a flush can retry them even if the device copy never committed or was
 * evicted. Only ever holds the newest recording of a question. Cleared once
 * that recording reaches the server.
 */
const failedUploads = new Map<string, Map<string, AnswerUpload>>();

/**
 * The newest recording of one answer in this page. A question can be recorded
 * again from the review screen while an earlier upload of it is still running;
 * the server keeps whichever upload it stored last, so every older recording
 * must be prevented from replacing the newest one.
 */
type AnswerSlot = {
  /** Registration order of the newest recording (higher is newer). */
  ticket: number;
  /** Cancels the upload of the newest recording once it is superseded. */
  controller: AbortController;
  record: AnswerUpload;
  /**
   * An older recording reached the server after the newest was registered, so
   * the server may hold the older one; the newest is re-sent by the next flush.
   */
  mustResend: boolean;
};

const answerSlots = new Map<string, AnswerSlot>();
let nextTicket = 0;

const answerKey = (attemptId: string, questionKey: string) => `${attemptId}::${questionKey}`;

function setFailed(record: AnswerUpload): void {
  const failed = failedUploads.get(record.attemptId);
  if (failed) failed.set(record.questionKey, record);
  else failedUploads.set(record.attemptId, new Map([[record.questionKey, record]]));
}

function clearFailed(attemptId: string, questionKey: string): void {
  const failed = failedUploads.get(attemptId);
  failed?.delete(questionKey);
  if (failed?.size === 0) failedUploads.delete(attemptId);
}

/**
 * Makes `record` the newest recording of its answer unless a recording
 * registered later already is. Cancels the upload it supersedes. Returns the
 * slot when `record` is the newest, null when it is already superseded.
 */
function claimAnswer(record: AnswerUpload, ticket: number): AnswerSlot | null {
  const key = answerKey(record.attemptId, record.questionKey);
  const current = answerSlots.get(key);
  if (current && current.ticket > ticket) return null;
  current?.controller.abort(new DOMException("A newer recording of this answer replaced it", "AbortError"));
  const slot: AnswerSlot = {
    ticket,
    controller: new AbortController(),
    record,
    mustResend: current?.mustResend ?? false,
  };
  answerSlots.set(key, slot);
  return slot;
}

const isNewest = (slot: AnswerSlot) => answerSlots.get(answerKey(slot.record.attemptId, slot.record.questionKey)) === slot;

/**
 * Device-copy writes per answer run one after another, and each checks at run
 * time whether its recording is still the newest. An older recording therefore
 * never overwrites (or deletes) the device copy of a newer one, whatever order
 * the uploads finish in.
 */
const storageQueues = new Map<string, Promise<void>>();

function serializeStorage(attemptId: string, questionKey: string, write: () => Promise<void>): Promise<void> {
  const key = answerKey(attemptId, questionKey);
  const run = (storageQueues.get(key) ?? Promise.resolve()).then(write).catch(() => {});
  storageQueues.set(key, run);
  void run.finally(() => {
    if (storageQueues.get(key) === run) storageQueues.delete(key);
  });
  return run;
}

function track(attemptId: string, upload: Promise<UploadOutcome>): void {
  let set = inFlight.get(attemptId);
  if (!set) {
    set = new Set();
    inFlight.set(attemptId, set);
  }
  set.add(upload);
  void upload.finally(() => {
    set.delete(upload);
    if (set.size === 0 && inFlight.get(attemptId) === set) inFlight.delete(attemptId);
  });
}

function uploadUrl(record: AnswerUpload): string {
  const baseUrl = (ENV.VITE_SERVER_URL ?? "").replace(/\/$/, "");
  const query = new URLSearchParams({
    part: record.part.toString(),
    order: record.order.toString(),
    durationMs: record.durationMs.toString(),
    questionText: record.questionText,
  });
  return `${baseUrl}/api/attempts/${encodeURIComponent(record.attemptId)}/answers/${encodeURIComponent(record.questionKey)}/audio?${query}`;
}

/**
 * Sends one recording to the server; resolves to whether the server confirmed
 * it. Gives up after `UPLOAD_TIMEOUT_MS` so a stalled connection cannot block
 * submit forever, or as soon as `signal` aborts.
 */
async function postAnswerAudio(record: AnswerUpload, signal?: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("Answer upload timed out", "TimeoutError")),
    UPLOAD_TIMEOUT_MS,
  );
  const forwardAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) forwardAbort();
  else signal?.addEventListener("abort", forwardAbort, { once: true });
  try {
    const res = await fetch(uploadUrl(record), {
      method: "POST",
      headers: { "Content-Type": record.mimeType },
      body: record.blob,
      credentials: "include",
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`Answer upload for ${record.questionKey} returned ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Answer upload for ${record.questionKey} failed:`, err);
    return false;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

/**
 * Records the result of uploading the newest recording of an answer: the
 * device copy is dropped only after the server confirmed it, and a failure is
 * remembered so a flush can retry it.
 */
async function settleNewest(slot: AnswerSlot, ok: boolean): Promise<void> {
  const { record } = slot;
  if (!ok || slot.mustResend) setFailed(record);
  else clearFailed(record.attemptId, record.questionKey);
  if (!ok) return;
  await serializeStorage(record.attemptId, record.questionKey, async () => {
    if (isNewest(slot)) await deleteAudioBlob(record.attemptId, record.questionKey);
  });
}

/**
 * An older recording finished uploading after a newer one was registered. A
 * failure is ignored (the newer recording is the answer). A success means the
 * server may now hold the older recording, so the newest one is re-sent by
 * the next flush.
 */
function settleSuperseded(record: AnswerUpload, ok: boolean): void {
  if (!ok) return;
  const newest = answerSlots.get(answerKey(record.attemptId, record.questionKey));
  if (!newest) return;
  newest.mustResend = true;
  setFailed(newest.record);
}

/**
 * Keeps a copy of the recording on the device, then uploads it. The upload is
 * tracked under the attempt from the moment it is registered (even while the
 * recording is still being finalised), so submitting the attempt can wait for
 * it instead of racing it. A recording registered later for the same question
 * supersedes this one: its upload is cancelled and its result no longer
 * counts. Resolves to whether the server stored this recording as the answer
 * (true when there was nothing to upload, false once superseded); never
 * rejects.
 */
export function trackAnswerUpload(
  attemptId: string,
  recording: Promise<AnswerUpload | null> | AnswerUpload,
): Promise<boolean> {
  const ticket = (nextTicket += 1);
  const upload = (async (): Promise<UploadOutcome> => {
    const record = await recording;
    if (!record) return { record: null, ok: true };
    const slot = claimAnswer(record, ticket);
    if (!slot) return { record, ok: false };
    await serializeStorage(record.attemptId, record.questionKey, async () => {
      if (isNewest(slot)) await saveAudioBlob(record);
    });
    if (!isNewest(slot)) return { record, ok: false };
    const ok = await postAnswerAudio(record, slot.controller.signal);
    if (!isNewest(slot)) {
      settleSuperseded(record, ok);
      return { record, ok: false };
    }
    await settleNewest(slot, ok);
    return { record, ok };
  })().catch((err: unknown): UploadOutcome => {
    // The recorder never produced a recording, so there is nothing to retry.
    console.warn("Answer upload could not start:", err);
    return { record: null, ok: false };
  });
  track(attemptId, upload);
  return upload.then((outcome) => outcome.ok);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Makes sure every recording of the attempt reached the server before it is
 * submitted: waits for uploads still in flight, then retries (a bounded number
 * of times) every recording that has not reached the server, whether it is
 * kept on this device (including ones left over from before a page reload) or
 * only in this page's memory because the device copy was never stored.
 */
export async function flushAnswerUploads(
  attemptId: string,
  options: { retries?: number; retryDelayMs?: number } = {},
): Promise<FlushResult> {
  const { retries = UPLOAD_RETRIES, retryDelayMs = UPLOAD_RETRY_DELAY_MS } = options;

  await Promise.all([...(inFlight.get(attemptId) ?? [])]);

  // Device copies first; a failed upload remembered in memory wins, and the
  // newest recording of a question in this page wins over both, so a flush
  // never re-sends a recording that was replaced.
  const toRetry = new Map<string, AnswerUpload>();
  let storageUnreadable = false;
  try {
    for (const record of await listPendingUploads(attemptId)) toRetry.set(record.questionKey, record);
  } catch (err) {
    console.warn("Could not read the recordings kept on this device:", err);
    storageUnreadable = true;
  }
  for (const record of failedUploads.get(attemptId)?.values() ?? []) toRetry.set(record.questionKey, record);
  for (const questionKey of toRetry.keys()) {
    const slot = answerSlots.get(answerKey(attemptId, questionKey));
    if (slot) toRetry.set(questionKey, slot.record);
  }

  const outcomes = await Promise.all(
    [...toRetry.values()].map(async (record) => {
      const key = answerKey(record.attemptId, record.questionKey);
      const slot = answerSlots.get(key);
      for (let attempt = 1; attempt <= retries; attempt += 1) {
        if (attempt > 1) await wait(retryDelayMs * (attempt - 1));
        // Re-recorded meanwhile: that upload owns the answer now, and it has not
        // been waited for, so report the question as not uploaded yet.
        if (slot && !isNewest(slot)) return record.questionKey;
        const ok = await postAnswerAudio(record, slot?.controller.signal);
        if (slot && !isNewest(slot)) {
          settleSuperseded(record, ok);
          return record.questionKey;
        }
        if (!ok) continue;
        if (slot) slot.mustResend = false;
        clearFailed(record.attemptId, record.questionKey);
        await serializeStorage(record.attemptId, record.questionKey, async () => {
          if (slot ? isNewest(slot) : !answerSlots.has(key)) await deleteAudioBlob(record.attemptId, record.questionKey);
        });
        return null;
      }
      return record.questionKey;
    }),
  );
  return {
    failedQuestionKeys: outcomes.filter((key): key is string => key !== null),
    storageUnreadable,
  };
}
