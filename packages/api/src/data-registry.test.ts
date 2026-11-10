import * as schema from "@vox-flow/db/schema";
import {
  account,
  attempt,
  attemptAnswer,
  attemptScore,
  consentEvent,
  forecastReport,
  forecastTopic,
  scoreDispute,
  scoreRun,
  session,
  user,
} from "@vox-flow/db/schema";
import { getTableName, is, Table } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  DATA_REGISTRY,
  eraseUserData,
  exportUserData,
  NON_PERSONAL_TABLES,
} from "./data-registry";
import { createTestDb, type TestDbContext } from "./test/db";

describe("Data registry for personal data discovery and erasure", () => {
  let testCtx: TestDbContext;

  beforeAll(async () => {
    testCtx = await createTestDb();
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  it("classifies every exported table in @vox-flow/db/schema", () => {
    const exportedTables: string[] = [];

    for (const [, exportedValue] of Object.entries(schema)) {
      if (is(exportedValue, SQLiteTable) || is(exportedValue, Table)) {
        const tableName = getTableName(exportedValue as Table);
        exportedTables.push(tableName);
      }
    }

    expect(exportedTables.length).toBeGreaterThan(0);

    for (const tableName of exportedTables) {
      const inPersonal = Boolean(DATA_REGISTRY[tableName]);
      const inNonPersonal = Boolean(NON_PERSONAL_TABLES[tableName]);

      expect(
        inPersonal || inNonPersonal,
        `Table '${tableName}' from @vox-flow/db/schema is not classified in DATA_REGISTRY or NON_PERSONAL_TABLES`,
      ).toBe(true);

      if (inNonPersonal) {
        expect(
          NON_PERSONAL_TABLES[tableName]?.length,
          `Reason for table '${tableName}' in NON_PERSONAL_TABLES must not be empty`,
        ).toBeGreaterThan(5);
      }
    }
  });

  it("exportUserData and eraseUserData correctly isolates and erases user data", async () => {
    const user1Id = "usr_reg_1";
    const user2Id = "usr_reg_2";

    // Seed users
    await testCtx.db.insert(user).values([
      { id: user1Id, name: "Student 1", email: "student1@voxflow.local" },
      { id: user2Id, name: "Student 2", email: "student2@voxflow.local" },
    ]);

    // Seed consent events
    await testCtx.db.insert(consentEvent).values([
      { userId: user1Id, kind: "save", granted: true },
      { userId: user1Id, kind: "calibration", granted: false },
      { userId: user2Id, kind: "save", granted: false },
      { userId: user2Id, kind: "calibration", granted: true },
    ]);

    // Seed sessions
    await testCtx.db.insert(session).values([
      {
        id: "sess_reg_1",
        userId: user1Id,
        token: "tok_reg_1",
        expiresAt: new Date(Date.now() + 3600_000),
      },
      {
        id: "sess_reg_2",
        userId: user2Id,
        token: "tok_reg_2",
        expiresAt: new Date(Date.now() + 3600_000),
      },
    ]);

    // Seed accounts
    await testCtx.db.insert(account).values([
      {
        id: "acc_reg_1",
        userId: user1Id,
        accountId: "ext_reg_1",
        providerId: "credential",
      },
      {
        id: "acc_reg_2",
        userId: user2Id,
        accountId: "ext_reg_2",
        providerId: "credential",
      },
    ]);

    // Seed forecast topic & reports
    const topic1Id = "topic_reg_1";
    await testCtx.db.insert(forecastTopic).values({
      id: topic1Id,
      title: "Describe a memorable journey",
      quarter: "2026-Q1",
    });
    await testCtx.db.insert(forecastReport).values([
      {
        id: "rep_reg_1",
        topicId: topic1Id,
        userId: user1Id,
        notes: "Encountered in test center",
      },
      {
        id: "rep_reg_2",
        topicId: topic1Id,
        userId: user2Id,
        notes: "Encountered in BC Hanoi",
      },
    ]);

    // Seed attempts & score disputes
    await testCtx.db.insert(attempt).values([
      { id: "att_reg_1", userId: user1Id, mode: "full", status: "submitted" },
      { id: "att_reg_2", userId: user2Id, mode: "full", status: "submitted" },
    ]);

    // Seed answers including a legitimate answer and an answer attempting to point at another user's audioKey
    await testCtx.db.insert(attemptAnswer).values([
      {
        id: "ans_reg_1_legit",
        attemptId: "att_reg_1",
        questionKey: "p1-1",
        questionText: "Legit question",
        partNumber: 1,
        orderIndex: 0,
        audioKey: `users/${user1Id}/attempts/att_reg_1/p1-1.webm`,
        durationMs: 10000,
        mimeType: "audio/webm",
      },
      {
        id: "ans_reg_1_foreign",
        attemptId: "att_reg_1",
        questionKey: "p1-2",
        questionText: "Foreign question",
        partNumber: 1,
        orderIndex: 1,
        audioKey: `users/${user2Id}/attempts/att_reg_2/victim.webm`,
        durationMs: 12000,
        mimeType: "audio/webm",
      },
    ]);
    // Seed scores and grading runs for both users
    await testCtx.db.insert(attemptScore).values([
      { attemptId: "att_reg_1", userId: user1Id, status: "done", overall: 6.5 },
      { attemptId: "att_reg_2", userId: user2Id, status: "queued" },
    ]);
    const runValues = (attemptId: string, runIndex: number) => ({
      attemptId,
      runIndex,
      fc: 6.5,
      lr: 6,
      gra: 6,
      p: 6.5,
      overall: 6.5,
      payloadJson: "{}",
      model: "test-model",
    });
    await testCtx.db
      .insert(scoreRun)
      .values([runValues("att_reg_1", 0), runValues("att_reg_1", 1), runValues("att_reg_2", 0)]);
    await testCtx.db.insert(scoreDispute).values([
      {
        id: "disp_reg_1",
        attemptId: "att_reg_1",
        userId: user1Id,
        targetCriterion: "GRA",
        expectedBand: "6.5",
        dueAt: new Date(Date.now() + 72 * 3600 * 1000),
      },
      {
        id: "disp_reg_2",
        attemptId: "att_reg_2",
        userId: user2Id,
        targetCriterion: "PRON",
        expectedBand: "7.0",
        dueAt: new Date(Date.now() + 72 * 3600 * 1000),
      },
    ]);

    // Test export
    const exportUser1 = await exportUserData(testCtx.db, user1Id);
    expect(exportUser1.userId).toBe(user1Id);
    expect(exportUser1.data.user).toHaveLength(1);
    expect(exportUser1.data.consent_event).toHaveLength(2);
    expect(exportUser1.data.session).toHaveLength(1);
    expect(exportUser1.data.account).toHaveLength(1);
    expect(exportUser1.data.forecast_report).toHaveLength(1);
    expect(exportUser1.data.attempt).toHaveLength(1);
    expect(exportUser1.data.score_dispute).toHaveLength(1);
    expect(exportUser1.data.attempt_score).toHaveLength(1);
    expect(exportUser1.data.score_run).toHaveLength(2);

    // Test erase with mock audioBucket
    const deletedAudioKeys: string[] = [];
    const mockAudioBucket = {
      delete: vi.fn(async (key: string) => {
        deletedAudioKeys.push(key);
      }),
    };

    await eraseUserData({ db: testCtx.db, audioBucket: mockAudioBucket }, user1Id);

    // Defense-in-depth: only legitimate user1 audioKey is deleted; foreign audioKey is untouched
    expect(deletedAudioKeys).toContain(`users/${user1Id}/attempts/att_reg_1/p1-1.webm`);
    expect(deletedAudioKeys).not.toContain(`users/${user2Id}/attempts/att_reg_2/victim.webm`);
    // Verify user1 is gone
    const afterEraseUser1 = await exportUserData(testCtx.db, user1Id);
    expect(afterEraseUser1.data.user).toHaveLength(0);
    expect(afterEraseUser1.data.consent_event).toHaveLength(0);
    expect(afterEraseUser1.data.session).toHaveLength(0);
    expect(afterEraseUser1.data.account).toHaveLength(0);
    expect(afterEraseUser1.data.forecast_report).toHaveLength(0);
    expect(afterEraseUser1.data.attempt).toHaveLength(0);
    expect(afterEraseUser1.data.score_dispute).toHaveLength(0);
    expect(afterEraseUser1.data.attempt_score).toHaveLength(0);
    expect(afterEraseUser1.data.score_run).toHaveLength(0);

    // Verify user2 remains completely intact
    const afterEraseUser2 = await exportUserData(testCtx.db, user2Id);
    expect(afterEraseUser2.data.user).toHaveLength(1);
    expect(afterEraseUser2.data.consent_event).toHaveLength(2);
    expect(afterEraseUser2.data.session).toHaveLength(1);
    expect(afterEraseUser2.data.account).toHaveLength(1);
    expect(afterEraseUser2.data.forecast_report).toHaveLength(1);
    expect(afterEraseUser2.data.attempt).toHaveLength(1);
    expect(afterEraseUser2.data.score_dispute).toHaveLength(1);
    expect(afterEraseUser2.data.attempt_score).toHaveLength(1);
    expect(afterEraseUser2.data.score_run).toHaveLength(1);
  });
});
