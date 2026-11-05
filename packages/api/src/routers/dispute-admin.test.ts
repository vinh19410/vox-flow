import { attempt, attemptAnswer, scoreDispute, user } from "@vox-flow/db/schema";
import { TRPCError } from "@trpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";

describe("dispute-admin router", () => {
  let testCtx: TestDbContext;

  const adminUser = {
    id: "usr_admin_owner",
    name: "Product Owner",
    email: "owner@voxflow.ai",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const studentUser1 = {
    id: "usr_student_alpha",
    name: "Student Alpha",
    email: "alpha@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const studentUser2 = {
    id: "usr_student_beta",
    name: "Student Beta",
    email: "beta@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEnv = {
    ADMIN_EMAILS: "owner@voxflow.ai, admin-backup@voxflow.ai",
    SCORE_DISPUTE_ENABLED: "true",
  };

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
  ) {
    return appRouter.createCaller({
      db: testCtx.db,
      env,
      session: u
        ? {
            session: {
              id: `sess_${u.id}`,
              userId: u.id,
              expiresAt: new Date(Date.now() + 3600 * 1000),
              createdAt: new Date(),
              updatedAt: new Date(),
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
      const adminCaller = createCaller(adminUser);
      const queue = await adminCaller.disputeAdmin.queue();

      expect(queue.length).toBeGreaterThanOrEqual(2);
      // disp_case_no_consent is due in 10h, disp_case_consent is due in 48h
      const index10h = queue.findIndex((q) => q.id === "disp_case_no_consent");
      const index48h = queue.findIndex((q) => q.id === "disp_case_consent");

      expect(index10h).toBeLessThan(index48h);

      const nearOverdueItem = queue[index10h]!;
      expect(nearOverdueItem.isNearOverdue).toBe(true);
      expect(nearOverdueItem.studentName).toBe("Student Beta");
      expect(nearOverdueItem.shareConsent).toBe(false);
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
      const adminCaller = createCaller(adminUser);

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
      expect(resolveRes.dispute!.resolvedAt).toBeDefined();

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
      const adminCaller = createCaller(adminUser);
      const metrics = await adminCaller.disputeAdmin.metrics();

      expect(metrics.totalCount).toBeGreaterThanOrEqual(2);
      expect(metrics.resolvedCount).toBeGreaterThanOrEqual(1);
      expect(metrics.onTimeRate).toBeGreaterThanOrEqual(0);
      expect(metrics.weeklyCount).toBeGreaterThanOrEqual(2);
    });
  });
});
