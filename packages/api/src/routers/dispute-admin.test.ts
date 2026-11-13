import { attempt, attemptAnswer, scoreDispute, user } from "@vox-flow/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";

const fixtureTimestamp = new Date("2026-11-05T12:00:00.000Z");

const adminUser = {
  id: "usr_admin_owner",
  name: "Product Owner",
  email: "owner@voxflow.ai",
  emailVerified: false,
  image: null,
  createdAt: fixtureTimestamp,
  updatedAt: fixtureTimestamp,
};

const studentUser1 = {
  id: "usr_student_alpha",
  name: "Student Alpha",
  email: "alpha@example.com",
  emailVerified: false,
  image: null,
  createdAt: fixtureTimestamp,
  updatedAt: fixtureTimestamp,
};

const studentUser2 = {
  id: "usr_student_beta",
  name: "Student Beta",
  email: "beta@example.com",
  emailVerified: false,
  image: null,
  createdAt: fixtureTimestamp,
  updatedAt: fixtureTimestamp,
};

const mockEnv = {
  ADMIN_EMAILS: "owner@voxflow.ai, admin-backup@voxflow.ai",
  SCORE_DISPUTE_ENABLED: "true",
};

function createCallerWithDb(
  db: TestDbContext["db"],
  u: typeof adminUser | null,
  env: { ADMIN_EMAILS?: string; SCORE_DISPUTE_ENABLED?: string } | undefined = mockEnv,
  now?: () => Date,
) {
  return appRouter.createCaller({
    db,
    env,
    now,
    session: u
      ? {
          session: {
            id: `sess_${u.id}`,
            userId: u.id,
            expiresAt: new Date(fixtureTimestamp.getTime() + 3600 * 1000),
            createdAt: fixtureTimestamp,
            updatedAt: fixtureTimestamp,
            token: `tok_${u.id}`,
          },
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            emailVerified: u.emailVerified,
            image: u.image,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          },
        }
      : null,
  });
}

describe("dispute-admin router", () => {
  let testCtx: TestDbContext;

  beforeAll(async () => {
    testCtx = await createTestDb();
    await testCtx.db.insert(user).values([adminUser, studentUser1, studentUser2]);
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  function createCaller(
    u: typeof adminUser | null,
    env: { ADMIN_EMAILS?: string; SCORE_DISPUTE_ENABLED?: string } | undefined = mockEnv,
    now?: () => Date,
  ) {
    return createCallerWithDb(testCtx.db, u, env, now);
  }

  describe("checkAdmin and authentication guard", () => {
    it("allows admin user", async () => {
      const caller = createCaller(adminUser);
      const res = await caller.disputeAdmin.checkAdmin();
      expect(res).toEqual({ isAdmin: true });
    });

    it("rejects non-admin user with FORBIDDEN", async () => {
      const caller = createCaller(studentUser1);
      await expect(caller.disputeAdmin.checkAdmin()).rejects.toThrowError(TRPCError);
      await expect(caller.disputeAdmin.checkAdmin()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("rejects unauthenticated caller with UNAUTHORIZED", async () => {
      const caller = createCaller(null);
      await expect(caller.disputeAdmin.checkAdmin()).rejects.toThrowError(TRPCError);
      await expect(caller.disputeAdmin.checkAdmin()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });

  describe("queue and getCase procedures", () => {
    const baseNow = new Date("2026-11-05T12:00:00.000Z");

    beforeAll(async () => {
      // Seed attempt 1 (with audio consent = true)
      await testCtx.db.insert(attempt).values({
        id: "att_case_consent",
        userId: studentUser1.id,
        mode: "full",
        status: "submitted",
        submittedAt: baseNow,
      });

      await testCtx.db.insert(attemptAnswer).values({
        id: "ans_case_1",
        attemptId: "att_case_consent",
        questionKey: "p1_q1",
        questionText: "Describe your hometown",
        partNumber: 1,
        orderIndex: 0,
        audioKey: "audio/att_case_consent/ans_case_1.webm",
        durationMs: 15000,
        mimeType: "audio/webm",
      });

      await testCtx.db.insert(scoreDispute).values({
        id: "disp_case_consent",
        attemptId: "att_case_consent",
        userId: studentUser1.id,
        targetCriterion: "FC",
        expectedBand: "6.5",
        reason: "Pronunciation was clear",
        shareConsent: true,
        status: "open",
        previousBand: "6.0",
        dueAt: new Date(baseNow.getTime() + 48 * 3600 * 1000), // due in 48h
        createdAt: baseNow,
      });

      // Seed attempt 2 (without audio consent: shareConsent = false)
      await testCtx.db.insert(attempt).values({
        id: "att_case_no_consent",
        userId: studentUser2.id,
        mode: "full",
        status: "submitted",
        submittedAt: baseNow,
      });

      await testCtx.db.insert(attemptAnswer).values({
        id: "ans_case_2",
        attemptId: "att_case_no_consent",
        questionKey: "p1_q2",
        questionText: "Do you work or study?",
        partNumber: 1,
        orderIndex: 0,
        audioKey: "audio/att_case_no_consent/ans_case_2.webm",
        durationMs: 12000,
        mimeType: "audio/webm",
      });

      await testCtx.db.insert(scoreDispute).values({
        id: "disp_case_no_consent",
        attemptId: "att_case_no_consent",
        userId: studentUser2.id,
        targetCriterion: "GRA",
        expectedBand: "7.0",
        reason: "Used complex sentences",
        shareConsent: false,
        status: "open",
        previousBand: "6.5",
        dueAt: new Date(baseNow.getTime() + 10 * 3600 * 1000), // due in 10h (near overdue!)
        createdAt: baseNow,
      });
    });

    it("queue sorts disputes by dueAt ascending and marks nearOverdue", async () => {
      const adminCaller = createCaller(adminUser, mockEnv, () => baseNow);
      const queue = await adminCaller.disputeAdmin.queue();

      expect(queue.length).toBeGreaterThanOrEqual(2);
      // disp_case_no_consent is due in 10h, disp_case_consent is due in 48h
      const index10h = queue.findIndex((q) => q.id === "disp_case_no_consent");
      const index48h = queue.findIndex((q) => q.id === "disp_case_consent");

      expect(index10h).toBeLessThan(index48h);

      const nearOverdueItem = queue[index10h]!;
      expect(nearOverdueItem.isNearOverdue).toBe(true);
      expect(nearOverdueItem.isOverdue).toBe(false);
      expect(nearOverdueItem.studentName).toBe("Student Beta");
      expect(nearOverdueItem.shareConsent).toBe(false);

      const notDueYetItem = queue[index48h]!;
      expect(notDueYetItem.isNearOverdue).toBe(false);
      expect(notDueYetItem.isOverdue).toBe(false);
    });

    it("getCase provides playable audioUrl ONLY when student consented", async () => {
      const adminCaller = createCaller(adminUser);

      // 1. Consented dispute: audioPlayable is true, audioUrl provided
      const consentedCase = await adminCaller.disputeAdmin.getCase({ id: "disp_case_consent" });
      expect(consentedCase.dispute.shareConsent).toBe(true);
      expect(consentedCase.answers[0]!.audioPlayable).toBe(true);
      expect(consentedCase.answers[0]!.audioUrl).toBe(
        "/api/attempts/att_case_consent/answers/ans_case_1/audio",
      );

      // 2. Non-consented dispute: audioPlayable is false, audioUrl is null (Privacy preserved)
      const noConsentCase = await adminCaller.disputeAdmin.getCase({ id: "disp_case_no_consent" });
      expect(noConsentCase.dispute.shareConsent).toBe(false);
      expect(noConsentCase.answers[0]!.audioPlayable).toBe(false);
      expect(noConsentCase.answers[0]!.audioUrl).toBeNull();
    });
  });

  describe("resolve and metrics procedures", () => {
    it("resolves a dispute with updated band and retains previous band", async () => {
      const resolveNow = new Date("2026-11-06T12:00:00.000Z");
      const adminCaller = createCaller(adminUser, mockEnv, () => resolveNow);

      const resolveRes = await adminCaller.disputeAdmin.resolve({
        id: "disp_case_consent",
        status: "resolved",
        resolvedBand: "6.5",
        previousBand: "6.0",
        replyText: "Đã rà soát và nâng band điểm lên 6.5 theo tiêu chí chấm.",
      });

      expect(resolveRes.success).toBe(true);
      expect(resolveRes.dispute!.status).toBe("resolved");
      expect(resolveRes.dispute!.previousBand).toBe("6.0");
      expect(resolveRes.dispute!.resolvedBand).toBe("6.5");
      expect(resolveRes.dispute!.resolvedAt).toEqual(resolveNow);

      // Student can observe the resolved reply via dispute.get
      const studentCaller = createCaller(studentUser1);
      const studentView = await studentCaller.dispute.get({ attemptId: "att_case_consent" });
      expect(studentView.dispute?.status).toBe("resolved");
      expect(studentView.dispute?.resolvedBand).toBe("6.5");
      expect(studentView.dispute?.previousBand).toBe("6.0");
      expect(studentView.dispute?.replyText).toContain("Đã rà soát");
    });

    it("rejects resolving an already resolved dispute", async () => {
      const adminCaller = createCaller(adminUser);

      await expect(
        adminCaller.disputeAdmin.resolve({
          id: "disp_case_consent",
          status: "resolved",
          resolvedBand: "7.0",
          replyText: "Thử giải quyết lần hai",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("computes accurate operational metrics (on-time rate and weekly volume)", async () => {
      const metricsNow = new Date("2026-11-06T12:00:00.000Z");
      const adminCaller = createCaller(adminUser, mockEnv, () => metricsNow);
      const metrics = await adminCaller.disputeAdmin.metrics();

      expect(metrics.totalCount).toBeGreaterThanOrEqual(2);
      expect(metrics.resolvedCount).toBeGreaterThanOrEqual(1);
      expect(metrics.onTimeRate).toBe(100);
      expect(metrics.weeklyCount).toBeGreaterThanOrEqual(2);
      expect(metrics.nearOverdueCount).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("dispute-admin clock boundary behavior", () => {
  const T0 = new Date("2026-11-05T12:00:00.000Z");
  const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;
  const TWELVE_HOURS_MS = 12 * 3600 * 1000;

  it("metrics weeklyCount includes disputes at exactly 7 days and excludes 7 days + 1ms", async () => {
    let isolated: TestDbContext | undefined;
    try {
      isolated = await createTestDb();
      await isolated.db.insert(user).values([adminUser, studentUser1]);
      await isolated.db.insert(attempt).values({
        id: "att_weekly_boundary",
        userId: studentUser1.id,
        mode: "full",
        status: "submitted",
        submittedAt: T0,
      });
      await isolated.db.insert(scoreDispute).values({
        id: "disp_weekly_boundary",
        attemptId: "att_weekly_boundary",
        userId: studentUser1.id,
        targetCriterion: "FC",
        expectedBand: "6.5",
        status: "open",
        dueAt: new Date(T0.getTime() + 72 * 3600 * 1000),
        createdAt: T0,
      });

      const atSevenDays = new Date(T0.getTime() + SEVEN_DAYS_MS);
      const callerAtBoundary = createCallerWithDb(isolated.db, adminUser, mockEnv, () => atSevenDays);
      const metricsAtBoundary = await callerAtBoundary.disputeAdmin.metrics();
      expect(metricsAtBoundary.weeklyCount).toBe(1);

      const pastSevenDays = new Date(T0.getTime() + SEVEN_DAYS_MS + 1);
      const callerPastBoundary = createCallerWithDb(
        isolated.db,
        adminUser,
        mockEnv,
        () => pastSevenDays,
      );
      const metricsPastBoundary = await callerPastBoundary.disputeAdmin.metrics();
      expect(metricsPastBoundary.weeklyCount).toBe(0);
    } finally {
      await isolated?.dispose();
    }
  }, 15_000);

  it("metrics onTimeRate counts resolvedAt === dueAt as on-time and dueAt + 1ms as late via resolve", async () => {
    let isolated: TestDbContext | undefined;
    try {
      isolated = await createTestDb();
      await isolated.db.insert(user).values([adminUser, studentUser1, studentUser2]);
      await isolated.db.insert(attempt).values([
        {
          id: "att_ontime_exact",
          userId: studentUser1.id,
          mode: "full",
          status: "submitted",
          submittedAt: T0,
        },
        {
          id: "att_ontime_late",
          userId: studentUser2.id,
          mode: "full",
          status: "submitted",
          submittedAt: T0,
        },
      ]);

      const dueAt = new Date(T0.getTime() + 72 * 3600 * 1000);
      await isolated.db.insert(scoreDispute).values([
        {
          id: "disp_ontime_exact",
          attemptId: "att_ontime_exact",
          userId: studentUser1.id,
          targetCriterion: "FC",
          expectedBand: "6.5",
          status: "open",
          dueAt,
          createdAt: T0,
        },
        {
          id: "disp_ontime_late",
          attemptId: "att_ontime_late",
          userId: studentUser2.id,
          targetCriterion: "LR",
          expectedBand: "7.0",
          status: "open",
          dueAt,
          createdAt: T0,
        },
      ]);

      const onTimeCaller = createCallerWithDb(isolated.db, adminUser, mockEnv, () => dueAt);
      const resOnTime = await onTimeCaller.disputeAdmin.resolve({
        id: "disp_ontime_exact",
        status: "resolved",
        resolvedBand: "6.5",
        replyText: "Resolved exactly at deadline",
      });
      expect(resOnTime.dispute.resolvedAt).toEqual(dueAt);

      const lateNow = new Date(dueAt.getTime() + 1);
      const lateCaller = createCallerWithDb(isolated.db, adminUser, mockEnv, () => lateNow);
      const resLate = await lateCaller.disputeAdmin.resolve({
        id: "disp_ontime_late",
        status: "resolved",
        resolvedBand: "7.0",
        replyText: "Resolved 1ms past deadline",
      });
      expect(resLate.dispute.resolvedAt).toEqual(lateNow);

      const metricsCaller = createCallerWithDb(
        isolated.db,
        adminUser,
        mockEnv,
        () => new Date(dueAt.getTime() + 1000),
      );
      const metrics = await metricsCaller.disputeAdmin.metrics();
      expect(metrics.resolvedCount).toBe(2);
      expect(metrics.onTimeRate).toBe(50);
    } finally {
      await isolated?.dispose();
    }
  }, 15_000);

  it("queue evaluates isNearOverdue (< 12h) and isOverdue (< now) boundaries deterministically", async () => {
    let isolated: TestDbContext | undefined;
    try {
      isolated = await createTestDb();
      await isolated.db.insert(user).values([adminUser, studentUser1]);

      const queryNow = new Date("2026-11-06T12:00:00.000Z");
      await isolated.db.insert(attempt).values([
        { id: "att_q_12h", userId: studentUser1.id, mode: "full", status: "submitted", submittedAt: T0 },
        { id: "att_q_near", userId: studentUser1.id, mode: "full", status: "submitted", submittedAt: T0 },
        { id: "att_q_exact", userId: studentUser1.id, mode: "full", status: "submitted", submittedAt: T0 },
        { id: "att_q_late", userId: studentUser1.id, mode: "full", status: "submitted", submittedAt: T0 },
      ]);

      await isolated.db.insert(scoreDispute).values([
        {
          id: "disp_q_12h",
          attemptId: "att_q_12h",
          userId: studentUser1.id,
          targetCriterion: "FC",
          expectedBand: "6.5",
          status: "open",
          warnedAt: null,
          dueAt: new Date(queryNow.getTime() + TWELVE_HOURS_MS),
          createdAt: T0,
        },
        {
          id: "disp_q_near",
          attemptId: "att_q_near",
          userId: studentUser1.id,
          targetCriterion: "FC",
          expectedBand: "6.5",
          status: "open",
          warnedAt: null,
          dueAt: new Date(queryNow.getTime() + TWELVE_HOURS_MS - 1),
          createdAt: T0,
        },
        {
          id: "disp_q_exact",
          attemptId: "att_q_exact",
          userId: studentUser1.id,
          targetCriterion: "FC",
          expectedBand: "6.5",
          status: "open",
          warnedAt: null,
          dueAt: queryNow,
          createdAt: T0,
        },
        {
          id: "disp_q_late",
          attemptId: "att_q_late",
          userId: studentUser1.id,
          targetCriterion: "FC",
          expectedBand: "6.5",
          status: "open",
          warnedAt: null,
          dueAt: new Date(queryNow.getTime() - 1),
          createdAt: T0,
        },
      ]);

      const caller = createCallerWithDb(isolated.db, adminUser, mockEnv, () => queryNow);
      const queue = await caller.disputeAdmin.queue();
      const byId = new Map(queue.map((item) => [item.id, item]));

      expect(byId.get("disp_q_12h")).toMatchObject({ isNearOverdue: false, isOverdue: false });
      expect(byId.get("disp_q_near")).toMatchObject({ isNearOverdue: true, isOverdue: false });
      expect(byId.get("disp_q_exact")).toMatchObject({ isNearOverdue: true, isOverdue: false });
      expect(byId.get("disp_q_late")).toMatchObject({ isNearOverdue: true, isOverdue: true });
    } finally {
      await isolated?.dispose();
    }
  }, 15_000);

  it("rejects invalid Context.now dates fail-closed with INTERNAL_SERVER_ERROR", async () => {
    let isolated: TestDbContext | undefined;
    try {
      isolated = await createTestDb();
      await isolated.db.insert(user).values([adminUser, studentUser1]);
      await isolated.db.insert(attempt).values({
        id: "att_invalid_clock",
        userId: studentUser1.id,
        mode: "full",
        status: "submitted",
        submittedAt: T0,
      });
      await isolated.db.insert(scoreDispute).values({
        id: "disp_invalid_clock",
        attemptId: "att_invalid_clock",
        userId: studentUser1.id,
        targetCriterion: "GRA",
        expectedBand: "7.0",
        status: "open",
        dueAt: new Date(T0.getTime() + 72 * 3600 * 1000),
        createdAt: T0,
      });

      const invalidCaller = createCallerWithDb(
        isolated.db,
        adminUser,
        mockEnv,
        () => new Date(Number.NaN),
      );

      await expect(invalidCaller.disputeAdmin.queue()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
      await expect(invalidCaller.disputeAdmin.metrics()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
      await expect(
        invalidCaller.disputeAdmin.resolve({
          id: "disp_invalid_clock",
          status: "resolved",
          resolvedBand: "7.0",
          replyText: "Should fail closed on invalid clock",
        }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });

      const [persisted] = await isolated.db
        .select()
        .from(scoreDispute)
        .where(eq(scoreDispute.id, "disp_invalid_clock"))
        .limit(1);
      expect(persisted?.status).toBe("open");
      expect(persisted?.resolvedAt).toBeNull();
    } finally {
      await isolated?.dispose();
    }
  }, 15_000);
});
