import { user, forecastSource } from "@vox-flow/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, seedForecastTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";
import type { Part23Questions } from "./forecast";

describe("forecast router and 2026-Q3 seed data", () => {
  let testCtx: TestDbContext;

  const testStudent = {
    id: "usr_student_test_1",
    name: "Test Student",
    email: "test.student@voxflow.ai",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    testCtx = await createTestDb();
    await testCtx.db.insert(user).values([testStudent]);
    await seedForecastTestDb(testCtx.db);
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  function createCaller(u: typeof testStudent | null = null) {
    return appRouter.createCaller({
      db: testCtx.db,
      env: {},
      session: u ? { user: u, session: { id: "sess_1", userId: u.id } as never } : null,
    });
  }

  it("loads 178 seeded published topics for 2026-Q3", async () => {
    const caller = createCaller();
    const allTopics = await caller.forecast.listPublished({ quarter: "2026-Q3" });

    expect(allTopics).toHaveLength(178);

    const part1Topics = allTopics.filter((t) => t.part === 1);
    const part2Topics = allTopics.filter((t) => t.part === 2);

    expect(part1Topics).toHaveLength(65);
    expect(part2Topics).toHaveLength(113);
  });

  it("filters correctly by part 1 with array of question strings", async () => {
    const caller = createCaller();
    const p1Topics = await caller.forecast.listPublished({ quarter: "2026-Q3", part: 1 });

    expect(p1Topics).toHaveLength(65);
    for (const t of p1Topics) {
      expect(t.part).toBe(1);
      expect(Array.isArray(t.questions)).toBe(true);
      expect((t.questions as string[]).length).toBeGreaterThan(0);
    }

    const tidiness = p1Topics.find((t) => t.title === "Tidiness");
    expect(tidiness).toBeDefined();
    expect(tidiness?.questions).toContain("Were you a tidy person when you were a child?");
  });

  it("filters correctly by part 2 with structured cueCards and part3 questions", async () => {
    const caller = createCaller();
    const p2Topics = await caller.forecast.listPublished({ quarter: "2026-Q3", part: 2 });

    expect(p2Topics).toHaveLength(113);
    for (const t of p2Topics) {
      expect(t.part).toBe(2);
      const q = t.questions as Part23Questions;
      expect(q).toBeDefined();
      expect(Array.isArray(q.cueCards)).toBe(true);
      expect(q.cueCards.length).toBeGreaterThan(0);
      expect(Array.isArray(q.part3)).toBe(true);
      expect(q.part3.length).toBeGreaterThan(0);
    }

    const envCard = p2Topics.find(
      (t) => t.title === "Describe a person who helps to protect the environment",
    );
    expect(envCard).toBeDefined();
    const envQ = envCard?.questions as Part23Questions;
    expect(envQ.cueCards).toContain("Who the person is");
    expect(envQ.part3).toContain("What things can people do to help to protect nature?");
    expect(envCard?.isNew).toBe(true);
    const newP2Topics = p2Topics.filter((t) => t.isNew);
    expect(newP2Topics).toHaveLength(51);
  });

  it("verifies 178 forecast_source rows are inserted with web source and luyennoi.com URL", async () => {
    const sources = await testCtx.db.select().from(forecastSource);
    expect(sources).toHaveLength(178);

    for (const s of sources) {
      expect(s.sourceType).toBe("web");
      expect(s.sourceUrl).toBe("https://luyennoi.com");
      expect(s.rawContent).toBeTruthy();
    }
  });

  it("allows student to report topic and reflects in realReportCount", async () => {
    const publicCaller = createCaller(null);
    const initialList = await publicCaller.forecast.listPublished({ quarter: "2026-Q3", part: 1 });
    const target = initialList[0]!;
    expect(target.realReportCount).toBe(0);

    const studentCaller = createCaller(testStudent);
    const reportResult = await studentCaller.forecast.reportTopic({
      topicId: target.id,
      notes: "Met this topic in IDP Hanoi",
    });
    expect(reportResult.success).toBe(true);

    const updatedList = await publicCaller.forecast.listPublished({ quarter: "2026-Q3", part: 1 });
    const updatedTarget = updatedList.find((t) => t.id === target.id);
    expect(updatedTarget?.realReportCount).toBe(1);
  });

  it("preserves isNew flag when admin updates questions of a Part 2 topic", async () => {
    const adminUser = {
      id: "usr_admin_forecast_test",
      name: "Admin User",
      email: "admin@voxflow.ai",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await testCtx.db.insert(user).values([adminUser]);

    const adminCaller = appRouter.createCaller({
      db: testCtx.db,
      env: { ADMIN_EMAILS: "admin@voxflow.ai" },
      session: { user: adminUser, session: { id: "sess_admin", userId: adminUser.id } as never },
    });

    const list = await adminCaller.forecast.listPublished({ quarter: "2026-Q3", part: 2 });
    const target = list.find((t) => t.isNew)!;
    expect(target).toBeDefined();

    // Admin updates topic questions using prefix notation
    await adminCaller.forecastAdmin.updateDraft({
      id: target.id,
      questions: ["[Cue] Updated point 1", "[Cue] Updated point 2", "[Part 3] Updated question 1"],
    });

    // Check published query preserves isNew
    const updatedList = await adminCaller.forecast.listPublished({ quarter: "2026-Q3", part: 2 });
    const updatedTarget = updatedList.find((t) => t.id === target.id);
    expect(updatedTarget?.isNew).toBe(true);
  });
});
