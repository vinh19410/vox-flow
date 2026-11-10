import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { flushAnswerUploads, trackAnswerUpload, UPLOAD_RETRIES, type AnswerUpload } from "../answer-uploads";
import { clearAttemptAudio, getAudioBlob, listPendingUploads, saveAudioBlob } from "../storage";

const ATTEMPT = "att-uploads";

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
    await clearAttemptAudio(ATTEMPT);
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
    await expect(flush).resolves.toEqual({ failedQuestionKeys: [] });
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
    await expect(flush).resolves.toEqual({ failedQuestionKeys: [] });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries a failed upload from the device copy", async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError("network")).mockResolvedValueOnce(ok());

    await expect(trackAnswerUpload(ATTEMPT, record("q1"))).resolves.toBe(false);
    expect(await getAudioBlob(ATTEMPT, "q1")).not.toBeNull();

    await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({ failedQuestionKeys: [] });
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
    expect(result).toEqual({ failedQuestionKeys: ["q1"] });
    const q1Calls = fetchSpy.mock.calls.filter(([url]) => String(url).includes("/q1/"));
    expect(q1Calls).toHaveLength(UPLOAD_RETRIES);
    expect(await getAudioBlob(ATTEMPT, "q1")).not.toBeNull();
    expect(await getAudioBlob(ATTEMPT, "q2")).toBeNull();
  });

  it("uploads recordings left on the device by an earlier page load", async () => {
    fetchSpy.mockResolvedValue(ok());
    await saveAudioBlob(record("q1"));

    await expect(flushAnswerUploads(ATTEMPT, { retryDelayMs: 0 })).resolves.toEqual({ failedQuestionKeys: [] });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
