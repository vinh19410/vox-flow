import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { attempt, attemptAnswer, eq, paymentOrder, subscription, user } from "@vox-flow/db";
import { isValidAudioKey } from "@vox-flow/api";
import { createTestDb, type TestDbContext } from "../../../packages/api/src/test/db";

// Composite test (plan Task 1.5): the REAL route runs against a REAL D1 SQLite
// instance (Miniflare) and a Map-backed fake R2 bucket. Only auth is mocked.
// What the unit tests in index.test.ts cannot prove — zod transform ->
// buildAudioKey -> real conditional upsert (`setWhere`/`returning` on D1) ->
// 409/blob cleanup — is exercised here end to end.
const hoisted = vi.hoisted(() => {
  const state = {
    sessionUser: { id: "usr_comp_1", email: "comp@example.com" } as { id: string; email: string } | null,
  };
  const objects = new Map<string, Uint8Array>();
  const bucket = {
    put: async (key: string, body: ReadableStream | ArrayBuffer | ArrayBufferView) => {
      const buf = new Uint8Array(await new Response(body as BodyInit).arrayBuffer());
      objects.set(key, buf);
      return { size: buf.byteLength };
    },
    get: async (key: string) => {
      const data = objects.get(key);
      if (!data) return null;
      return { body: new Uint8Array(data), size: data.byteLength, contentType: "audio/webm", httpEtag: '"x"', uploaded: new Date() };
    },
    delete: async (key: string) => {
      objects.delete(key);
      return undefined;
    },
    list: async (opts: { prefix: string; cursor?: string }) => {
      if (opts.cursor) return { objects: [], truncated: false };
      return {
        objects: [...objects.keys()].filter((key) => key.startsWith(opts.prefix)).map((key) => ({ key })),
        truncated: false,
      };
    },
  };
  return { state, objects, bucket };
});

vi.mock("./env.server", () => ({
  ENV: {
    CORS_ORIGIN: "*",
    AUDIO_BUCKET: hoisted.bucket,
    SEPAY_WEBHOOK_API_KEY: "int-test-sepay-key",
    SEPAY_BANK_ACCOUNT: "1017588888",
  },
}));

let testCtx: TestDbContext;

vi.mock("./services", () => ({
  createAuth: () =>
    Promise.resolve({
      api: {
        getSession: () =>
          Promise.resolve(
            hoisted.state.sessionUser
              ? { user: hoisted.state.sessionUser, session: { id: "sess_comp_1" } }
              : null,
          ),
      },
    }),
  getDb: () => testCtx.db,
}));

const { app } = await import("./index");

const userId = "usr_comp_1";
const attemptId = "att_comp_1";
const post = (questionKey: string, generation?: number) =>
  app.request(
    `/api/attempts/${attemptId}/answers/${questionKey}/audio?part=1&order=0&durationMs=5000&questionText=Comp${generation !== undefined ? `&generation=${generation}` : ""}`,
    {
      method: "POST",
      headers: { "content-length": "3", "content-type": "audio/webm" },
      body: new Uint8Array([1, 2, 3]),
    },
  );

async function answerRow(questionKey: string) {
  const [row] = await testCtx.db
    .select()
    .from(attemptAnswer)
    .where(eq(attemptAnswer.questionKey, questionKey))
    .limit(1);
  return row;
}

describe("POST audio route on real D1 (composite)", () => {
  beforeAll(async () => {
    testCtx = await createTestDb();
    await testCtx.db.insert(user).values({ id: userId, name: "Comp", email: "comp@example.com" });
    await testCtx.db.insert(attempt).values({ id: attemptId, userId, mode: "full", status: "in_progress" });
  });

  beforeEach(() => {
    hoisted.state.sessionUser = { id: userId, email: "comp@example.com" };
  });

  afterAll(async () => {
    await testCtx?.dispose();
  });

  it("keeps the highest generation when two uploads arrive in reverse order, rejecting the older one before any blob write", async () => {
    const t2 = Date.now();
    const t1 = t2 - 1_000;

    const newer = await post("p1-1", t2);
    expect(newer.status).toBe(200);

    const older = await post("p1-1", t1);
    expect(older.status).toBe(409);
    const olderBody = (await older.json()) as { error: string; storedGeneration: number };
    expect(olderBody.error).toBe("stale_generation");
    expect(olderBody.storedGeneration).toBe(t2);

    const row = await answerRow("p1-1");
    expect(row?.generation).toBe(t2);
    expect(row?.audioKey).toBe(`users/${userId}/attempts/${attemptId}/p1-1.${t2}.webm`);
    expect(hoisted.objects.has(`users/${userId}/attempts/${attemptId}/p1-1.${t2}.webm`)).toBe(true);
    // The rejected upload never wrote a blob (fast-path 409 precedes bucket.put).
    expect(hoisted.objects.has(`users/${userId}/attempts/${attemptId}/p1-1.${t1}.webm`)).toBe(false);

    // The stored key must stay readable through the same validation the GET route uses.
    expect(isValidAudioKey(row!.audioKey, userId, attemptId)).toBe(true);
  });

  it("deletes the previous generation's blob when a newer generation wins sequentially", async () => {
    const t5 = Date.now();
    const t6 = t5 + 1_000;
    expect((await post("p2-1", t5)).status).toBe(200);
    expect(hoisted.objects.has(`users/${userId}/attempts/${attemptId}/p2-1.${t5}.webm`)).toBe(true);

    expect((await post("p2-1", t6)).status).toBe(200);
    const row = await answerRow("p2-1");
    expect(row?.generation).toBe(t6);
    // Winner cleanup listed this question's blobs and dropped the old generation.
    expect(hoisted.objects.has(`users/${userId}/attempts/${attemptId}/p2-1.${t6}.webm`)).toBe(true);
    expect(hoisted.objects.has(`users/${userId}/attempts/${attemptId}/p2-1.${t5}.webm`)).toBe(false);
  });

  it("accepts an equal-generation retry and the row reflects the last payload", async () => {
    const t = Date.now();
    expect((await post("p1-2", t)).status).toBe(200);
    const retry = await post("p1-2", t);
    expect(retry.status).toBe(200);
    const row = await answerRow("p1-2");
    expect(row?.generation).toBe(t);
  });

  it("accepts a legacy request without a generation param while the row is at generation 0", async () => {
    const res = await post("p1-3");
    expect(res.status).toBe(200);
    const row = await answerRow("p1-3");
    expect(row?.generation).toBe(0);
    expect(hoisted.objects.has(`users/${userId}/attempts/${attemptId}/p1-3.0.webm`)).toBe(true);
  });

  it("rejects a generation beyond the server-clock ceiling with 400 before touching storage", async () => {
    const tooFar = Date.now() + 25 * 60 * 60 * 1000;
    const objectsBefore = hoisted.objects.size;
    const res = await post("p1-4", tooFar);
    expect(res.status).toBe(400);
    // No blob was written for the rejected request.
    expect(hoisted.objects.size).toBe(objectsBefore);
    const row = await answerRow("p1-4");
    expect(row).toBeUndefined();
  });

  it("POST /webhooks/sepay rejects invalid API key with 401 and activates pending order on valid webhook", async () => {
    await testCtx.db.insert(paymentOrder).values({
      id: "ord_int_1",
      userId,
      planId: "week",
      amountVnd: 99_000,
      transferCode: "VFINT0000001",
      status: "pending",
      expiresAt: new Date(Date.now() + 900_000),
    });

    const payload = {
      id: 88001,
      gateway: "Vietcombank",
      transactionDate: "2026-11-16 14:30:00",
      accountNumber: "1017588888",
      subAccount: "",
      code: "VFINT0000001",
      content: "VFINT0000001",
      transferType: "in",
      transferAmount: 99_000,
      referenceCode: "FT88001",
    };

    const badRes = await app.request("/webhooks/sepay", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Apikey wrong" },
      body: JSON.stringify(payload),
    });
    expect(badRes.status).toBe(401);

    const okRes = await app.request("/webhooks/sepay", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Apikey int-test-sepay-key" },
      body: JSON.stringify(payload),
    });
    expect(okRes.status).toBe(200);
    expect(await okRes.json()).toEqual({ success: true });

    const [sub] = await testCtx.db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId));
    expect(sub?.planId).toBe("week");
    expect(sub?.pointsRemaining).toBe(48);
  });
});
