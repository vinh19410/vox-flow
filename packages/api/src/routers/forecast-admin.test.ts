import { user } from "@vox-flow/db/schema";
import { TRPCError } from "@trpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";

describe("forecast-admin router and student reporting rules", () => {
  let testCtx: TestDbContext;

  const adminUser = {
    id: "usr_admin_1",
    name: "Product Owner",
    email: "owner@voxflow.ai",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const regularUser1 = {
    id: "usr_student_1",
    name: "Student One",
    email: "student1@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const regularUser2 = {
    id: "usr_student_2",
    name: "Student Two",
    email: "student2@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEnv = {
    ADMIN_EMAILS: "owner@voxflow.ai, admin-backup@voxflow.ai",
  };

  beforeAll(async () => {
    testCtx = await createTestDb();

    await testCtx.db.insert(user).values([adminUser, regularUser1, regularUser2]);
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  function createCaller(
    u: typeof adminUser | null,
    env: { ADMIN_EMAILS?: string } | undefined = mockEnv,
  ) {
    return appRouter.createCaller({
      db: testCtx.db,
      env,
      session: u
        ? {
            session: {
              id: `sess_${u.id}`,
              userId: u.id,
              token: `tok_${u.id}`,
              expiresAt: new Date(Date.now() + 3600_000),
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: null,
              userAgent: null,
            },
            user: u,
          }
        : null,
    });
  }

  it("rejects unauthenticated users with UNAUTHORIZED", async () => {
    const caller = createCaller(null);

    await expect(
      caller.forecastAdmin.listDrafts(),
    ).rejects.toThrowError(TRPCError);
  });

  it("rejects regular non-admin users with FORBIDDEN", async () => {
    const regularCaller = createCaller(regularUser1);

    await expect(
      regularCaller.forecastAdmin.listDrafts(),
    ).rejects.toThrowError(TRPCError);

    await expect(
      regularCaller.forecastAdmin.createDraft({
        title: "Unauthorized Draft",
        quarter: "2026-Q1",
      }),
    ).rejects.toThrowError(TRPCError);
  });

  it("allows admin user and createDraft always creates topics with status draft", async () => {
    const adminCaller = createCaller(adminUser);

    const created = await adminCaller.forecastAdmin.createDraft({
      title: "Describe an interesting conversation",
      quarter: "2026-Q1",
      part: 2,
      questions: ["Who did you talk to?", "What did you talk about?"],
      sources: [
        {
          sourceType: "manual",
          rawContent: "Crafted by PO",
        },
        {
          sourceType: "web",
          sourceUrl: "https://example.com/ielts-speaking-q1",
          rawContent: "Rewritten from web source",
        },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("draft");
    expect(created.title).toBe("Describe an interesting conversation");
    expect(created.quarter).toBe("2026-Q1");
    expect(created.part).toBe(2);

    const drafts = await adminCaller.forecastAdmin.listDrafts({
      quarter: "2026-Q1",
    });

    expect(drafts.length).toBeGreaterThanOrEqual(1);
    const found = drafts.find((d) => d.id === created.id);
    expect(found).toBeDefined();
    expect(found?.status).toBe("draft");
    expect(found?.sources).toHaveLength(2);
    expect(found?.realReportCount).toBe(0);
  });

  it("rejects invalid sourceUrl (e.g. javascript:... or non-http)", async () => {
    const adminCaller = createCaller(adminUser);

    await expect(
      adminCaller.forecastAdmin.createDraft({
        title: "Malicious source draft",
        quarter: "2026-Q1",
        sources: [
          {
            sourceType: "web",
            sourceUrl: "javascript:alert(1)" as unknown as string,
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it("updateDraft edits title, part, and questions while keeping draft state", async () => {
    const adminCaller = createCaller(adminUser);

    const created = await adminCaller.forecastAdmin.createDraft({
      title: "Original Topic Title",
      quarter: "2026-Q1",
      part: 1,
    });

    const updated = await adminCaller.forecastAdmin.updateDraft({
      id: created.id,
      title: "Updated Topic Title",
      part: 2,
      questions: ["Question 1", "Question 2"],
    });

    expect(updated.title).toBe("Updated Topic Title");
    expect(updated.part).toBe(2);
    expect(updated.status).toBe("draft");
  });

  it("publish is the only way to transition to published and records reviewedBy from admin session", async () => {
    const adminCaller = createCaller(adminUser);

    const created = await adminCaller.forecastAdmin.createDraft({
      title: "Ready to publish topic",
      quarter: "2026-Q1",
      part: 3,
    });

    expect(created.status).toBe("draft");
    expect(created.reviewedBy).toBeNull();
    expect(created.reviewedAt).toBeNull();

    const published = await adminCaller.forecastAdmin.publish({
      id: created.id,
    });

    expect(published.status).toBe("published");
    expect(published.reviewedBy).toBe(adminUser.id);
    expect(published.reviewedAt).not.toBeNull();
  });

  it("archive marks topic as archived", async () => {
    const adminCaller = createCaller(adminUser);

    const created = await adminCaller.forecastAdmin.createDraft({
      title: "Topic to archive",
      quarter: "2025-Q4",
    });

    const archived = await adminCaller.forecastAdmin.archive({
      id: created.id,
    });

    expect(archived.status).toBe("archived");
  });

  it("real report count counts only unique reporting students and duplicate reports don't increment count", async () => {
    const adminCaller = createCaller(adminUser);
    const student1Caller = createCaller(regularUser1);
    const student2Caller = createCaller(regularUser2);

    const topic = await adminCaller.forecastAdmin.createDraft({
      title: "Popular Exam Topic",
      quarter: "2026-Q1",
    });
    await adminCaller.forecastAdmin.publish({ id: topic.id });

    // Student 1 reports topic
    const rep1 = await student1Caller.forecast.reportTopic({
      topicId: topic.id,
      notes: "Encountered in BC Hanoi morning session",
    });
    expect(rep1.success).toBe(true);
    expect(rep1.alreadyReported).toBe(false);

    // Student 1 reports same topic AGAIN
    const rep1Dup = await student1Caller.forecast.reportTopic({
      topicId: topic.id,
      notes: "Reporting again",
    });
    expect(rep1Dup.success).toBe(true);
    expect(rep1Dup.alreadyReported).toBe(true);

    // Student 2 reports topic
    const rep2 = await student2Caller.forecast.reportTopic({
      topicId: topic.id,
      notes: "Encountered in IDP Saigon",
    });
    expect(rep2.success).toBe(true);
    expect(rep2.alreadyReported).toBe(false);

    // Check count in admin listDrafts
    const drafts = await adminCaller.forecastAdmin.listDrafts({
      quarter: "2026-Q1",
    });
    const topicSummary = drafts.find((d) => d.id === topic.id);
    expect(topicSummary?.realReportCount).toBe(2);

    // Check count in public listPublished
    const publicList = await student1Caller.forecast.listPublished({
      quarter: "2026-Q1",
    });
    const publicTopic = publicList.find((t) => t.id === topic.id);
    expect(publicTopic?.realReportCount).toBe(2);
  });

  it("checkAdmin succeeds for admin and throws FORBIDDEN for non-admin", async () => {
    const adminCaller = createCaller(adminUser);
    const studentCaller = createCaller(regularUser1);

    const check = await adminCaller.forecastAdmin.checkAdmin();
    expect(check.isAdmin).toBe(true);

    await expect(studentCaller.forecastAdmin.checkAdmin()).rejects.toThrowError(
      TRPCError,
    );
  });

  it("reportTopic rejects reports for topics that are not published", async () => {
    const adminCaller = createCaller(adminUser);
    const studentCaller = createCaller(regularUser1);

    const draft = await adminCaller.forecastAdmin.createDraft({
      title: "Draft Only Topic",
      quarter: "2026-Q1",
    });

    await expect(
      studentCaller.forecast.reportTopic({
        topicId: draft.id,
      }),
    ).rejects.toThrowError(TRPCError);
  });

  it("ingestRawFeed clusters raw feeds into draft topics and preserves sources", async () => {
    const adminCaller = createCaller(adminUser);

    const feedResult = await adminCaller.forecastAdmin.ingestRawFeed({
      items: [
        {
          sourceType: "manual",
          rawTitle: "Describe a memorable family journey",
          quarter: "2026-Q2",
          part: 2,
          questions: ["Where did you go?"],
        },
        {
          sourceType: "student",
          rawTitle: "A memorable journey with family members",
          quarter: "2026-Q2",
          part: 2,
          questions: ["Who went with you?"],
        },
        {
          sourceType: "web",
          sourceUrl: "https://example.com/journey-topic",
          rawTitle: "Describe a journey you took with your family",
          quarter: "2026-Q2",
          part: 2,
          questions: ["Why was it memorable?"],
        },
      ],
    });

    expect(feedResult.processed).toBe(3);
    expect(feedResult.createdDrafts).toBe(1);
    expect(feedResult.drafts[0]?.status).toBe("draft");

    const drafts = await adminCaller.forecastAdmin.listDrafts({
      quarter: "2026-Q2",
    });
    const created = drafts.find((d) => d.id === feedResult.drafts[0]?.id);
    expect(created).toBeDefined();
    expect(created?.sources).toHaveLength(3);
  });
});
