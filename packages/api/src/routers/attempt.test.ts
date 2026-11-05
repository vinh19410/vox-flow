import { describe, expect, it } from "vitest";
import { user } from "@vox-flow/db";
import { appRouter } from "./index";
import { createTestDb } from "../test/db";

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
});
