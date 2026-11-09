import { TRPCError } from "@trpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";

describe("tRPC appRouter", () => {
  let testCtx: TestDbContext;

  beforeAll(async () => {
    testCtx = await createTestDb();
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  it("healthCheck returns 'OK'", async () => {
    const caller = appRouter.createCaller({
      db: testCtx.db,
      session: null,
    });

    const result = await caller.healthCheck();
    expect(result).toBe("OK");
  });

  it("privateData throws UNAUTHORIZED when no session is present", async () => {
    const caller = appRouter.createCaller({
      db: testCtx.db,
      session: null,
    });

    await expect(caller.privateData()).rejects.toThrowError(TRPCError);
    await expect(caller.privateData()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("privateData returns user data when authenticated session is provided", async () => {
    const mockUser = {
      id: "usr_100",
      name: "Authenticated User",
      email: "auth@voxflow.local",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
    };

    const caller = appRouter.createCaller({
      db: testCtx.db,
      session: {
        session: {
          id: "sess_100",
          userId: mockUser.id,
          token: "tok_100",
          expiresAt: new Date(Date.now() + 3600_000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
        user: mockUser,
      },
    });

    const result = await caller.privateData();
    expect(result.message).toBe("This is private");
    expect(result.user).toEqual(mockUser);
  });
});
