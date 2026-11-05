import { describe, expect, it } from "vitest";

import { attempt, user } from "@vox-flow/db";
import { appRouter } from "./index";
import { createTestDb } from "../test/db";

function makeSession(userId: string, email = `${userId}@voxflow.vn`) {
  return {
    user: {
      id: userId,
      email,
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

describe("disputeRouter", () => {
  it("rejects dispute.submit with FORBIDDEN when SCORE_DISPUTE_ENABLED is not true", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-1",
        name: "User 1",
        email: "u1@voxflow.vn",
        emailVerified: true,
      });

      await db.insert(attempt).values({
        id: "att-1",
        userId: "user-1",
        mode: "full",
        status: "submitted",
      });

      const caller = appRouter.createCaller({
        db,
        session: makeSession("user-1"),
        env: { SCORE_DISPUTE_ENABLED: "false" },
      });

      await expect(
        caller.dispute.submit({
          attemptId: "att-1",
          targetCriterion: "GRA",
          expectedBand: "6.5",
          reason: "Tôi đã dùng nhiều câu phức nhưng chưa được ghi nhận",
          shareConsent: false,
        }),
      ).rejects.toThrow("Tính năng báo lỗi chấm điểm hiện chưa được kích hoạt");
    } finally {
      await dispose();
    }
  });

  it("submits dispute successfully when enabled, computing dueAt exactly 72 hours later", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-1",
        name: "User 1",
        email: "u1@voxflow.vn",
        emailVerified: true,
      });

      await db.insert(attempt).values({
        id: "att-1",
        userId: "user-1",
        mode: "full",
        status: "submitted",
      });

      const caller = appRouter.createCaller({
        db,
        session: makeSession("user-1"),
        env: { SCORE_DISPUTE_ENABLED: "true" },
      });

      const before = Date.now();
      const result = await caller.dispute.submit({
        attemptId: "att-1",
        targetCriterion: "LR",
        expectedBand: "7.0",
        reason: "Từ vựng phong phú, sử dụng nhiều collocation",
        shareConsent: true,
      });
      const after = Date.now();

      expect(result.id).toBeDefined();
      expect(result.attemptId).toBe("att-1");
      expect(result.targetCriterion).toBe("LR");
      expect(result.expectedBand).toBe("7.0");
      expect(result.reason).toBe("Từ vựng phong phú, sử dụng nhiều collocation");
      expect(result.shareConsent).toBe(true);
      expect(result.status).toBe("open");

      // Verify dueAt is ~72 hours from createdAt
      const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
      const expectedDueAtMin = before + seventyTwoHoursMs;
      const expectedDueAtMax = after + seventyTwoHoursMs;
      const dueTime = new Date(result.dueAt).getTime();

      expect(dueTime).toBeGreaterThanOrEqual(expectedDueAtMin - 1000);
      expect(dueTime).toBeLessThanOrEqual(expectedDueAtMax + 1000);
    } finally {
      await dispose();
    }
  });

  it("rejects dispute.submit on attempt belonging to another user with FORBIDDEN", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values([
        { id: "victim", name: "Victim", email: "victim@voxflow.vn", emailVerified: true },
        { id: "attacker", name: "Attacker", email: "attacker@voxflow.vn", emailVerified: true },
      ]);

      await db.insert(attempt).values({
        id: "att-victim",
        userId: "victim",
        mode: "full",
        status: "submitted",
      });

      const caller = appRouter.createCaller({
        db,
        session: makeSession("attacker"),
        env: { SCORE_DISPUTE_ENABLED: "true" },
      });

      await expect(
        caller.dispute.submit({
          attemptId: "att-victim",
          targetCriterion: "GRA",
          expectedBand: "7.5",
          shareConsent: false,
        }),
      ).rejects.toThrow("Bạn không có quyền báo lỗi cho bài thi này");
    } finally {
      await dispose();
    }
  });

  it("rejects dispute.submit on unsubmitted attempt with BAD_REQUEST", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-1",
        name: "User 1",
        email: "u1@voxflow.vn",
        emailVerified: true,
      });

      await db.insert(attempt).values({
        id: "att-in-progress",
        userId: "user-1",
        mode: "full",
        status: "in_progress",
      });

      const caller = appRouter.createCaller({
        db,
        session: makeSession("user-1"),
        env: { SCORE_DISPUTE_ENABLED: "true" },
      });

      await expect(
        caller.dispute.submit({
          attemptId: "att-in-progress",
          targetCriterion: "ALL",
          expectedBand: "6.0",
          shareConsent: false,
        }),
      ).rejects.toThrow("Chỉ bài thi đã nộp mới có thể gửi báo lỗi");
    } finally {
      await dispose();
    }
  });

  it("rejects duplicate active dispute submission on the same attempt with CONFLICT", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-1",
        name: "User 1",
        email: "u1@voxflow.vn",
        emailVerified: true,
      });

      await db.insert(attempt).values({
        id: "att-1",
        userId: "user-1",
        mode: "full",
        status: "submitted",
      });

      const caller = appRouter.createCaller({
        db,
        session: makeSession("user-1"),
        env: { SCORE_DISPUTE_ENABLED: "true" },
      });

      await caller.dispute.submit({
        attemptId: "att-1",
        targetCriterion: "GRA",
        expectedBand: "6.5",
        reason: "Lần 1",
        shareConsent: false,
      });

      await expect(
        caller.dispute.submit({
          attemptId: "att-1",
          targetCriterion: "FC",
          expectedBand: "7.0",
          reason: "Lần 2 cố gửi trùng",
          shareConsent: true,
        }),
      ).rejects.toThrow("Bài thi này đã có báo lỗi đang được xử lý");
    } finally {
      await dispose();
    }
  });

  it("dispute.get returns null when no dispute exists, and dispute record when it does", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-1",
        name: "User 1",
        email: "u1@voxflow.vn",
        emailVerified: true,
      });

      await db.insert(attempt).values({
        id: "att-1",
        userId: "user-1",
        mode: "full",
        status: "submitted",
      });

      const callerDisabled = appRouter.createCaller({
        db,
        session: makeSession("user-1"),
        env: { SCORE_DISPUTE_ENABLED: "false" },
      });

      const resInitial = await callerDisabled.dispute.get({ attemptId: "att-1" });
      expect(resInitial.enabled).toBe(false);
      expect(resInitial.dispute).toBeNull();

      const callerEnabled = appRouter.createCaller({
        db,
        session: makeSession("user-1"),
        env: { SCORE_DISPUTE_ENABLED: "true" },
      });

      await callerEnabled.dispute.submit({
        attemptId: "att-1",
        targetCriterion: "PRON",
        expectedBand: "7.5",
        reason: "Phát âm rõ ràng chuẩn IPA",
        shareConsent: true,
      });

      const resAfter = await callerEnabled.dispute.get({ attemptId: "att-1" });
      expect(resAfter.enabled).toBe(true);
      expect(resAfter.dispute).not.toBeNull();
      expect(resAfter.dispute?.targetCriterion).toBe("PRON");
      expect(resAfter.dispute?.expectedBand).toBe("7.5");
      expect(resAfter.dispute?.shareConsent).toBe(true);
      expect(resAfter.dispute?.status).toBe("open");
    } finally {
      await dispose();
    }
  });

  it("dispute.get rejects unauthorized user viewing someone else's attempt", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values([
        { id: "owner", name: "Owner", email: "owner@voxflow.vn", emailVerified: true },
        { id: "snoop", name: "Snoop", email: "snoop@voxflow.vn", emailVerified: true },
      ]);

      await db.insert(attempt).values({
        id: "att-owner",
        userId: "owner",
        mode: "full",
        status: "submitted",
      });

      const caller = appRouter.createCaller({
        db,
        session: makeSession("snoop"),
        env: { SCORE_DISPUTE_ENABLED: "true" },
      });

      await expect(caller.dispute.get({ attemptId: "att-owner" })).rejects.toThrow(
        "Bạn không có quyền xem thông tin bài thi này",
      );
    } finally {
      await dispose();
    }
  });
});
