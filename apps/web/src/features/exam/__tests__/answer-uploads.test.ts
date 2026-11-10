import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { flushAnswerUploads, trackAnswerUpload, UPLOAD_RETRIES, type AnswerUpload } from "../answer-uploads";
import { deleteAudioBlob, getAudioBlob, listPendingUploads, saveAudioBlob } from "../storage";
import { FakeIndexedDB } from "./fake-indexed-db";

// Upload bookkeeping is module state, so every test gets its own attempt.
let attemptSeq = 0;
let ATTEMPT = "";

function record(questionKey: string, order = 0): AnswerUpload {
  return {
    attemptId: ATTEMPT,
    questionKey,
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
    durationMs: 12000,
    mimeType: "audio/webm",
    part: 1,
    order,
    questionText: "Do you like tidying?",
  };
}

const ok = () => new Response(JSON.stringify({ success: true }), { status: 200 });
const fail = () => new Response("nope", { status: 500 });

describe("answer uploads", () => {
  const fetchSpy = vi.fn<typeof fetch>();

  beforeEach(async () => {
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
    attemptSeq += 1;
    ATTEMPT = `att-uploads-${attemptSeq}`;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("waits for an upload still in flight before reporting the attempt as flushed", async () => {
    let finish!: (res: Response) => void;
    fetchSpy.mockReturnValueOnce(new Promise<Response>((resolve) => (finish = resolve)));

    void trackAnswerUpload(ATTEMPT, record("q1"));
    let flushed = false;
    const flush = flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 }).then((r) => {
      flushed = true;
      return r;
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(flushed).toBe(false);

    finish(ok());
    await expect(flush).resolves.toEqual({ failedQuestionKeys: [], storageUnreadable: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]![0])).toContain(`/api/attempts/${ATTEMPT}/answers/q1/audio?`);
    // The local copy is dropped once the server has it.
    expect(await getAudioBlob(ATTEMPT, "q1")).toBeNull();
  });

  it("tracks the upload before the recording is ready, so a fast submit still waits for it", async () => {
    fetchSpy.mockResolvedValue(ok());
    let ready!: (r: AnswerUpload) => void;
    void trackAnswerUpload(ATTEMPT, new Promise<AnswerUpload>((resolve) => (ready = resolve)));

    const flush = flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 });
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchSpy).not.toHaveBeenCalled();

    ready(record("q1"));
    await expect(flush).resolves.toEqual({ failedQuestionKeys: [], storageUnreadable: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries a failed upload from the device copy", async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError("network")).mockResolvedValueOnce(ok());

    await expect(trackAnswerUpload(ATTEMPT, record("q1"))).resolves.toBe(false);
    expect(await getAudioBlob(ATTEMPT, "q1")).not.toBeNull();

    await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({ failedQuestionKeys: [], storageUnreadable: false });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(await listPendingUploads(ATTEMPT)).toHaveLength(0);
  });

  it("gives up after a bounded number of retries and keeps the recording on the device", async () => {
    fetchSpy.mockImplementation(async () => fail());

    await trackAnswerUpload(ATTEMPT, record("q1"));
    await trackAnswerUpload(ATTEMPT, record("q2", 1));
    fetchSpy.mockClear();
    fetchSpy.mockImplementation(async (input) => (String(input).includes("/q2/") ? ok() : fail()));

    const result = await flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 });
    expect(result).toEqual({ failedQuestionKeys: ["q1"], storageUnreadable: false });
    const q1Calls = fetchSpy.mock.calls.filter(([url]) => String(url).includes("/q1/"));
    expect(q1Calls).toHaveLength(UPLOAD_RETRIES);
    expect(await getAudioBlob(ATTEMPT, "q1")).not.toBeNull();
    expect(await getAudioBlob(ATTEMPT, "q2")).toBeNull();
  });

  it("uploads recordings left on the device by an earlier page load", async () => {
    fetchSpy.mockResolvedValue(ok());
    await saveAudioBlob(record("q1"));

    await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({ failedQuestionKeys: [], storageUnreadable: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries a failed upload from memory when its device copy is gone", async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError("network")).mockResolvedValueOnce(ok());
    await expect(trackAnswerUpload(ATTEMPT, record("q1"))).resolves.toBe(false);
    // The browser evicted the stored copy (or it never committed).
    await deleteAudioBlob(ATTEMPT, "q1");
    expect(await listPendingUploads(ATTEMPT)).toHaveLength(0);

    await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
      failedQuestionKeys: [],
      storageUnreadable: false,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(String(fetchSpy.mock.calls[1]![0])).toContain("/answers/q1/audio?");
  });

  it("reports a failed upload whose device copy is gone instead of dropping it", async () => {
    fetchSpy.mockImplementation(async () => fail());
    await expect(trackAnswerUpload(ATTEMPT, record("q1"))).resolves.toBe(false);
    await deleteAudioBlob(ATTEMPT, "q1");

    await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
      failedQuestionKeys: ["q1"],
      storageUnreadable: false,
    });
  });

  it("forgets a failed upload once a later upload of the same answer succeeds", async () => {
    fetchSpy.mockResolvedValueOnce(fail()).mockResolvedValue(ok());
    await expect(trackAnswerUpload(ATTEMPT, record("q1"))).resolves.toBe(false);
    await expect(trackAnswerUpload(ATTEMPT, record("q1"))).resolves.toBe(true);
    fetchSpy.mockClear();

    await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
      failedQuestionKeys: [],
      storageUnreadable: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  describe("when an answer is recorded again while its first upload is still running", () => {
    /**
     * The first recording's request stays pending until the test settles it,
     * and (like a request the server already received) ignores the abort.
     */
    function blockFirstRecording(first: AnswerUpload) {
      let settle!: (res: Response | Error) => void;
      const pending = new Promise<Response>((resolve, reject) => {
        settle = (res) => (res instanceof Error ? reject(res) : resolve(res));
      });
      let firstSignal: AbortSignal | undefined;
      fetchSpy.mockImplementation(async (_url, init) => {
        if (init?.body === first.blob) {
          firstSignal = init.signal ?? undefined;
          return pending;
        }
        return ok();
      });
      return { settle, firstSignal: () => firstSignal };
    }
    const bodies = () => fetchSpy.mock.calls.map(([, init]) => init?.body);

    it("never re-sends the replaced recording after its upload fails late", async () => {
      const first = record("q1");
      const second = record("q1");
      const blocked = blockFirstRecording(first);

      const firstUpload = trackAnswerUpload(ATTEMPT, first);
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
      await expect(trackAnswerUpload(ATTEMPT, second)).resolves.toBe(true);
      expect(blocked.firstSignal()?.aborted).toBe(true);

      blocked.settle(new TypeError("network"));
      await expect(firstUpload).resolves.toBe(false);
      fetchSpy.mockClear();

      await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
        failedQuestionKeys: [],
        storageUnreadable: false,
      });
      expect(bodies()).not.toContain(first.blob);
      expect(fetchSpy).not.toHaveBeenCalled();
      // Neither the replaced recording nor the delivered one is left to upload.
      expect(await listPendingUploads(ATTEMPT)).toHaveLength(0);
    });

    it("re-sends the newest recording when the replaced one still reaches the server late", async () => {
      const first = record("q1");
      const second = record("q1");
      const blocked = blockFirstRecording(first);

      const firstUpload = trackAnswerUpload(ATTEMPT, first);
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
      await expect(trackAnswerUpload(ATTEMPT, second)).resolves.toBe(true);
      // The client cancels the replaced upload, but a request the server has
      // already received may still be stored after the newer one.
      expect(blocked.firstSignal()?.aborted).toBe(true);
      blocked.settle(ok());
      await expect(firstUpload).resolves.toBe(false);
      fetchSpy.mockClear();

      await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
        failedQuestionKeys: [],
        storageUnreadable: false,
      });
      // The last upload the server receives is the newest recording.
      expect(bodies()).toEqual([second.blob]);

      // Once restored, a later flush has nothing left to send.
      fetchSpy.mockClear();
      await flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("never uploads or stores a recording that was replaced before it was ready", async () => {
      fetchSpy.mockResolvedValue(ok());
      const first = record("q1");
      const second = record("q1");
      let ready!: (r: AnswerUpload) => void;
      const firstUpload = trackAnswerUpload(ATTEMPT, new Promise<AnswerUpload>((resolve) => (ready = resolve)));
      await expect(trackAnswerUpload(ATTEMPT, second)).resolves.toBe(true);

      ready(first);
      await expect(firstUpload).resolves.toBe(false);
      expect(bodies()).toEqual([second.blob]);
      expect(await listPendingUploads(ATTEMPT)).toHaveLength(0);
    });

    it("keeps the newest recording, not the replaced one, when the newest upload fails", async () => {
      const first = record("q1");
      const second = record("q1");
      const blocked = blockFirstRecording(first);
      const firstUpload = trackAnswerUpload(ATTEMPT, first);
      await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

      fetchSpy.mockImplementation(async (_url, init) => (init?.body === first.blob ? ok() : fail()));
      await expect(trackAnswerUpload(ATTEMPT, second)).resolves.toBe(false);
      blocked.settle(new TypeError("network"));
      await firstUpload;

      const [kept] = await listPendingUploads(ATTEMPT);
      expect(kept?.blob).toBe(second.blob);

      fetchSpy.mockReset().mockResolvedValue(ok());
      await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
        failedQuestionKeys: [],
        storageUnreadable: false,
      });
      expect(bodies()).toEqual([second.blob]);
    });
  });

  describe("with IndexedDB", () => {
    let idb: FakeIndexedDB;
    let uninstall: () => void;
    beforeEach(() => {
      idb = new FakeIndexedDB();
      uninstall = idb.install();
    });
    afterEach(() => uninstall());

    it("retries a recording whose IndexedDB write was rolled back at commit", async () => {
      idb.abortNextCommit = new DOMException("Quota exceeded", "QuotaExceededError");
      fetchSpy.mockRejectedValueOnce(new TypeError("network")).mockResolvedValueOnce(ok());

      await expect(trackAnswerUpload(ATTEMPT, record("q1"))).resolves.toBe(false);
      expect(idb.rows.size).toBe(0);

      await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
        failedQuestionKeys: [],
        storageUnreadable: false,
      });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("does not submit as complete when the device copies cannot be read", async () => {
      fetchSpy.mockResolvedValue(ok());
      // Left over from an earlier page load, so only the device knows about it.
      await saveAudioBlob(record("q1"));
      idb.failNextRead = new DOMException("Read failed", "UnknownError");

      await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({
        failedQuestionKeys: [],
        storageUnreadable: true,
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
