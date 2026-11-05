export type AudioBlobRecord = {
  attemptId: string;
  questionKey: string;
  blob: Blob;
  durationMs: number;
  mimeType: string;
  part: number;
  order: number;
  questionText: string;
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

export async function saveAudioBlob(record: Omit<AudioBlobRecord, "createdAt">): Promise<void> {
  const fullRecord: AudioBlobRecord = {
    ...record,
    createdAt: Date.now(),
  };

  try {
    const db = await openDatabase();
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(fullRecord);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    await promise;
  } catch {
    // Fallback to in-memory store
    memoryStore.set(getKey(record.attemptId, record.questionKey), fullRecord);
  }
}

export async function getAudioBlob(
  attemptId: string,
  questionKey: string,
): Promise<AudioBlobRecord | null> {
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
    return memoryStore.get(getKey(attemptId, questionKey)) ?? null;
  }
}

export async function listPendingUploads(attemptId: string): Promise<AudioBlobRecord[]> {
  try {
    const db = await openDatabase();
    const { promise, resolve, reject } = Promise.withResolvers<AudioBlobRecord[]>();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("attemptId");
    const req = index.getAll(attemptId);

    req.onsuccess = () => {
      const results = (req.result as AudioBlobRecord[]) ?? [];
      resolve(results);
    };
    req.onerror = () => reject(req.error);
    return await promise;
  } catch {
    return Array.from(memoryStore.values()).filter((r) => r.attemptId === attemptId);
  }
}

export async function deleteAudioBlob(attemptId: string, questionKey: string): Promise<void> {
  try {
    const db = await openDatabase();
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete([attemptId, questionKey]);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    await promise;
  } catch {
    memoryStore.delete(getKey(attemptId, questionKey));
  }
}

export async function clearAttemptAudio(attemptId: string): Promise<void> {
  const pending = await listPendingUploads(attemptId);
  for (const item of pending) {
    await deleteAudioBlob(item.attemptId, item.questionKey);
  }
}
