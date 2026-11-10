import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { deleteAudioBlob, getAudioBlob, listPendingUploads, saveAudioBlob, type AudioBlobRecord } from "../storage";
import { FakeIndexedDB } from "./fake-indexed-db";

let attemptSeq = 0;
let ATTEMPT = "";

function record(questionKey: string): Omit<AudioBlobRecord, "createdAt"> {
  return {
    attemptId: ATTEMPT,
    questionKey,
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
    durationMs: 12000,
    mimeType: "audio/webm",
    part: 1,
    order: 0,
    questionText: "Do you like tidying?",
    generation: 1000,
  };
}

describe("device storage for answer recordings (IndexedDB)", () => {
  let idb: FakeIndexedDB;
  let uninstall: () => void;

  beforeEach(() => {
    attemptSeq += 1;
    ATTEMPT = `att-storage-${attemptSeq}`;
    idb = new FakeIndexedDB();
    uninstall = idb.install();
  });
  afterEach(() => uninstall());

  it("stores a recording once its transaction commits", async () => {
    await saveAudioBlob(record("q1"));
    expect(idb.rows.size).toBe(1);
    expect(await listPendingUploads(ATTEMPT)).toEqual([expect.objectContaining({ questionKey: "q1" })]);
  });

  it("keeps a recording whose commit aborted and lists it with the committed ones", async () => {
    idb.abortNextCommit = new DOMException("Quota exceeded", "QuotaExceededError");
    await saveAudioBlob(record("q1"));
    await saveAudioBlob(record("q2"));

    expect([...idb.rows.values()].map((r) => r.questionKey)).toEqual(["q2"]);
    const pending = await listPendingUploads(ATTEMPT);
    expect(pending.map((r) => r.questionKey).sort()).toEqual(["q1", "q2"]);
    expect(await getAudioBlob(ATTEMPT, "q1")).toMatchObject({ questionKey: "q1" });
  });

  it("drops both the stored and the in-memory copy on delete", async () => {
    idb.abortNextCommit = new DOMException("Quota exceeded", "QuotaExceededError");
    await saveAudioBlob(record("q1"));
    await saveAudioBlob(record("q2"));

    await deleteAudioBlob(ATTEMPT, "q1");
    await deleteAudioBlob(ATTEMPT, "q2");
    expect(await listPendingUploads(ATTEMPT)).toEqual([]);
    expect(idb.rows.size).toBe(0);
  });

  it("rejects instead of reporting nothing when the store cannot be read", async () => {
    await saveAudioBlob(record("q1"));
    idb.failNextRead = new DOMException("Read failed", "UnknownError");
    await expect(listPendingUploads(ATTEMPT)).rejects.toThrow("Read failed");
  });
});
