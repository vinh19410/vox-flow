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

  it("returns free entitlement and denies detail view by default until billing tables (#19) exist", async () => {
    const ctx = await createTestDb();
    disposers.push(ctx.dispose);

    await expect(getEntitlement(ctx.db, "user-1")).resolves.toBe("free");
    await expect(canViewDetail(ctx.db, "user-1", "attempt-1")).resolves.toBe(false);
  }, 15_000);
});
