import { describe, expect, it } from "vitest";
import { forecastTopic, user } from "@vox-flow/db";
import { appRouter } from "./index";
import { createTestDb } from "../test/db";

const PUBLISHED_TOPIC = {
  id: "p1-tidiness",
  title: "Tidiness",
  quarter: "2026-Q4",
  part: 1,
  status: "published" as const,
};

describe("attemptRouter", () => {
  it("rejects attempt.start when launch gate is closed and email is not allowed", async () => {
    const { db, dispose } = await createTestDb();
    try {
      const caller = appRouter.createCaller({
        db,
        session: {
          user: {
            id: "user-1",
            email: "random@gmail.com",
            name: "Random Student",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: "session-1",
            userId: "user-1",
            token: "tok-1",
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        env: {
          LAUNCH_OPEN: "false",
          LAUNCH_ALLOWED_EMAILS: "pilot@voxflow.vn,beta@voxflow.vn",
        },
      });

      await expect(caller.attempt.start()).rejects.toThrow("restricted to pilot candidates");
    } finally {
      await dispose();
    }
  });

  it("allows attempt.start when email belongs to LAUNCH_ALLOWED_EMAILS", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-pilot",
        name: "Pilot Tester",
        email: "pilot@voxflow.vn",
        emailVerified: true,
      });

      const caller = appRouter.createCaller({
        db,
        session: {
          user: {
            id: "user-pilot",
            email: "pilot@voxflow.vn",
            name: "Pilot Tester",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: "session-pilot",
            userId: "user-pilot",
            token: "tok-pilot",
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        env: {
          LAUNCH_OPEN: "false",
          LAUNCH_ALLOWED_EMAILS: "pilot@voxflow.vn",
        },
      });

      const res = await caller.attempt.start({ mode: "full" });
      expect(res.attemptId).toBeDefined();
      expect(res.mode).toBe("full");
      expect(res.inHistory).toBe(true);
    } finally {
      await dispose();
    }
  });

  it("allows attempt.start when LAUNCH_OPEN is true", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-open",
        name: "Open Tester",
        email: "open@example.com",
        emailVerified: true,
      });

      const caller = appRouter.createCaller({
        db,
        session: {
          user: {
            id: "user-open",
            email: "open@example.com",
            name: "Open Tester",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: "session-open",
            userId: "user-open",
            token: "tok-open",
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        env: {
          LAUNCH_OPEN: "true",
        },
      });

      const res = await caller.attempt.start({ mode: "part1" });
      expect(res.attemptId).toBeDefined();
      expect(res.mode).toBe("part1");
    } finally {
      await dispose();
    }
  });

  it("prevents User B from uploading answers or submitting User A's attempt", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values([
        { id: "user-a", name: "User A", email: "a@voxflow.vn", emailVerified: true },
        { id: "user-b", name: "User B", email: "b@voxflow.vn", emailVerified: true },
      ]);

      const callerA = appRouter.createCaller({
        db,
        session: {
          user: { id: "user-a", email: "a@voxflow.vn", name: "User A", emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
          session: { id: "s-a", userId: "user-a", token: "t-a", expiresAt: new Date(Date.now() + 3600000), createdAt: new Date(), updatedAt: new Date() },
        },
        env: { LAUNCH_OPEN: "true" },
      });

      const callerB = appRouter.createCaller({
        db,
        session: {
          user: { id: "user-b", email: "b@voxflow.vn", name: "User B", emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
          session: { id: "s-b", userId: "user-b", token: "t-b", expiresAt: new Date(Date.now() + 3600000), createdAt: new Date(), updatedAt: new Date() },
        },
        env: { LAUNCH_OPEN: "true" },
      });

      const { attemptId } = await callerA.attempt.start();

      // User B tries to upload answer for User A's attempt
      await expect(
        callerB.attempt.uploadAnswer({
          attemptId,
          questionKey: "p1-1",
          questionText: "Where do you live?",
          partNumber: 1,
          orderIndex: 0,
          durationMs: 15000,
          mimeType: "audio/webm",
        }),
      ).rejects.toThrow("You are not authorized");

      // User B tries to submit User A's attempt
      await expect(
        callerB.attempt.submit({
          attemptId,
        }),
      ).rejects.toThrow("You are not authorized");

      // User A uploads and submits successfully
      // Reject invalid or unsupported mimeType (e.g. text/html for stored XSS)
      await expect(
        callerA.attempt.uploadAnswer({
          attemptId,
          questionKey: "p1-1",
          questionText: "Where do you live?",
          partNumber: 1,
          orderIndex: 0,
          durationMs: 15000,
          mimeType: "text/html",
        }),
      ).rejects.toThrow();

      // Reject questionKey with path traversal or invalid characters
      await expect(
        callerA.attempt.uploadAnswer({
          attemptId,
          questionKey: "../evil",
          questionText: "Where do you live?",
          partNumber: 1,
          orderIndex: 0,
          durationMs: 15000,
          mimeType: "audio/webm",
        }),
      ).rejects.toThrow();

      const uploadRes = await callerA.attempt.uploadAnswer({
        attemptId,
        questionKey: "p1-1",
        questionText: "Where do you live?",
        partNumber: 1,
        orderIndex: 0,
        durationMs: 15000,
        mimeType: "audio/webm",
      });
      expect(uploadRes.success).toBe(true);

      const activeRes = await callerA.attempt.getActive();
      expect(activeRes).not.toBeNull();
      expect(activeRes?.answers).toHaveLength(1);
      expect(activeRes?.answers[0]?.audioKey).toBe(`users/user-a/attempts/${attemptId}/p1-1.webm`);
      expect(activeRes?.answers[0]?.mimeType).toBe("audio/webm");

      const submitRes = await callerA.attempt.submit({ attemptId });
      expect(submitRes.status).toBe("submitted");

      // Attempting to upload to a submitted attempt fails
      await expect(
        callerA.attempt.uploadAnswer({
          attemptId,
          questionKey: "p1-2",
          questionText: "Another question?",
          partNumber: 1,
          orderIndex: 1,
          durationMs: 10000,
          mimeType: "audio/webm",
        }),
      ).rejects.toThrow("Cannot upload answer to a finalized attempt");
    } finally {
      await dispose();
    }
  });

  it("records topicId and questionKey when starting a single-question practice attempt", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-single",
        name: "Single Question Learner",
        email: "learner@voxflow.vn",
        emailVerified: true,
      });
      await db.insert(forecastTopic).values(PUBLISHED_TOPIC);

      const caller = appRouter.createCaller({
        db,
        session: {
          user: {
            id: "user-single",
            email: "learner@voxflow.vn",
            name: "Single Question Learner",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: "session-single",
            userId: "user-single",
            token: "tok-single",
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        env: {
          LAUNCH_OPEN: "true",
        },
      });

      const res = await caller.attempt.start({
        mode: "part1",
        topicId: "p1-tidiness",
        questionKey: "p1-tidiness-0",
      });

      expect(res.attemptId).toBeDefined();
      expect(res.mode).toBe("part1");
      expect(res.topicId).toBe("p1-tidiness");
      expect(res.questionKey).toBe("p1-tidiness-0");
      expect(res.inHistory).toBe(true);

      const active = await caller.attempt.getActive();
      expect(active).not.toBeNull();
      expect(active?.attempt.topicId).toBe("p1-tidiness");
      expect(active?.attempt.questionKey).toBe("p1-tidiness-0");
      expect(active?.attempt.inHistory).toBe(true);
    } finally {
      await dispose();
    }
  });

  it("validates topicId and questionKey: rejects single field or invalid questionKey", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({
        id: "user-val",
        name: "Validation User",
        email: "val@voxflow.vn",
        emailVerified: true,
      });
      await db.insert(forecastTopic).values(PUBLISHED_TOPIC);

      const caller = appRouter.createCaller({
        db,
        session: {
          user: {
            id: "user-val",
            email: "val@voxflow.vn",
            name: "Validation User",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: "session-val",
            userId: "user-val",
            token: "tok-val",
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        env: {
          LAUNCH_OPEN: "true",
        },
      });
      // Whole-topic practice (only topicId) -> succeeds!
      const topicOnly = await caller.attempt.start({
        mode: "part1",
        topicId: "p1-tidiness",
      });
      expect(topicOnly.attemptId).toBeDefined();
      expect(topicOnly.topicId).toBe("p1-tidiness");
      expect(topicOnly.questionKey).toBeUndefined();

      // Only questionKey without topicId -> should reject
      await expect(
        caller.attempt.start({
          mode: "part1",
          questionKey: "p1-tidiness-0",
        }),
      ).rejects.toThrow();

      // Invalid topicId format (special chars) -> should reject
      await expect(
        caller.attempt.start({
          mode: "part1",
          topicId: "invalid/topic!",
        }),
      ).rejects.toThrow();

      // Invalid questionKey format (special chars) -> should reject
      await expect(
        caller.attempt.start({
          mode: "part1",
          topicId: "p1-tidiness",
          questionKey: "invalid/key!",
        }),
      ).rejects.toThrow();
    } finally {
      await dispose();
    }
  });
  it("rejects attempt.start for a topicId that is not a published forecast topic", async () => {
    const { db, dispose } = await createTestDb();
    try {
      await db.insert(user).values({ id: "user-t", name: "Topic User", email: "t@voxflow.vn", emailVerified: true });
      await db.insert(forecastTopic).values([
        PUBLISHED_TOPIC,
        { ...PUBLISHED_TOPIC, id: "p1-draft", status: "draft" as const },
        { ...PUBLISHED_TOPIC, id: "p1-archived", status: "archived" as const },
      ]);
      const caller = appRouter.createCaller({
        db,
        session: {
          user: { id: "user-t", email: "t@voxflow.vn", name: "Topic User", emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
          session: { id: "s-t", userId: "user-t", token: "t-t", expiresAt: new Date(Date.now() + 3600000), createdAt: new Date(), updatedAt: new Date() },
        },
        env: { LAUNCH_OPEN: "true" },
      });

      for (const topicId of ["x", "p1-draft", "p1-archived"]) {
        await expect(caller.attempt.start({ mode: "full", topicId })).rejects.toMatchObject({
          code: "BAD_REQUEST",
          message: "Unknown or unpublished forecast topic",
        });
      }
      expect(await caller.attempt.getActive()).toBeNull();

      const ok = await caller.attempt.start({ mode: "part1", topicId: "p1-tidiness" });
      expect(ok.topicId).toBe("p1-tidiness");
    } finally {
      await dispose();
    }
  });
});
