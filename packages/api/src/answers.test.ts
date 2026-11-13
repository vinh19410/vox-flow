import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { attempt, attemptAnswer, user } from "@vox-flow/db";
import { upsertAnswerRecording } from "./answers";
import { createTestDb, type TestDbContext } from "./test/db";

type AnswerValues = typeof attemptAnswer.$inferInsert;

// Helper behavior is proven on a REAL D1 SQLite instance (Miniflare), not mocks:
// the conditional conflict update (`setWhere`) and empty `returning()` on a lost
// write are the load-bearing SQLite semantics this plan relies on.
describe("upsertAnswerRecording (real D1)", () => {
  let testCtx: TestDbContext;
  const userId = "usr_gen_1";
  const attemptId = "att_gen_1";

  const values = (overrides: Partial<AnswerValues> = {}): AnswerValues => ({
    id: "ans_gen_new",
    attemptId,
    questionKey: "p1-1",
    questionText: "Why do people travel?",
    partNumber: 1,
    orderIndex: 0,
    audioKey: `users/${userId}/attempts/${attemptId}/p1-1.1000.webm`,
    durationMs: 9000,
    mimeType: "audio/webm",
    generation: 1000,
    ...overrides,
  });

  beforeAll(async () => {
    testCtx = await createTestDb();
    await testCtx.db.insert(user).values({ id: userId, name: "User", email: "gen@example.com" });
    await testCtx.db.insert(attempt).values({ id: attemptId, userId, mode: "full", status: "in_progress" });
  });

  afterAll(async () => {
    await testCtx?.dispose();
  });

  async function currentRow(questionKey: string) {
    const [row] = await testCtx.db
      .select()
      .from(attemptAnswer)
      .where(eq(attemptAnswer.questionKey, questionKey));
    return row;
  }

  it("inserts a fresh answer with its generation", async () => {
    const updated = await upsertAnswerRecording(testCtx.db, values({ id: "ans_gen_insert", questionKey: "p1-1" }));
    expect(updated).toHaveLength(1);
    const rows = await testCtx.db.select().from(attemptAnswer);
    const inserted = rows.find((r) => r.id === "ans_gen_insert");
    expect(inserted?.generation).toBe(1000);
  });

  it("wins when incoming generation is higher and updates the row", async () => {
    await testCtx.db.insert(attemptAnswer).values(
      values({
        id: "ans_gen_win", questionKey: "p1-2",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-2.100.webm`,
        generation: 100,
        durationMs: 1111,
      }),
    );
    const updated = await upsertAnswerRecording(
      testCtx.db,
      values({
        id: "ans_gen_win",
        questionKey: "p1-2",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-2.200.webm`,
        generation: 200,
        durationMs: 2222,
      }),
    );
    expect(updated).toHaveLength(1);
    const row = await currentRow("p1-2");
    expect(row?.id).toBe("ans_gen_win");
    expect(row?.generation).toBe(200);
    expect(row?.audioKey).toBe(`users/${userId}/attempts/${attemptId}/p1-2.200.webm`);
    expect(row?.durationMs).toBe(2222);
  });

  it("loses when incoming generation is lower: returning() is empty and the row keeps the stored generation", async () => {
    await testCtx.db.insert(attemptAnswer).values(
      values({
        id: "ans_gen_lose",
        questionKey: "p1-3",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-3.500.webm`,
        generation: 500,
      }),
    );
    const updated = await upsertAnswerRecording(
      testCtx.db,
      values({
        id: "ans_gen_lose",
        questionKey: "p1-3",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-3.400.webm`,
        generation: 400,
      }),
    );
    expect(updated).toHaveLength(0);
    const row = await currentRow("p1-3");
    expect(row?.generation).toBe(500);
    expect(row?.audioKey).toBe(`users/${userId}/attempts/${attemptId}/p1-3.500.webm`);
  });

  it("accepts an equal generation retry and the row reflects the last payload", async () => {
    await testCtx.db.insert(attemptAnswer).values(
      values({
        id: "ans_gen_equal",
        questionKey: "p1-4",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-4.300.webm`,
        generation: 300,
        durationMs: 1000,
      }),
    );
    const updated = await upsertAnswerRecording(
      testCtx.db,
      values({
        id: "ans_gen_equal",
        questionKey: "p1-4",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-4.300.webm`,
        generation: 300,
        durationMs: 1000,
      }),
    );
    expect(updated).toHaveLength(1);
    const row = await currentRow("p1-4");
    expect(row?.generation).toBe(300);
    expect(row?.durationMs).toBe(1000);
  });

  it("clears stale saved transcript on strictly higher generation, while equal-generation retry preserves it", async () => {
    await testCtx.db.insert(attemptAnswer).values(
      values({
        id: "ans_gen_transcript",
        questionKey: "p1-5",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-5.100.webm`,
        generation: 100,
        durationMs: 1200,
        transcript: "Original transcript from generation 100",
      }),
    );

    // Equal-generation network retry without transcript preserves existing transcript
    const retryUpdated = await upsertAnswerRecording(
      testCtx.db,
      values({
        id: "ans_gen_transcript",
        questionKey: "p1-5",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-5.100.webm`,
        generation: 100,
        durationMs: 1200,
      }),
    );
    expect(retryUpdated).toHaveLength(1);
    expect(retryUpdated[0]?.transcript).toBe("Original transcript from generation 100");
    expect((await currentRow("p1-5"))?.transcript).toBe(
      "Original transcript from generation 100",
    );

    // Higher-generation re-recording without transcript clears stale transcript to null
    const newerUpdated = await upsertAnswerRecording(
      testCtx.db,
      values({
        id: "ans_gen_transcript",
        questionKey: "p1-5",
        audioKey: `users/${userId}/attempts/${attemptId}/p1-5.200.webm`,
        generation: 200,
        durationMs: 1500,
      }),
    );
    expect(newerUpdated).toHaveLength(1);
    expect(newerUpdated[0]?.generation).toBe(200);
    expect(newerUpdated[0]?.transcript).toBeNull();
    const row = await currentRow("p1-5");
    expect(row?.generation).toBe(200);
    expect(row?.transcript).toBeNull();
  });
});
