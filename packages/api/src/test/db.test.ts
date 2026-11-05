import { user } from "@vox-flow/db/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, type TestDbContext } from "./db";

describe("D1 test helper with Miniflare", () => {
  let testCtx: TestDbContext;

  beforeAll(async () => {
    testCtx = await createTestDb();
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  it("applies migrations and allows insert and select on user table", async () => {
    const userId = "test_user_001";
    const userEmail = "tester@voxflow.local";

    await testCtx.db.insert(user).values({
      id: userId,
      name: "Tester",
      email: userEmail,
    });

    const rows = await testCtx.db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    expect(rows).toHaveLength(1);
    const firstRow = rows[0];
    expect(firstRow).toBeDefined();
    if (!firstRow) {
      throw new Error("Expected firstRow to be defined");
    }
    expect(firstRow.id).toBe(userId);
    expect(firstRow.name).toBe("Tester");
    expect(firstRow.email).toBe(userEmail);
    expect(firstRow.emailVerified).toBe(false);
  });
});
