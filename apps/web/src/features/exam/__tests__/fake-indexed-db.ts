/**
 * Minimal in-memory IndexedDB covering what `storage.ts` uses: one object store
 * keyed by [attemptId, questionKey] with an `attemptId` index. It follows the
 * spec's ordering, so write failures can be reproduced the way browsers report
 * them: a request's `onsuccess` fires first, then the transaction aborts at
 * commit time and its writes are rolled back (how a QuotaExceededError
 * surfaces).
 */

type Row = { attemptId: string; questionKey: string } & Record<string, unknown>;
type Handler = (() => void) | null;

const later = (fn: () => void) => setTimeout(fn, 0);
const rowKey = (attemptId: string, questionKey: string) => `${attemptId}::${questionKey}`;

class FakeRequest<T> {
  result: T | undefined = undefined;
  error: DOMException | null = null;
  onsuccess: Handler = null;
  onerror: Handler = null;
}

class FakeTransaction {
  error: DOMException | null = null;
  oncomplete: Handler = null;
  onabort: Handler = null;
  onerror: Handler = null;
  private pending = 0;
  private readonly writes: Array<() => void> = [];
  private failure: DOMException | null = null;

  constructor(
    private readonly owner: FakeIndexedDB,
    readonly mode: IDBTransactionMode,
  ) {}

  objectStore() {
    return {
      put: (value: Row) => this.request(() => {
        this.writes.push(() => this.owner.rows.set(rowKey(value.attemptId, value.questionKey), { ...value }));
        return undefined;
      }),
      delete: ([attemptId, questionKey]: [string, string]) => this.request(() => {
        this.writes.push(() => this.owner.rows.delete(rowKey(attemptId, questionKey)));
        return undefined;
      }),
      get: ([attemptId, questionKey]: [string, string]) =>
        this.request(() => this.owner.rows.get(rowKey(attemptId, questionKey)) ?? undefined),
      index: () => ({
        getAll: (attemptId: string) => {
          const readError = this.owner.failNextRead;
          this.owner.failNextRead = null;
          return this.request(() => {
            if (readError) throw readError;
            return [...this.owner.rows.values()].filter((row) => row.attemptId === attemptId);
          });
        },
      }),
    };
  }

  private request<T>(run: () => T): FakeRequest<T> {
    const req = new FakeRequest<T>();
    this.pending += 1;
    if (this.pending === 1 && this.mode === "readwrite" && this.owner.abortNextCommit) {
      this.failure = this.owner.abortNextCommit;
      this.owner.abortNextCommit = null;
    }
    later(() => {
      try {
        req.result = run();
        req.onsuccess?.();
      } catch (err) {
        req.error = err as DOMException;
        this.failure = req.error;
        req.onerror?.();
      }
      this.pending -= 1;
      if (this.pending === 0) later(() => this.finish());
    });
    return req;
  }

  private finish() {
    if (this.failure) {
      // Writes are discarded: nothing from this transaction reaches the store.
      this.error = this.failure;
      this.onabort?.();
      return;
    }
    for (const write of this.writes) write();
    this.oncomplete?.();
  }
}

export class FakeIndexedDB {
  readonly rows = new Map<string, Row>();
  /** Makes the next readwrite transaction's requests succeed but its commit abort with this error. */
  abortNextCommit: DOMException | null = null;
  /** Makes the next `getAll` request fail with this error. */
  failNextRead: DOMException | null = null;
  private upgraded = false;

  open() {
    const req = new FakeRequest<unknown>() as FakeRequest<unknown> & { onupgradeneeded: Handler };
    req.onupgradeneeded = null;
    const db = {
      objectStoreNames: { contains: () => this.upgraded },
      createObjectStore: () => {
        this.upgraded = true;
        return { createIndex: () => undefined };
      },
      transaction: (_store: string, mode: IDBTransactionMode) => new FakeTransaction(this, mode),
    };
    later(() => {
      req.result = db;
      if (!this.upgraded) req.onupgradeneeded?.();
      req.onsuccess?.();
    });
    return req;
  }

  /** Installs this fake as `window.indexedDB`; returns a function that removes it. */
  install(): () => void {
    Object.defineProperty(window, "indexedDB", { value: this, configurable: true, writable: true });
    return () => {
      Reflect.deleteProperty(window, "indexedDB");
    };
  }
}
