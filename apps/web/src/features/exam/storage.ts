export type AudioBlobRecord = {
  attemptId: string;
  questionKey: string;
  blob: Blob;
  durationMs: number;
  mimeType: string;
  part: number;
  order: number;
  questionText: string;
  /** Monotonic client-side version (epoch ms, clamped) assigned when the recording is created. */
  generation: number;
  createdAt: number;
};

const DB_NAME = "vox_flow_exam_db";
const STORE_NAME = "audio_blobs";
const DB_VERSION = 1;

// In-memory fallback if IndexedDB is unavailable (e.g. unit test jsdom)
const memoryStore = new Map<string, AudioBlobRecord>();

function getKey(attemptId: string, questionKey: string): string {
  return `${attemptId}::${questionKey}`;
}

function openDatabase(): Promise<IDBDatabase> {
  const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();

  if (typeof window === "undefined" || !window.indexedDB) {
    reject(new Error("IndexedDB is not supported in this environment"));
    return promise;
  }

  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: ["attemptId", "questionKey"] });
      store.createIndex("attemptId", "attemptId", { unique: false });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);

  return promise;
}

/**
 * Resolves once the transaction has committed. A request's `onsuccess` is not
 * enough: the write can still be rolled back at commit time (e.g. a
 * QuotaExceededError is reported on the transaction, not on the request).
 */
function transactionDone(tx: IDBTransaction): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  tx.oncomplete = () => resolve();
  tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
  return promise;
}

/**
 * Keeps a recording on the device. Falls back to memory (lost on reload) when
 * IndexedDB is unavailable or the write does not commit, so the recording can
 * still be retried during this page load.
 */
export async function saveAudioBlob(record: Omit<AudioBlobRecord, "createdAt">): Promise<void> {
  const fullRecord: AudioBlobRecord = {
    ...record,
    createdAt: Date.now(),
  };
  const key = getKey(record.attemptId, record.questionKey);

  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const done = transactionDone(tx);
    tx.objectStore(STORE_NAME).put(fullRecord);
    await done;
    // The committed copy supersedes any older in-memory fallback.
    memoryStore.delete(key);
  } catch {
    memoryStore.set(key, fullRecord);
  }
}

export async function getAudioBlob(
  attemptId: string,
  questionKey: string,
): Promise<AudioBlobRecord | null> {
  // A newer in-memory copy exists only when the last write did not commit.
  const inMemory = memoryStore.get(getKey(attemptId, questionKey));
  if (inMemory) return inMemory;
  try {
    const db = await openDatabase();
    const { promise, resolve, reject } = Promise.withResolvers<AudioBlobRecord | null>();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get([attemptId, questionKey]);

    req.onsuccess = () => resolve((req.result as AudioBlobRecord) ?? null);
    req.onerror = () => reject(req.error);
    return await promise;
  } catch {
    return null;
  }
}

/**
 * Lists the recordings of an attempt still kept on this device, from IndexedDB
 * and from the in-memory fallback (a newer in-memory copy wins). When
 * IndexedDB cannot be opened at all only the in-memory copies exist, as
 * `saveAudioBlob` fell back to memory too. Rejects when IndexedDB opened but
 * could not be read, so callers never mistake an unreadable store for an
 * empty one.
 */
export async function listPendingUploads(attemptId: string): Promise<AudioBlobRecord[]> {
  const byQuestion = new Map<string, AudioBlobRecord>();

  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
  } catch {
    db = null;
  }
  if (db) {
    const { promise, resolve, reject } = Promise.withResolvers<AudioBlobRecord[]>();
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).index("attemptId").getAll(attemptId);
    req.onsuccess = () => resolve((req.result as AudioBlobRecord[] | undefined) ?? []);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    for (const record of await promise) byQuestion.set(record.questionKey, record);
  }

  for (const record of memoryStore.values()) {
    if (record.attemptId === attemptId) byQuestion.set(record.questionKey, record);
  }
  return Array.from(byQuestion.values());
}

/** Drops the device copy of a recording, from IndexedDB and the in-memory fallback. */
export async function deleteAudioBlob(attemptId: string, questionKey: string): Promise<void> {
  memoryStore.delete(getKey(attemptId, questionKey));
  let db: IDBDatabase;
  try {
    db = await openDatabase();
  } catch {
    return;
  }
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);
  tx.objectStore(STORE_NAME).delete([attemptId, questionKey]);
  await done;
}

export async function clearAttemptAudio(attemptId: string): Promise<void> {
  const pending = await listPendingUploads(attemptId);
  for (const item of pending) {
    await deleteAudioBlob(item.attemptId, item.questionKey);
  }
}
