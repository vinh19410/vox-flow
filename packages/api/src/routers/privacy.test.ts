import { TRPCError } from "@trpc/server";
import { user } from "@vox-flow/db/schema/auth";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "../test/db";
import { appRouter } from "./index";
import { requireConsent } from "./privacy";

describe("Privacy router and requireConsent helper", () => {
  let testCtx: TestDbContext;

  const userA = {
    id: "usr_alice",
    name: "Alice",
    email: "alice@voxflow.local",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  };

  const userB = {
    id: "usr_bob",
    name: "Bob",
    email: "bob@voxflow.local",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  };

  beforeAll(async () => {
    testCtx = await createTestDb();

    await testCtx.db.insert(user).values({
      id: userA.id,
      name: userA.name,
      email: userA.email,
    });

    await testCtx.db.insert(user).values({
      id: userB.id,
      name: userB.name,
      email: userB.email,
    });
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  function createCaller(u: typeof userA) {
    return appRouter.createCaller({
      db: testCtx.db,
      session: {
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
      },
    });
  }

  it("getConsent defaults to false when no records exist", async () => {
    const caller = createCaller(userA);
    const consent = await caller.privacy.getConsent();

    expect(consent.save).toBe(false);
    expect(consent.calibration).toBe(false);
    expect(consent.hasAnswered).toBe(false);
  });

  it("setConsent updates consent and getConsent reads it back", async () => {
    const callerA = createCaller(userA);

    await callerA.privacy.setConsent({
      kind: "save",
      granted: true,
      policyVersion: "v1.0",
    });

    await callerA.privacy.setConsent({
      kind: "calibration",
      granted: true,
      policyVersion: "v1.0",
    });

    const consentA = await callerA.privacy.getConsent();
    expect(consentA.save).toBe(true);
    expect(consentA.calibration).toBe(true);
    expect(consentA.hasAnswered).toBe(true);

    // Turn calibration back off
    await callerA.privacy.setConsent({
      kind: "calibration",
      granted: false,
    });

    const consentAUpdated = await callerA.privacy.getConsent();
    expect(consentAUpdated.save).toBe(true);
    expect(consentAUpdated.calibration).toBe(false);
  });

  it("setConsent supports batch object { save, calibration }", async () => {
    const callerA = createCaller(userA);

    await callerA.privacy.setConsent({
      save: false,
      calibration: true,
    });

    const consent = await callerA.privacy.getConsent();
    expect(consent.save).toBe(false);
    expect(consent.calibration).toBe(true);
  });

  it("does not leak consent between different users", async () => {
    const callerB = createCaller(userB);
    const consentB = await callerB.privacy.getConsent();

    // Bob has never set consent, so his consent should be false
    expect(consentB.save).toBe(false);
    expect(consentB.calibration).toBe(false);
    expect(consentB.hasAnswered).toBe(false);
  });

  it("requireConsent throws FORBIDDEN when user has no save consent event", async () => {
    // Bob has no save consent event
    await expect(requireConsent(testCtx.db, userB.id)).rejects.toThrowError(TRPCError);
    await expect(requireConsent(testCtx.db, userB.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("requireConsent allows exam when save event exists, even if granted=false", async () => {
    // Alice has save=false from previous test
    const result = await requireConsent(testCtx.db, userA.id);
    expect(result.save).toBe(false);
  });

  it("requireConsent returns save=true when save is granted", async () => {
    const callerA = createCaller(userA);
    await callerA.privacy.setConsent({
      kind: "save",
      granted: true,
    });

    const result = await requireConsent(testCtx.db, userA.id);
    expect(result.save).toBe(true);
  });

  it("exportData exports all personal data of the authenticated user only", async () => {
    const callerA = createCaller(userA);
    const exportedA = await callerA.privacy.exportData();

    expect(exportedA.userId).toBe(userA.id);
    expect(exportedA.data.user).toBeDefined();
    expect(exportedA.data.user?.[0]).toMatchObject({ id: userA.id, email: userA.email });
    expect(exportedA.data.consent_event?.length).toBeGreaterThan(0);

    // Bob's data should not appear in Alice's export
    const callerB = createCaller(userB);
    const exportedB = await callerB.privacy.exportData();
    expect(exportedB.userId).toBe(userB.id);
    expect(exportedB.data.user?.[0]).toMatchObject({ id: userB.id, email: userB.email });
  });
});
