import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { attempt, attemptAnswer, attemptScore, scoringRetryLog, user } from "@vox-flow/db/schema";

import { SCORING_ENQUEUE_DELAY_SECONDS, type ScoringQueue } from "../scoring/queue";
import { startOfVietnamDayMs } from "../scoring/retry-limits";
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

  const callerFor = (userId: string, withQueue = true, clock?: { now: () => Date }) =>
    appRouter.createCaller({
      db: ctx.db,
      session: makeSession(userId),
      env: withQueue ? { SCORING_QUEUE: queue } : {},
      ...(clock ?? {}),
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
        manualRetries: 0,
        canRetry: true,
      });
      await expect(caller.scoring.status({ attemptId: "att-full" })).resolves.toEqual({
        attemptId: "att-full",
        status: "not_scored",
        scorable: false,
        manualRetries: 0,
        canRetry: true,
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
      expect(res).toEqual({ attemptId: "att-forecast", status: "queued", scorable: true, manualRetries: 1 });
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
      expect(res).toEqual({ attemptId: "att-forecast", status: "queued", scorable: true, manualRetries: 0 });
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

    describe("retry limits", () => {
      const seedFailedAttempts = async (ids: string[]) => {
        await ctx.db.insert(attempt).values(
          ids.map((id) => ({
            id,
            userId: "owner",
            mode: "part1" as const,
            status: "submitted" as const,
            topicId: "topic-1",
          })),
        );
        await ctx.db.insert(attemptScore).values(
          ids.map((id) => ({
            attemptId: id,
            userId: "owner",
            status: "failed" as const,
            tries: 1,
            lastError: "boom",
          })),
        );
      };

      it("records a retry log row stamped with the injected clock and returns manualRetries=1", async () => {
        await seedFailedAttempts(["att-r1"]);
        const nowMs = new Date("2026-11-10T02:30:00.000Z").getTime();
        const caller = callerFor("owner", true, { now: () => new Date(nowMs) });

        const res = await caller.scoring.retry({ attemptId: "att-r1" });
        expect(res).toEqual({ attemptId: "att-r1", status: "queued", scorable: true, manualRetries: 1 });

        const [row] = await ctx.db.select().from(attemptScore).where(eq(attemptScore.attemptId, "att-r1"));
        expect(row).toMatchObject({
          status: "queued",
          tries: 0,
          lastError: null,
          manualRetries: 1,
          updatedAt: new Date(nowMs),
        });

        const logs = await ctx.db.select().from(scoringRetryLog);
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({ userId: "owner", attemptId: "att-r1", createdAt: new Date(nowMs) });
      });

      it("rejects a second manual retry of the same attempt with RETRY_LIMIT_EXCEEDED", async () => {
        await seedFailedAttempts(["att-r1"]);
        const caller = callerFor("owner");
        await caller.scoring.retry({ attemptId: "att-r1" });

        await expect(caller.scoring.retry({ attemptId: "att-r1" })).rejects.toMatchObject({
          code: "BAD_REQUEST",
          message: "RETRY_LIMIT_EXCEEDED",
        });
        expect(queue.sent).toHaveLength(1);
        expect(await ctx.db.select().from(scoringRetryLog)).toHaveLength(1);
        const [row] = await ctx.db.select().from(attemptScore).where(eq(attemptScore.attemptId, "att-r1"));
        expect(row).toMatchObject({ status: "queued", manualRetries: 1 });
      });

      it("rejects retrying an attempt whose score is queued with the generic message", async () => {
        await ctx.db.insert(attemptScore).values({ attemptId: "att-forecast", userId: "owner", status: "queued" });
        await expect(callerFor("owner").scoring.retry({ attemptId: "att-forecast" })).rejects.toMatchObject({
          code: "BAD_REQUEST",
          message: "Only a failed or unscored attempt can be retried",
        });
        expect(await ctx.db.select().from(scoringRetryLog)).toHaveLength(0);
      });

      it("rejects a fourth retry in one Vietnam day with DAILY_RETRY_LIMIT_EXCEEDED", async () => {
        await seedFailedAttempts(["att-r1", "att-r2", "att-r3", "att-r4"]);
        const caller = callerFor("owner");
        for (const id of ["att-r1", "att-r2", "att-r3"]) {
          await expect(caller.scoring.retry({ attemptId: id })).resolves.toMatchObject({ manualRetries: 1 });
        }

        await expect(caller.scoring.retry({ attemptId: "att-r4" })).rejects.toMatchObject({
          code: "TOO_MANY_REQUESTS",
          message: "DAILY_RETRY_LIMIT_EXCEEDED",
        });
        // The over-quota attempt keeps its failed state untouched.
        const [row] = await ctx.db.select().from(attemptScore).where(eq(attemptScore.attemptId, "att-r4"));
        expect(row).toMatchObject({ status: "failed", manualRetries: 0, tries: 1, lastError: "boom" });
        expect((await ctx.db.select().from(scoringRetryLog)).map((l) => l.attemptId).sort()).toEqual([
          "att-r1",
          "att-r2",
          "att-r3",
        ]);
        expect(queue.sent).toHaveLength(3);
      });

      it("lets exactly 3 of 4 parallel retries through", async () => {
        await seedFailedAttempts(["att-r1", "att-r2", "att-r3", "att-r4"]);
        const caller = callerFor("owner");

        const settled = await Promise.allSettled([
          caller.scoring.retry({ attemptId: "att-r1" }),
          caller.scoring.retry({ attemptId: "att-r2" }),
          caller.scoring.retry({ attemptId: "att-r3" }),
          caller.scoring.retry({ attemptId: "att-r4" }),
        ]);

        const fulfilled = settled.filter((r) => r.status === "fulfilled");
        const rejected = settled.filter((r) => r.status === "rejected");
        expect(fulfilled).toHaveLength(3);
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
          code: "TOO_MANY_REQUESTS",
          message: "DAILY_RETRY_LIMIT_EXCEEDED",
        });
        expect(await ctx.db.select().from(scoringRetryLog)).toHaveLength(3);
        expect(queue.sent).toHaveLength(3);
      });

      it("does not count a 23:59 Vietnam retry against the next day's 00:01 quota", async () => {
        await seedFailedAttempts(["att-r1", "att-r2"]);
        // 23:59 on Nov 9 in Vietnam is 16:59 UTC; 00:01 on Nov 10 is 17:01 UTC.
        const lateNight = new Date("2026-11-09T16:59:00.000Z").getTime();
        const nextMorning = new Date("2026-11-09T17:01:00.000Z").getTime();
        expect(startOfVietnamDayMs(nextMorning)).toBeGreaterThan(startOfVietnamDayMs(lateNight));

        // Three retries logged at 23:59 exhaust the quota for Nov 9 only.
        await ctx.db.insert(scoringRetryLog).values(
          ["att-r1", "att-r2", "att-forecast"].map((attemptId) => ({
            id: `log-${attemptId}`,
            userId: "owner",
            attemptId,
            createdAt: new Date(lateNight),
          })),
        );

        const nightCaller = callerFor("owner", true, { now: () => new Date(lateNight) });
        await expect(nightCaller.scoring.status({ attemptId: "att-r2" })).resolves.toMatchObject({
          status: "failed",
          canRetry: false,
        });
        await expect(nightCaller.scoring.retry({ attemptId: "att-r2" })).rejects.toMatchObject({
          code: "TOO_MANY_REQUESTS",
          message: "DAILY_RETRY_LIMIT_EXCEEDED",
        });

        const morningCaller = callerFor("owner", true, { now: () => new Date(nextMorning) });
        await expect(morningCaller.scoring.status({ attemptId: "att-r2" })).resolves.toMatchObject({
          status: "failed",
          canRetry: true,
        });
        await expect(morningCaller.scoring.retry({ attemptId: "att-r2" })).resolves.toMatchObject({
          status: "queued",
          manualRetries: 1,
        });
        const logs = await ctx.db.select().from(scoringRetryLog).where(eq(scoringRetryLog.attemptId, "att-r2"));
        // Yesterday's seeded 23:59 log plus today's retry — the night attempt left none.
        expect(logs.map((l) => l.createdAt.getTime()).sort()).toEqual([lateNight, nextMorning]);
      });
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
