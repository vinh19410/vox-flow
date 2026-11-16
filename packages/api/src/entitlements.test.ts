import { attempt, detailUnlock, subscription, user } from "@vox-flow/db/schema";
import { afterEach, describe, expect, it } from "vitest";

import { canViewDetail, getEntitlement } from "./entitlements";
import { createTestDb } from "./test/db";

describe("entitlements", () => {
  const disposers: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (disposers.length > 0) {
      await disposers.pop()!();
    }
  });

  it("returns free entitlement and denies detail view by default", async () => {
    const ctx = await createTestDb();
    disposers.push(ctx.dispose);

    await expect(getEntitlement(ctx.db, "user-1")).resolves.toBe("free");
    await expect(canViewDetail(ctx.db, "user-1", "attempt-1")).resolves.toBe(false);
  }, 15_000);

  it("grants detail view for active subscription even at 0 points, and respects expiry", async () => {
    const ctx = await createTestDb();
    disposers.push(ctx.dispose);

    const now = new Date("2026-11-16T10:00:00.000Z");
    await ctx.db.insert(user).values({ id: "u-ent", name: "Ent", email: "ent@example.com" });
    await ctx.db.insert(subscription).values({
      userId: "u-ent",
      planId: "week",
      pointsRemaining: 0,
      planPointsTotal: 48,
      expiresAt: new Date(now.getTime() + 60_000),
    });

    await expect(getEntitlement(ctx.db, "u-ent", now)).resolves.toBe("paid");
    await expect(canViewDetail(ctx.db, "u-ent", "any-attempt", now)).resolves.toBe(true);

    const afterExpiry = new Date(now.getTime() + 120_000);
    await expect(getEntitlement(ctx.db, "u-ent", afterExpiry)).resolves.toBe("free");
    await expect(canViewDetail(ctx.db, "u-ent", "any-attempt", afterExpiry)).resolves.toBe(false);
  }, 15_000);

  it("grants detail view only for unlocked attempts when using detail_unlock", async () => {
    const ctx = await createTestDb();
    disposers.push(ctx.dispose);

    await ctx.db.insert(user).values({ id: "u-pack", name: "Pack", email: "pack@example.com" });
    await ctx.db.insert(attempt).values([
      { id: "att-unlocked", userId: "u-pack", mode: "full", status: "submitted" },
      { id: "att-locked", userId: "u-pack", mode: "full", status: "submitted" },
    ]);
    await ctx.db.insert(detailUnlock).values({
      id: "du-1",
      userId: "u-pack",
      attemptId: "att-unlocked",
    });

    await expect(getEntitlement(ctx.db, "u-pack")).resolves.toBe("free");
    await expect(canViewDetail(ctx.db, "u-pack", "att-unlocked")).resolves.toBe(true);
    await expect(canViewDetail(ctx.db, "u-pack", "att-locked")).resolves.toBe(false);
  }, 15_000);
});
