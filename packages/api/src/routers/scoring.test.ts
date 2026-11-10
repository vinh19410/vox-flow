import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { attempt, attemptAnswer, attemptScore, user } from "@vox-flow/db/schema";

import { SCORING_ENQUEUE_DELAY_SECONDS, type ScoringQueue } from "../scoring/queue";
import type { ScoredCriterion, ScoringQueueMessage } from "../scoring/types";
import { createTestDb, type TestDbContext } from "../test/db";
import { ATTEMPT_ALREADY_SUBMITTED_MESSAGE } from "./attempt";
import { appRouter } from "./index";

function makeSession(userId: string) {
  return {
    user: {
      id: userId,
      email: `${userId}@voxflow.vn`,
      name: `User ${userId}`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: `session-${userId}`,
      userId,
      token: `token-${userId}`,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function makeQueue(): ScoringQueue & {
  sent: ScoringQueueMessage[];
  options: Array<{ delaySeconds?: number } | undefined>;
} {
  const sent: ScoringQueueMessage[] = [];
  const options: Array<{ delaySeconds?: number } | undefined> = [];
  return {
    sent,
    options,
    async send(body, opts) {
      sent.push(body);
      options.push(opts);
    },
  };
}

const CRITERIA: ScoredCriterion[] = (["FC", "LR", "GRA", "P"] as const).map((key) => ({
  key,
  band: 6.5,
  summary: "Tóm tắt",
  evidence: [],
  improve: [],
}));

describe("scoringRouter", () => {
  let ctx: TestDbContext;
  let queue: ReturnType<typeof makeQueue>;

  const callerFor = (userId: string, withQueue = true) =>
    appRouter.createCaller({
      db: ctx.db,
      session: makeSession(userId),
      env: withQueue ? { SCORING_QUEUE: queue } : {},
    });

  beforeEach(async () => {
    ctx = await createTestDb();
    queue = makeQueue();
    await ctx.db.insert(user).values([
      { id: "owner", name: "Owner", email: "owner@voxflow.vn" },
      { id: "other", name: "Other", email: "other@voxflow.vn" },
    ]);
    await ctx.db.insert(attempt).values([
      { id: "att-forecast", userId: "owner", mode: "part1", status: "submitted", topicId: "topic-1" },
      { id: "att-full", userId: "owner", mode: "full", status: "submitted" },
    ]);
  });

  afterEach(async () => {
    await ctx.dispose();
  });

  describe("status", () => {
    it("returns not_scored with scorable flag when no score row exists", async () => {
      const caller = callerFor("owner");
      await expect(caller.scoring.status({ attemptId: "att-forecast" })).resolves.toEqual({
        attemptId: "att-forecast",
        status: "not_scored",
        scorable: true,
      });
      await expect(caller.scoring.status({ attemptId: "att-full" })).resolves.toEqual({
        attemptId: "att-full",
        status: "not_scored",
        scorable: false,
      });
    });

    it("returns the stored status", async () => {
      await ctx.db.insert(attemptScore).values({ attemptId: "att-forecast", userId: "owner", status: "processing" });
      const res = await callerFor("owner").scoring.status({ attemptId: "att-forecast" });
      expect(res.status).toBe("processing");
    });

    it("is owner-only", async () => {
      await expect(callerFor("other").scoring.status({ attemptId: "att-forecast" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(callerFor("owner").scoring.status({ attemptId: "nope" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("retry", () => {
    it("resets a failed score to queued with tries=0 and enqueues it", async () => {
      await ctx.db.insert(attemptScore).values({
        attemptId: "att-forecast",
        userId: "owner",
        status: "failed",
        tries: 3,
        lastError: "boom",
      });

      const res = await callerFor("owner").scoring.retry({ attemptId: "att-forecast" });
      expect(res).toEqual({ attemptId: "att-forecast", status: "queued", scorable: true });
      expect(queue.sent).toEqual([{ attemptId: "att-forecast" }]);
      expect(queue.options).toEqual([{ delaySeconds: SCORING_ENQUEUE_DELAY_SECONDS }]);

      const [row] = await ctx.db.select().from(attemptScore).where(eq(attemptScore.attemptId, "att-forecast"));
      expect(row).toMatchObject({ status: "queued", tries: 0, lastError: null });
    });

    it.each(["queued", "processing", "done"] as const)("rejects retry from %s", async (status) => {
      await ctx.db.insert(attemptScore).values({ attemptId: "att-forecast", userId: "owner", status });
      await expect(callerFor("owner").scoring.retry({ attemptId: "att-forecast" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(queue.sent).toHaveLength(0);
    });

    it("creates and enqueues a score for a submitted forecast attempt without a score row", async () => {
      const res = await callerFor("owner").scoring.retry({ attemptId: "att-forecast" });
      expect(res).toEqual({ attemptId: "att-forecast", status: "queued", scorable: true });
      expect(queue.sent).toEqual([{ attemptId: "att-forecast" }]);
      const [row] = await ctx.db.select().from(attemptScore).where(eq(attemptScore.attemptId, "att-forecast"));
      expect(row).toMatchObject({ status: "queued", tries: 0, userId: "owner" });

      // The second call sees a queued row and is rejected without enqueueing again.
      await expect(callerFor("owner").scoring.retry({ attemptId: "att-forecast" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(queue.sent).toHaveLength(1);
    });

    it("rejects the unscored rescue path for unsubmitted or non-forecast attempts", async () => {
      await ctx.db
        .insert(attempt)
        .values({ id: "att-draft", userId: "owner", mode: "part1", status: "in_progress", topicId: "topic-1" });
      for (const attemptId of ["att-draft", "att-full"]) {
        await expect(callerFor("owner").scoring.retry({ attemptId })).rejects.toMatchObject({
          code: "BAD_REQUEST",
        });
      }
      expect(queue.sent).toHaveLength(0);
      expect(await ctx.db.select().from(attemptScore)).toHaveLength(0);
    });

    it("rejects retry for non-owners and unknown attempts", async () => {
      await expect(callerFor("owner").scoring.retry({ attemptId: "nope" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      await expect(callerFor("other").scoring.retry({ attemptId: "att-forecast" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await ctx.db.insert(attemptScore).values({ attemptId: "att-forecast", userId: "owner", status: "failed" });
      await expect(callerFor("other").scoring.retry({ attemptId: "att-forecast" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(queue.sent).toHaveLength(0);
    });

    it("still resets when the queue binding is absent", async () => {
      await ctx.db.insert(attemptScore).values({ attemptId: "att-forecast", userId: "owner", status: "failed" });
      const res = await callerFor("owner", false).scoring.retry({ attemptId: "att-forecast" });
      expect(res.status).toBe("queued");
    });
  });

  describe("getResult", () => {
    beforeEach(async () => {
      await ctx.db.insert(attemptAnswer).values([
        {
          id: "a-3",
          attemptId: "att-forecast",
          questionKey: "p2-1",
          questionText: "Describe a place",
          partNumber: 2,
          orderIndex: 0,
          audioKey: "users/owner/attempts/att-forecast/p2-1.webm",
          durationMs: 60000,
          mimeType: "audio/webm",
          transcript: "Part two answer",
        },
        {
          id: "a-2",
          attemptId: "att-forecast",
          questionKey: "p1-2",
          questionText: "Second",
          partNumber: 1,
          orderIndex: 1,
          audioKey: "users/owner/attempts/att-forecast/p1-2.webm",
          durationMs: 9000,
          mimeType: "audio/webm",
        },
        {
          id: "a-1",
          attemptId: "att-forecast",
          questionKey: "p1-1",
          questionText: "First",
          partNumber: 1,
          orderIndex: 0,
          audioKey: "users/owner/attempts/att-forecast/p1-1.webm",
          durationMs: 8000,
          mimeType: "audio/webm",
          transcript: "First answer",
        },
      ]);
    });

    it("returns null until the score is done", async () => {
      const caller = callerFor("owner");
      await expect(caller.scoring.getResult({ attemptId: "att-forecast" })).resolves.toBeNull();
      for (const status of ["queued", "processing", "failed"] as const) {
        await ctx.db
          .insert(attemptScore)
          .values({ attemptId: "att-forecast", userId: "owner", status })
          .onConflictDoUpdate({ target: attemptScore.attemptId, set: { status } });
        await expect(caller.scoring.getResult({ attemptId: "att-forecast" })).resolves.toBeNull();
      }
    });

    it("returns the result with answers ordered by part and order, without run data", async () => {
      const scoredAt = new Date("2026-11-10T03:00:00.000Z");
      await ctx.db.insert(attemptScore).values({
        attemptId: "att-forecast",
        userId: "owner",
        status: "done",
        overall: 6.5,
        criteriaJson: JSON.stringify(CRITERIA),
        oneLiner: "Khá tốt",
        model: "gpt-6-luna",
        costUsd: 0.02,
        scoredAt,
      });

      const result = await callerFor("owner").scoring.getResult({ attemptId: "att-forecast" });
      expect(result).toEqual({
        attemptId: "att-forecast",
        topicId: "topic-1",
        overall: 6.5,
        oneLiner: "Khá tốt",
        criteria: CRITERIA,
        answers: [
          { questionKey: "p1-1", questionText: "First", partNumber: 1, durationMs: 8000, transcript: "First answer" },
          { questionKey: "p1-2", questionText: "Second", partNumber: 1, durationMs: 9000, transcript: "" },
          {
            questionKey: "p2-1",
            questionText: "Describe a place",
            partNumber: 2,
            durationMs: 60000,
            transcript: "Part two answer",
          },
        ],
        scoredAt: scoredAt.getTime(),
      });
    });

    it("is owner-only", async () => {
      await expect(callerFor("other").scoring.getResult({ attemptId: "att-forecast" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });
});

describe("attempt.submit scoring enqueue", () => {
  let ctx: TestDbContext;
  let queue: ReturnType<typeof makeQueue>;

  beforeEach(async () => {
    ctx = await createTestDb();
    queue = makeQueue();
    await ctx.db.insert(user).values({ id: "owner", name: "Owner", email: "owner@voxflow.vn" });
  });

  afterEach(async () => {
    await ctx.dispose();
  });

  const caller = (env: Record<string, unknown>) =>
    appRouter.createCaller({ db: ctx.db, session: makeSession("owner"), env });

  it("creates a queued score and enqueues forecast attempts exactly once", async () => {
    await ctx.db.insert(attempt).values({ id: "att-f", userId: "owner", mode: "part1", topicId: "topic-1" });

    await caller({ SCORING_QUEUE: queue }).attempt.submit({ attemptId: "att-f" });
    expect(queue.sent).toEqual([{ attemptId: "att-f" }]);
    // Delayed so answer uploads still in flight at submit time land first.
    expect(queue.options).toEqual([{ delaySeconds: SCORING_ENQUEUE_DELAY_SECONDS }]);
    expect(SCORING_ENQUEUE_DELAY_SECONDS).toBeGreaterThan(0);
    const [row] = await ctx.db.select().from(attemptScore).where(eq(attemptScore.attemptId, "att-f"));
    expect(row).toMatchObject({ status: "queued", userId: "owner", tries: 0 });

    // A repeated submit is rejected with the specific already-submitted message and does not enqueue again.
    await expect(caller({ SCORING_QUEUE: queue }).attempt.submit({ attemptId: "att-f" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: ATTEMPT_ALREADY_SUBMITTED_MESSAGE,
    });
    expect(queue.sent).toHaveLength(1);
  });

  it("reports an abandoned attempt differently from an already-submitted one", async () => {
    await ctx.db
      .insert(attempt)
      .values({ id: "att-ab", userId: "owner", mode: "part1", topicId: "topic-1", status: "abandoned" });
    const err = await caller({ SCORING_QUEUE: queue })
      .attempt.submit({ attemptId: "att-ab" })
      .catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "BAD_REQUEST" });
    expect((err as Error).message).not.toBe(ATTEMPT_ALREADY_SUBMITTED_MESSAGE);
    expect(queue.sent).toHaveLength(0);
  });

  it("leaves the attempt in progress when the score row cannot be written", async () => {
    await ctx.db.insert(attempt).values({ id: "att-f", userId: "owner", mode: "part1", topicId: "topic-1" });
    // Make the score insert fail inside the batch.
    await ctx.d1.prepare("DROP TABLE attempt_score").run();

    await expect(caller({ SCORING_QUEUE: queue }).attempt.submit({ attemptId: "att-f" })).rejects.toThrow();
    const [row] = await ctx.db.select().from(attempt).where(eq(attempt.id, "att-f"));
    expect(row).toMatchObject({ status: "in_progress", submittedAt: null });
    expect(queue.sent).toHaveLength(0);
  });

  it("does not enqueue when a score row already exists", async () => {
    await ctx.db.insert(attempt).values({ id: "att-f", userId: "owner", mode: "part1", topicId: "topic-1" });
    await ctx.db.insert(attemptScore).values({ attemptId: "att-f", userId: "owner", status: "processing" });

    await caller({ SCORING_QUEUE: queue }).attempt.submit({ attemptId: "att-f" });
    expect(queue.sent).toHaveLength(0);
  });

  it("never scores non-forecast attempts", async () => {
    await ctx.db.insert(attempt).values({ id: "att-full", userId: "owner", mode: "full" });

    await caller({ SCORING_QUEUE: queue }).attempt.submit({ attemptId: "att-full" });
    expect(queue.sent).toHaveLength(0);
    expect(await ctx.db.select().from(attemptScore)).toHaveLength(0);
  });

  it("still submits when the queue binding is missing or the send fails", async () => {
    await ctx.db.insert(attempt).values([
      { id: "att-a", userId: "owner", mode: "part1", topicId: "topic-1" },
      { id: "att-b", userId: "owner", mode: "part1", topicId: "topic-1" },
    ]);

    await expect(caller({}).attempt.submit({ attemptId: "att-a" })).resolves.toMatchObject({ success: true });
    const failing: ScoringQueue = {
      send: async () => {
        throw new Error("queue down");
      },
    };
    await expect(caller({ SCORING_QUEUE: failing }).attempt.submit({ attemptId: "att-b" })).resolves.toMatchObject({
      success: true,
    });
    const rows = await ctx.db.select().from(attemptScore);
    expect(rows.map((r) => r.status)).toEqual(["queued", "queued"]);
  });
});
