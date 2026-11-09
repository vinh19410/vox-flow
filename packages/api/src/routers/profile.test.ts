import { TRPCError } from "@trpc/server";
import { user } from "@vox-flow/db/schema/auth";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";

describe("Profile router (WI-10 onboarding)", () => {
  let testCtx: TestDbContext;

  const userA = {
    id: "usr_alice_wi10",
    name: "Alice Onboarding",
    email: "alice.onboarding@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const userB = {
    id: "usr_bob_wi10",
    name: "Bob Onboarding",
    email: "bob.onboarding@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    testCtx = await createTestDb();
    await testCtx.db.insert(user).values([userA, userB]);
  });

  afterAll(async () => {
    await testCtx.dispose();
  });

  function createCaller(u?: typeof userA) {
    return appRouter.createCaller({
      db: testCtx.db,
      session: u
        ? {
            session: {
              id: `sess_${u.id}`,
              userId: u.id,
              expiresAt: new Date(Date.now() + 86400000),
              token: `tok_${u.id}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: null,
              userAgent: null,
            },
            user: u,
          }
        : null,
      env: {},
    });
  }
  it("rejects unauthenticated requests with UNAUTHORIZED", async () => {
    const unauthCaller = createCaller(undefined);
    await expect(unauthCaller.profile.get()).rejects.toThrow(TRPCError);
    await expect(
      unauthCaller.profile.upsert({ targetBand: 6.5 }),
    ).rejects.toThrow(TRPCError);
    await expect(
      unauthCaller.profile.completeOnboarding(),
    ).rejects.toThrow(TRPCError);
  });

  it("returns null when profile does not exist yet", async () => {
    const callerA = createCaller(userA);
    const result = await callerA.profile.get();
    expect(result).toBeNull();
  });

  it("rejects invalid target band outside 5.0 - 9.0 or not in 0.5 increments", async () => {
    const callerA = createCaller(userA);
    await expect(callerA.profile.upsert({ targetBand: 4.5 })).rejects.toThrow();
    await expect(callerA.profile.upsert({ targetBand: 9.5 })).rejects.toThrow();
    await expect(callerA.profile.upsert({ targetBand: 6.3 })).rejects.toThrow();
  });

  it("rejects past exam date", async () => {
    const callerA = createCaller(userA);
    await expect(
      callerA.profile.upsert({ targetBand: 6.5, examDate: "2020-01-01" }),
    ).rejects.toThrow();
  });

  it("throws PRECONDITION_FAILED when calling completeOnboarding without a profile", async () => {
    const callerA = createCaller(userA);
    await expect(callerA.profile.completeOnboarding()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("saves target band and optional exam date, reads it back via get", async () => {
    const callerA = createCaller(userA);
    const saved = await callerA.profile.upsert({
      targetBand: 7.0,
      examDate: "2029-12-31",
    });

    expect(saved.userId).toBe(userA.id);
    expect(saved.targetBand).toBe(7.0);
    expect(saved.examDate).toBe("2029-12-31");
    expect(saved.onboardedAt).toBeNull();

    const fetched = await callerA.profile.get();
    expect(fetched).not.toBeNull();
    expect(fetched?.targetBand).toBe(7.0);
    expect(fetched?.examDate).toBe("2029-12-31");
    expect(fetched?.onboardedAt).toBeNull();
  });

  it("completes onboarding and is idempotent", async () => {
    const callerA = createCaller(userA);
    const completed = await callerA.profile.completeOnboarding();
    expect(completed.onboardedAt).not.toBeNull();
    const firstOnboardedAt = completed.onboardedAt;

    // Call completeOnboarding again; timestamp must not change
    const completedAgain = await callerA.profile.completeOnboarding();
    expect(completedAgain.onboardedAt).toEqual(firstOnboardedAt);
  });

  it("updating target band preserves onboardedAt", async () => {
    const callerA = createCaller(userA);
    const prev = await callerA.profile.get();
    expect(prev?.onboardedAt).not.toBeNull();

    const updated = await callerA.profile.upsert({
      targetBand: 7.5,
      examDate: null,
    });
    expect(updated.targetBand).toBe(7.5);
    expect(updated.examDate).toBeNull();
    expect(updated.onboardedAt).toEqual(prev?.onboardedAt);
  });

  it("isolates profiles between different users", async () => {
    const callerB = createCaller(userB);
    const bobProfile = await callerB.profile.get();
    expect(bobProfile).toBeNull();

    await callerB.profile.upsert({ targetBand: 6.0 });
    const bobSaved = await callerB.profile.get();
    expect(bobSaved?.targetBand).toBe(6.0);

    const callerA = createCaller(userA);
    const aliceProfile = await callerA.profile.get();
    expect(aliceProfile?.targetBand).toBe(7.5);
  });
});
