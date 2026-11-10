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
  /** Question keys whose recording is still only on this device. */
  failedQuestionKeys: string[];
};

/** Upload promises per attempt that have not settled yet; they never reject. */
const inFlight = new Map<string, Set<Promise<boolean>>>();

function track(attemptId: string, upload: Promise<boolean>): void {
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
 * Sends one recording to the server. The local copy is deleted only after the
 * server confirmed it, so a failed upload can always be retried.
 */
async function postAnswerAudio(record: AnswerUpload): Promise<boolean> {
  try {
    const res = await fetch(uploadUrl(record), {
      method: "POST",
      headers: { "Content-Type": record.mimeType },
      body: record.blob,
      credentials: "include",
      signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(UPLOAD_TIMEOUT_MS) : undefined,
    });
    if (!res.ok) {
      console.warn(`Answer upload for ${record.questionKey} returned ${res.status}`);
      return false;
    }
  } catch (err) {
    console.warn(`Answer upload for ${record.questionKey} failed:`, err);
    return false;
  }
  await deleteAudioBlob(record.attemptId, record.questionKey).catch(() => {});
  return true;
}

/**
 * Keeps a copy of the recording on the device, then uploads it. The upload is
 * tracked under the attempt from the moment it is registered (even while the
 * recording is still being finalised), so submitting the attempt can wait for
 * it instead of racing it. Resolves to whether the server stored the recording
 * (true when there was nothing to upload); never rejects.
 */
export function trackAnswerUpload(
  attemptId: string,
  recording: Promise<AnswerUpload | null> | AnswerUpload,
): Promise<boolean> {
  const upload = (async () => {
    const record = await recording;
    if (!record) return true;
    await saveAudioBlob(record).catch(() => {});
    return postAnswerAudio(record);
  })().catch((err: unknown) => {
    console.warn("Answer upload could not start:", err);
    return false;
  });
  track(attemptId, upload);
  return upload;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Makes sure every recording of the attempt reached the server before it is
 * submitted: waits for uploads still in flight, then retries (a bounded number
 * of times) any recording that is still only stored on this device, including
 * ones left over from before a page reload.
 */
export async function flushAnswerUploads(
  attemptId: string,
  options: { retries?: number; retryDelayMs?: number } = {},
): Promise<FlushResult> {
  const { retries = UPLOAD_RETRIES, retryDelayMs = UPLOAD_RETRY_DELAY_MS } = options;

  await Promise.allSettled([...(inFlight.get(attemptId) ?? [])]);

  const pending = await listPendingUploads(attemptId).catch(() => [] as AudioBlobRecord[]);
  const outcomes = await Promise.all(
    pending.map(async (record) => {
      for (let attempt = 1; attempt <= retries; attempt += 1) {
        if (attempt > 1) await wait(retryDelayMs * (attempt - 1));
        if (await postAnswerAudio(record)) return null;
      }
      return record.questionKey;
    }),
  );
  return { failedQuestionKeys: outcomes.filter((key): key is string => key !== null) };
}
