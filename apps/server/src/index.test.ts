import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockBucket, mockPut, mockDelete, mockList, mockUpsert, mockState, mockDb, mockAuth } = vi.hoisted(() => {
  const mockPut = vi.fn().mockResolvedValue({ size: 3 });
  const mockDelete = vi.fn().mockResolvedValue(undefined);
  const mockList = vi.fn().mockResolvedValue({ objects: [] as { key: string }[], truncated: false });
  const mockUpsert = vi.fn().mockImplementation(() => Promise.resolve(mockState.upsertResult));
  const mockGet = vi.fn().mockResolvedValue({
    body: new ReadableStream(),
    size: 1024,
    mimeType: "audio/webm",
  });
  const mockBucket = {
    put: mockPut,
    get: mockGet,
    delete: mockDelete,
    list: mockList,
  };

  const mockState = {
    currentAttemptStatus: "in_progress",
    currentAttemptUserId: "user-1",
    attemptExists: true,
    attemptTopicId: null as string | null,
    attemptQuestionKey: null as string | null,
    existingAnswers: [] as Array<{ id: string; questionKey: string; sizeBytes: number; generation?: number; audioKey?: string }>,
    topicRow: null as { id: string; part: number; questions: unknown } | null,
    currentSessionUser: {
      id: "user-1",
      email: "test@example.com",
    } as { id: string; email: string } | null,
    ansRecord: {
      id: "ans-1",
      attemptId: "att-123",
      audioKey: "users/user-1/attempts/att-123/p1_q1.webm",
      mimeType: "audio/webm",
      generation: 0,
    },
    /** What the mocked upsertAnswerRecording resolves to ([] = lost write, [row] = win). */
    upsertResult: [] as unknown[],
  };
  // Identify drizzle table objects by their column properties so the mock can
  // route selects per table without importing @vox-flow/db inside vi.hoisted.
  const tableName = (table: unknown): string => {
    if (typeof table === "object" && table !== null) {
      if ("questions" in table && "quarter" in table) return "forecast_topic";
      if ("audioKey" in table && "questionKey" in table) return "attempt_answer";
      if ("questionKey" in table || "status" in table) return "attempt";
    }
    return "unknown";
  };

  const mockDb = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          const name = tableName(table);
          if (name === "attempt_answer") {
            // POST upload route awaits the where() result directly (all rows);
            // GET route chains .limit(1) for a single answer.
            const allRows = Promise.resolve(mockState.existingAnswers);
            return Object.assign(allRows, {
              limit: () => Promise.resolve([mockState.ansRecord]),
            });
          }
          const row =
            name === "forecast_topic"
              ? mockState.topicRow
              : mockState.attemptExists
                ? {
                    id: "att-123",
                    userId: mockState.currentAttemptUserId,
                    status: mockState.currentAttemptStatus,
                    topicId: mockState.attemptTopicId,
                    questionKey: mockState.attemptQuestionKey,
                  }
                : null;
          return {
            limit: () => Promise.resolve(row ? [row] : []),
          };
        },
      }),
    }),
  };

  const mockAuth = {
    api: {
      getSession: vi.fn().mockImplementation(() =>
        Promise.resolve(
          mockState.currentSessionUser
            ? {
                user: mockState.currentSessionUser,
                session: { id: "sess-1" },
              }
            : null,
        ),
      ),
    },
  };

  return { mockBucket, mockPut, mockDelete, mockList, mockUpsert, mockState, mockDb, mockAuth };
});

vi.mock("@vox-flow/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vox-flow/api")>()),
  upsertAnswerRecording: mockUpsert,
}));

vi.mock("./env.server", () => ({
  ENV: {
    CORS_ORIGIN: "*",
    AUDIO_BUCKET: mockBucket,
  },
}));

vi.mock("./services", () => ({
  createAuth: () => Promise.resolve(mockAuth),
  getDb: () => mockDb,
}));

import { app } from "./index";

describe("POST /api/attempts/:attemptId/answers/:questionKey/audio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Drop leftover mockResolvedValueOnce queues from earlier tests.
    mockPut.mockReset();
    mockPut.mockResolvedValue({ size: 3 });
    mockDelete.mockReset();
    mockDelete.mockResolvedValue(undefined);
    mockState.currentAttemptStatus = "in_progress";
    mockState.currentAttemptUserId = "user-1";
    mockState.attemptExists = true;
    mockState.attemptTopicId = null;
    mockState.attemptQuestionKey = null;
    mockState.existingAnswers = [];
    mockState.topicRow = null;
    mockState.ansRecord.generation = 0;
    mockState.currentSessionUser = {
      id: "user-1",
      email: "test@example.com",
    };
    mockState.upsertResult = [];
  });

  const validUrl = "/api/attempts/att-123/answers/p1_q1/audio?part=1&order=0&durationMs=5000&questionText=Sample";

  it("returns 401 when unauthenticated", async () => {
    mockState.currentSessionUser = null;
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid questionKey (path traversal / special chars)", async () => {
    const res = await app.request("/api/attempts/att-123/answers/..%2F..%2Fhack/audio", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid question key");
  });

  it("returns 411 when Content-Length header is missing", async () => {
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-type": "audio/webm",
      },
      // body omitted and no content-length
    });
    expect(res.status).toBe(411);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Content-Length header required");
  });

  it("returns 400 when Content-Length is malformed", async () => {
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "10abc",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid Content-Length header");
  });

  it("returns 400 when Content-Length is 0", async () => {
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "0",
        "content-type": "audio/webm",
      },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Empty payload not allowed");
  });

  it("returns 413 when Content-Length exceeds 10MB", async () => {
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "10485761", // 10MB + 1 byte
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1]),
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Payload too large (max 10MB)");
  });

  it("returns 415 when Content-Type header is missing", async () => {
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(415);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unsupported Media Type");
  });

  it("returns 415 when Content-Type is text/plain or form-urlencoded (CSRF/mime spoofing)", async () => {
    const res1 = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "text/plain",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res1.status).toBe(415);

    const res2 = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res2.status).toBe(415);
  });

  it("returns 415 for prototype properties (constructor, toString, valueOf, __proto__)", async () => {
    for (const evilType of ["constructor", "toString", "valueOf", "__proto__", "hasownproperty"]) {
      const res = await app.request(validUrl, {
        method: "POST",
        headers: {
          "content-length": "100",
          "content-type": evilType,
        },
        body: new Uint8Array([1, 2, 3]),
      });
      expect(res.status).toBe(415);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("Unsupported Media Type");
    }
  });

  it("returns 400 for out-of-bounds query parameter part (e.g. part=0, part=4, part=abc)", async () => {
    const resZero = await app.request("/api/attempts/att-123/answers/p1_q1/audio?part=0", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(resZero.status).toBe(400);

    const resFour = await app.request("/api/attempts/att-123/answers/p1_q1/audio?part=4", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(resFour.status).toBe(400);

    const resNaN = await app.request("/api/attempts/att-123/answers/p1_q1/audio?part=abc", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(resNaN.status).toBe(400);
  });

  it("returns 400 for out-of-bounds query parameter order (e.g. order=-1, order=101)", async () => {
    const resNeg = await app.request("/api/attempts/att-123/answers/p1_q1/audio?order=-1", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(resNeg.status).toBe(400);

    const resLarge = await app.request("/api/attempts/att-123/answers/p1_q1/audio?order=101", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(resLarge.status).toBe(400);
  });

  it("returns 400 for out-of-bounds durationMs (e.g. durationMs=-1, durationMs=1e3)", async () => {
    const resNeg = await app.request("/api/attempts/att-123/answers/p1_q1/audio?durationMs=-1", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(resNeg.status).toBe(400);

    const resExp = await app.request("/api/attempts/att-123/answers/p1_q1/audio?durationMs=1e3", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(resExp.status).toBe(400);
  });

  it("returns 400 when questionText exceeds 2000 characters", async () => {
    const longText = "a".repeat(2001);
    const res = await app.request(`/api/attempts/att-123/answers/p1_q1/audio?questionText=${longText}`, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is null/empty despite content-length header", async () => {
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      // body omitted -> c.req.raw.body is null
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Empty payload body");
  });

  it("successfully uploads audio/webm;codecs=opus and writes to R2 bucket with webm extension", async () => {
    mockState.upsertResult = [{}];
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm;codecs=opus",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; audioKey: string };
    expect(body.success).toBe(true);
    expect(body.audioKey).toBe("users/user-1/attempts/att-123/p1_q1.0.webm");

    expect(mockPut).toHaveBeenCalledWith(
      "users/user-1/attempts/att-123/p1_q1.0.webm",
      expect.anything(),
      {
        httpMetadata: { contentType: "audio/webm" },
      },
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        attemptId: "att-123",
        questionKey: "p1_q1",
        questionText: "Sample",
        partNumber: 1,
        orderIndex: 0,
        audioKey: "users/user-1/attempts/att-123/p1_q1.0.webm",
        durationMs: 5000,
        mimeType: "audio/webm",
        generation: 0,
      }),
    );
  });

  it("successfully uploads audio/mpeg and maps extension to mp3", async () => {
    mockState.upsertResult = [{}];
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/mpeg",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; audioKey: string };
    expect(body.success).toBe(true);
    expect(body.audioKey).toBe("users/user-1/attempts/att-123/p1_q1.0.mp3");

    expect(mockPut).toHaveBeenCalledWith(
      "users/user-1/attempts/att-123/p1_q1.0.mp3",
      expect.anything(),
      {
        httpMetadata: { contentType: "audio/mpeg" },
      },
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        attemptId: "att-123",
        questionKey: "p1_q1",
        audioKey: "users/user-1/attempts/att-123/p1_q1.0.mp3",
        mimeType: "audio/mpeg",
      }),
    );
  });

  it("returns 400 when the question key is not valid for the topic", async () => {
    mockState.attemptTopicId = "topic-1";
    mockState.topicRow = { id: "topic-1", part: 1, questions: ["Q1", "Q2"] };

    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid question key for this attempt");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("rejects an upload older than the stored generation without touching the bucket (fast-path 409)", async () => {
    mockState.existingAnswers = [
      { id: "ans-gen-5", questionKey: "p1_q1", sizeBytes: 0, audioKey: "users/user-1/attempts/att-123/p1_q1.5.webm", generation: 5 },
    ];
    const res = await app.request(`${validUrl}&generation=4`, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; storedGeneration: number };
    expect(body.error).toBe("stale_generation");
    expect(body.storedGeneration).toBe(5);
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 400 when uploading a third answer in single-question mode", async () => {
    mockState.attemptTopicId = "topic-1";
    mockState.attemptQuestionKey = "topic-1-0";
    mockState.topicRow = { id: "topic-1", part: 1, questions: ["Q1", "Q2", "Q3"] };
    mockState.existingAnswers = [
      { id: "ans-1", questionKey: "topic-1-0", sizeBytes: 100 },
      { id: "ans-2", questionKey: "topic-1-1", sizeBytes: 100 },
    ];

    // The follow-up key is the only remaining valid key, and the attempt
    // already holds the single-question maximum of 2 answers.
    const res = await app.request("/api/attempts/att-123/answers/topic-1-0-f/audio?part=1&order=2&durationMs=5000&questionText=Follow", {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Question limit reached for this attempt");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("replaces sizeBytes on re-record instead of accumulating", async () => {
    mockState.attemptTopicId = "topic-1";
    mockState.topicRow = { id: "topic-1", part: 1, questions: ["Q1"] };
    mockState.existingAnswers = [{ id: "ans-1", questionKey: "topic-1-0", sizeBytes: 500 }];
    mockState.upsertResult = [{ audioKey: "users/user-1/attempts/att-123/topic-1-0.0.webm" }];
    mockPut.mockResolvedValueOnce({ size: 700 });

    const res = await app.request("/api/attempts/att-123/answers/topic-1-0/audio?part=1&order=0&durationMs=5000&questionText=Sample", {
      method: "POST",
      headers: {
        "content-length": "300",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        attemptId: "att-123",
        questionKey: "topic-1-0",
        sizeBytes: 700,
      }),
    );
  });

  it("returns 413 when the new upload would push total audio past 35MB", async () => {
    mockState.existingAnswers = [
      { id: "ans-1", questionKey: "other-q", sizeBytes: 30 * 1024 * 1024 },
    ];

    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": String(6 * 1024 * 1024),
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1]),
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Payload too large: total audio exceeds 35MB");
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 503 and deletes the object when R2 reports an empty stored object size", async () => {
    mockPut.mockResolvedValueOnce({ size: 0 });

    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Storage write failed: unverifiable object size");
    expect(mockDelete).toHaveBeenCalledWith("users/user-1/attempts/att-123/p1_q1.0.webm");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 503 and deletes the object when R2 omits the reported size (fail closed)", async () => {
    mockPut.mockResolvedValueOnce(undefined);

    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "100",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(503);
    expect(mockDelete).toHaveBeenCalledWith("users/user-1/attempts/att-123/p1_q1.0.webm");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("accepts an equal generation retry (idempotent) and passes generation to the helper", async () => {
    mockState.existingAnswers = [
      { id: "ans-gen-5", questionKey: "p1_q1", sizeBytes: 0, audioKey: "users/user-1/attempts/att-123/p1_q1.5.webm", generation: 5 },
    ];
    mockState.upsertResult = [{ audioKey: "users/user-1/attempts/att-123/p1_q1.5.webm" }];
    const res = await app.request(`${validUrl}&generation=5`, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(200);
    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ questionKey: "p1_q1", generation: 5, audioKey: "users/user-1/attempts/att-123/p1_q1.5.webm" }),
    );
  });

  it("accepts a legacy upload with no generation param when the stored row is at generation 0", async () => {
    mockState.existingAnswers = [];
    mockState.upsertResult = [{}];
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ generation: 0 }),
    );
  });

  it("rejects a legacy upload (no generation param) when the stored row already has a newer generation", async () => {
    mockState.existingAnswers = [
      { id: "ans-gen-new", questionKey: "p1_q1", sizeBytes: 0, audioKey: "users/user-1/attempts/att-123/p1_q1.1731212345678.webm", generation: 1731212345678 },
    ];
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; storedGeneration: number };
    expect(body.error).toBe("stale_generation");
    expect(body.storedGeneration).toBe(1731212345678);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("rejects a generation beyond the server-clock ceiling with 400", async () => {
    const tooFar = Date.now() + 25 * 60 * 60 * 1000;
    const res = await app.request(`${validUrl}&generation=${tooFar}`, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(400);
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("accepts a generation within the 24-hour server-clock ceiling", async () => {
    mockState.upsertResult = [{}];
    const res = await app.request(`${validUrl}&generation=${Date.now() + 23 * 60 * 60 * 1000}`, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(200);
  });

  it("deletes the blob it just put and returns 409 with the stored generation when the conditional upsert loses the race", async () => {
    // pre-read: no stored row; the helper loses the race and returns no rows;
    // the re-read (.limit(1)) finds generation 7 on the stored answer.
    mockState.existingAnswers = [];
    mockState.ansRecord.generation = 7;
    mockState.upsertResult = [];
    const res = await app.request(`${validUrl}&generation=3`, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; storedGeneration: number };
    expect(body.error).toBe("stale_generation");
    expect(body.storedGeneration).toBe(7);
    expect(mockPut).toHaveBeenCalledWith("users/user-1/attempts/att-123/p1_q1.3.webm", expect.anything(), {
      httpMetadata: { contentType: "audio/webm" },
    });
    expect(mockDelete).toHaveBeenCalledWith("users/user-1/attempts/att-123/p1_q1.3.webm");
  });

  it("deletes the superseded blobs of previous generations via prefix listing when a newer generation wins", async () => {
    mockState.existingAnswers = [
      { id: "ans-gen-5", questionKey: "p1_q1", sizeBytes: 0, audioKey: "users/user-1/attempts/att-123/p1_q1.5.webm", generation: 5 },
    ];
    mockState.upsertResult = [{ audioKey: "users/user-1/attempts/att-123/p1_q1.6.webm" }];
    // The prefix listing sees the previous generation's blob (and only this
    // question's keys, thanks to the "<questionKey>." prefix).
    mockList.mockResolvedValueOnce({
      objects: [
        { key: "users/user-1/attempts/att-123/p1_q1.5.webm" },
        { key: "users/user-1/attempts/att-123/p1_q1.6.webm" },
      ],
      truncated: false,
    });
    const res = await app.request(`${validUrl}&generation=6`, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith({ prefix: "users/user-1/attempts/att-123/p1_q1." });
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith("users/user-1/attempts/att-123/p1_q1.5.webm");
  });

  it("returns 403 when another user's attempt is targeted", async () => {
    mockState.currentAttemptUserId = "user-2";
    const res = await app.request(validUrl, {
      method: "POST",
      headers: {
        "content-length": "3",
        "content-type": "audio/webm",
      },
      body: new Uint8Array([1, 2, 3]),
    });
    expect(res.status).toBe(403);
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
    // The beforeEach lives in the POST describe only; later describes (GET)
    // inherit this mockState, so restore the default owner.
    mockState.currentAttemptUserId = "user-1";
  });
});

describe("GET /api/attempts/:attemptId/answers/:answerId/audio", () => {
  it("includes X-Content-Type-Options: nosniff in audio response", async () => {
    const res = await app.request("/api/attempts/att-123/answers/ans-1/audio", {
      method: "GET",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-type")).toBe("audio/webm");
  });
});
