import { attempt, scoreDispute, user } from "@vox-flow/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { checkAndWarnOverdueDisputes, OVERDUE_WARNING_THRESHOLD_MS } from "./overdue";

describe("checkAndWarnOverdueDisputes", () => {
  let testCtx: TestDbContext;
  const testUser = {
    id: "usr_test_overdue",
    name: "Test User",
    email: "test@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    testCtx = await createTestDb();
    await testCtx.db.insert(user).values(testUser);
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  it("marks active disputes approaching deadline (< 12 hours) and does not double-warn", async () => {
    const now = new Date("2026-11-05T12:00:00.000Z");

    // Attempt 1: due in 6 hours (should be warned)
    await testCtx.db.insert(attempt).values({
      id: "att_ovd_1",
      userId: testUser.id,
      mode: "full",
      status: "submitted",
    });
    await testCtx.db.insert(scoreDispute).values({
      id: "disp_ovd_1",
      attemptId: "att_ovd_1",
      userId: testUser.id,
      targetCriterion: "GRA",
      expectedBand: "6.5",
      status: "open",
      dueAt: new Date(now.getTime() + 6 * 3600 * 1000),
    });

    // Attempt 2: due in 24 hours (should NOT be warned)
    await testCtx.db.insert(attempt).values({
      id: "att_ovd_2",
      userId: testUser.id,
      mode: "full",
      status: "submitted",
    });
    await testCtx.db.insert(scoreDispute).values({
      id: "disp_ovd_2",
      attemptId: "att_ovd_2",
      userId: testUser.id,
      targetCriterion: "FC",
      expectedBand: "7.0",
      status: "open",
      dueAt: new Date(now.getTime() + 24 * 3600 * 1000),
    });

    // Attempt 3: due in 5 hours but already resolved (should NOT be warned)
    await testCtx.db.insert(attempt).values({
      id: "att_ovd_3",
      userId: testUser.id,
      mode: "full",
      status: "submitted",
    });
    await testCtx.db.insert(scoreDispute).values({
      id: "disp_ovd_3",
      attemptId: "att_ovd_3",
      userId: testUser.id,
      targetCriterion: "LR",
      expectedBand: "6.0",
      status: "resolved",
      resolvedAt: new Date(now.getTime() - 1000),
      dueAt: new Date(now.getTime() + 5 * 3600 * 1000),
    });

    // First run
    const result1 = await checkAndWarnOverdueDisputes(testCtx.db, now);
    expect(result1.warnedCount).toBe(1);
    expect(result1.warnedIds).toEqual(["disp_ovd_1"]);

    // Second run (simulating cron running again): should be idempotent
    const result2 = await checkAndWarnOverdueDisputes(testCtx.db, now);
    expect(result2.warnedCount).toBe(0);
    expect(result2.warnedIds).toEqual([]);
  });

  it("handles exact 12-hour boundary correctly", async () => {
    const now = new Date("2026-11-05T12:00:00.000Z");

    // Attempt at exact threshold
    await testCtx.db.insert(attempt).values({
      id: "att_ovd_exact",
      userId: testUser.id,
      mode: "full",
      status: "submitted",
    });
    await testCtx.db.insert(scoreDispute).values({
      id: "disp_ovd_exact",
      attemptId: "att_ovd_exact",
      userId: testUser.id,
      targetCriterion: "PRON",
      expectedBand: "7.5",
      status: "open",
      dueAt: new Date(now.getTime() + OVERDUE_WARNING_THRESHOLD_MS),
    });

    // Attempt at threshold + 1 second
    await testCtx.db.insert(attempt).values({
      id: "att_ovd_beyond",
      userId: testUser.id,
      mode: "full",
      status: "submitted",
    });
    await testCtx.db.insert(scoreDispute).values({
      id: "disp_ovd_beyond",
      attemptId: "att_ovd_beyond",
      userId: testUser.id,
      targetCriterion: "PRON",
      expectedBand: "7.5",
      status: "open",
      dueAt: new Date(now.getTime() + OVERDUE_WARNING_THRESHOLD_MS + 1000),
    });

    const result = await checkAndWarnOverdueDisputes(testCtx.db, now);
    expect(result.warnedIds).toContain("disp_ovd_exact");
    expect(result.warnedIds).not.toContain("disp_ovd_beyond");
  });
});
