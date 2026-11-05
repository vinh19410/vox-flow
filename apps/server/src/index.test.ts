import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockBucket, mockPut, mockInsertValues, mockState, mockDb, mockAuth } = vi.hoisted(() => {
  const mockPut = vi.fn().mockResolvedValue(undefined);
  const mockGet = vi.fn().mockResolvedValue({
    body: new ReadableStream(),
    size: 1024,
    mimeType: "audio/webm",
  });
  const mockBucket = {
    put: mockPut,
    get: mockGet,
  };

  const mockState = {
    currentAttemptStatus: "in_progress",
    currentAttemptUserId: "user-1",
    attemptExists: true,
    currentSessionUser: {
      id: "user-1",
      email: "test@example.com",
    } as { id: string; email: string } | null,
    ansRecord: {
      id: "ans-1",
      attemptId: "att-123",
      audioKey: "users/user-1/attempts/att-123/p1_q1.webm",
      mimeType: "audio/webm",
    },
  };
  const mockInsertValues = vi.fn().mockImplementation((val: unknown) => ({
    onConflictDoUpdate: vi.fn().mockResolvedValue(val),
  }));

  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve(
              mockState.attemptExists
                ? [
                    {
                      id: "att-123",
                      userId: mockState.currentAttemptUserId,
                      status: mockState.currentAttemptStatus,
                      audioKey: mockState.ansRecord.audioKey,
                      mimeType: mockState.ansRecord.mimeType,
                    },
                  ]
                : [],
            ),
        }),
      }),
    }),
    insert: () => ({
      values: mockInsertValues,
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

  return { mockBucket, mockPut, mockInsertValues, mockState, mockDb, mockAuth };
});

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
    mockState.currentAttemptStatus = "in_progress";
    mockState.currentAttemptUserId = "user-1";
    mockState.attemptExists = true;
    mockState.currentSessionUser = {
      id: "user-1",
      email: "test@example.com",
    };
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
    expect(body.audioKey).toBe("users/user-1/attempts/att-123/p1_q1.webm");

    expect(mockPut).toHaveBeenCalledWith(
      "users/user-1/attempts/att-123/p1_q1.webm",
      expect.anything(),
      {
        httpMetadata: { contentType: "audio/webm" },
      },
    );
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: "att-123",
        questionKey: "p1_q1",
        questionText: "Sample",
        partNumber: 1,
        orderIndex: 0,
        audioKey: "users/user-1/attempts/att-123/p1_q1.webm",
        durationMs: 5000,
        mimeType: "audio/webm",
      }),
    );
  });

  it("successfully uploads audio/mpeg and maps extension to mp3", async () => {
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
    expect(body.audioKey).toBe("users/user-1/attempts/att-123/p1_q1.mp3");

    expect(mockPut).toHaveBeenCalledWith(
      "users/user-1/attempts/att-123/p1_q1.mp3",
      expect.anything(),
      {
        httpMetadata: { contentType: "audio/mpeg" },
      },
    );
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: "att-123",
        questionKey: "p1_q1",
        audioKey: "users/user-1/attempts/att-123/p1_q1.mp3",
        mimeType: "audio/mpeg",
      }),
    );
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
