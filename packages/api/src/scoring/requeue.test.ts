import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { attempt, attemptScore, quotaReservation, user } from "@vox-flow/db/schema";

import { reserve } from "../quota/quota";
import { createTestDb, type TestDbContext } from "../test/db";
import type { ScoringQueueMessage } from "./types";
import { requeueStaleScores, STALE_SCORE_AFTER_MS } from "./requeue";

describe("requeueStaleScores", () => {
  let ctx: TestDbContext;
  const now = new Date("2026-11-10T12:00:00.000Z");
  const stale = new Date(now.getTime() - STALE_SCORE_AFTER_MS - 1000);
  const fresh = new Date(now.getTime() - 60_000);

  beforeEach(async () => {
    ctx = await createTestDb();
    await ctx.db.insert(user).values({ id: "u", name: "U", email: "u@voxflow.vn" });
    const ids = ["stale-queued", "stale-processing", "stale-exhausted", "fresh", "done", "stale-created"];
    await ctx.db.insert(attempt).values(ids.map((id) => ({ id, userId: "u", mode: "part1", topicId: "t" })));
    await ctx.db.insert(attemptScore).values([
      { attemptId: "stale-queued", userId: "u", status: "queued", updatedAt: stale },
      { attemptId: "stale-processing", userId: "u", status: "processing", tries: 2, updatedAt: stale },
      { attemptId: "stale-exhausted", userId: "u", status: "processing", tries: 3, updatedAt: stale },
      { attemptId: "fresh", userId: "u", status: "queued", updatedAt: fresh },
      { attemptId: "done", userId: "u", status: "done", updatedAt: stale },
      // Never updated since submit: falls back to created_at.
      { attemptId: "stale-created", userId: "u", status: "queued", createdAt: stale },
    ]);
  });

  afterEach(async () => {
    await ctx.dispose();
  });

  it("re-enqueues stale rows with tries left and fails exhausted ones", async () => {
    const sent: ScoringQueueMessage[] = [];
    const result = await requeueStaleScores(ctx.db, { send: async (m) => void sent.push(m) }, now);

    expect(result).toEqual({ requeued: 3, failed: 1 });
    expect(sent.map((m) => m.attemptId).sort()).toEqual(["stale-created", "stale-processing", "stale-queued"]);

    const [exhausted] = await ctx.db
      .select()
      .from(attemptScore)
      .where(eq(attemptScore.attemptId, "stale-exhausted"));
    expect(exhausted).toMatchObject({ status: "failed", lastError: "Scoring timed out" });

    // An expired processing claim is released so the re-sent message can claim it.
    const [released] = await ctx.db
      .select()
      .from(attemptScore)
      .where(eq(attemptScore.attemptId, "stale-processing"));
    expect(released).toMatchObject({ status: "queued", tries: 2, updatedAt: now });

    // Touched rows are not re-sent by an immediate second sweep.
    const again = await requeueStaleScores(ctx.db, { send: async (m) => void sent.push(m) }, now);
    expect(again).toEqual({ requeued: 0, failed: 0 });
  });

  it("leaves rows untouched when the queue binding is missing", async () => {
    const result = await requeueStaleScores(ctx.db, undefined, now);
    expect(result.requeued).toBe(0);
    const [row] = await ctx.db.select().from(attemptScore).where(eq(attemptScore.attemptId, "stale-queued"));
    expect(row!.updatedAt).toEqual(stale);
  });

  it("releases free quota points and retains sunkCostVnd when failing an exhausted score", async () => {
    await reserve(ctx.db, {
      userId: "u",
      attemptId: "stale-exhausted",
      target: { kind: "mock", mode: "part1" },
      budgetCapVnd: 33_000,
      now,
    });

    const result = await requeueStaleScores(ctx.db, { send: async () => {} }, now);
    expect(result.failed).toBe(1);

    const [res] = await ctx.db
      .select()
      .from(quotaReservation)
      .where(eq(quotaReservation.attemptId, "stale-exhausted"));
    expect(res).toMatchObject({
      status: "released",
      sunkCostVnd: 1000,
      refundCount: 1,
    });
  });
});
