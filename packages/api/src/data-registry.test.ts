import * as schema from "@vox-flow/db/schema";
import { createDb } from "@vox-flow/db";
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
import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import { eq, getTableName, is, Table } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  DATA_REGISTRY,
  eraseUserData,
  exportUserData,
  NON_PERSONAL_TABLES,
} from "./data-registry";
import { createTestDb, type TestDbContext } from "./test/db";

/**
 * Bọc driver D1 ở tầng `prepare`/`bind` để đếm số bind parameter mà D1 thực sự
 * nhận cho mỗi query (trần D1 production: 100 params/query, issue #92).
 * Chỉ bật SAU khi seed fixture xong — insert bulk nhiều cột vượt 100 params.
 */
function createRecordingD1(d1: D1Database): {
  recording: D1Database;
  captured: { sql: string; params: number }[];
} {
  const captured: { sql: string; params: number }[] = [];
  const recording = new Proxy(d1, {
    get(target, prop) {
      if (prop === "prepare") {
        return (sql: string) => {
          const stmt = target.prepare(sql);
          return new Proxy(stmt, {
            get(st, p2) {
              if (p2 === "bind") {
                return (...args: Parameters<D1PreparedStatement["bind"]>) => {
                  captured.push({ sql, params: args.length });
                  return st.bind(...args);
                };
              }
              const value = Reflect.get(st, p2, st);
              return typeof value === "function" ? value.bind(st) : value;
            },
          });
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return { recording, captured };
}

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
      {
        id: "ans_reg_2_legit",
        attemptId: "att_reg_2",
        questionKey: "p1-1",
        questionText: "User2 question",
        partNumber: 1,
        orderIndex: 0,
        audioKey: `users/${user2Id}/attempts/att_reg_2/p1-1.webm`,
        durationMs: 9000,
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
    expect(exportUser1.data.score_run).toHaveLength(0);

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
    // Nhánh subquery rỗng: user đã mất attempt → export attempt_answer rỗng
    expect(afterEraseUser1.data.attempt_answer).toHaveLength(0);
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
    expect(afterEraseUser2.data.score_run).toHaveLength(0);

    // Erase vẫn xóa vật lý (behavior-lock; bằng chứng handler nằm ở assertion
    // params.length — cascade FK làm đếm row sau erase trở nên vacuous, #92)
    const remainingRuns1 = await testCtx.db
      .select()
      .from(scoreRun)
      .where(eq(scoreRun.attemptId, "att_reg_1"));
    expect(remainingRuns1).toHaveLength(0);
    const remainingAnswers1 = await testCtx.db
      .select()
      .from(attemptAnswer)
      .where(eq(attemptAnswer.attemptId, "att_reg_1"));
    expect(remainingAnswers1).toHaveLength(0);
    const user2Runs = await testCtx.db
      .select()
      .from(scoreRun)
      .where(eq(scoreRun.attemptId, "att_reg_2"));
    expect(user2Runs).toHaveLength(1);
    const user2Answers = await testCtx.db
      .select()
      .from(attemptAnswer)
      .where(eq(attemptAnswer.attemptId, "att_reg_2"));
    expect(user2Answers).toHaveLength(1);
  });

  // Timeout 30s: behavior-lock đếm vật lý sau erase chạy qua attempt.erase N+1
  // (121 query tuần tự trên Miniflare) — known-limitation, xem plan Known Limitations.
  it("export and erase queries stay within D1 bind parameter limit", { timeout: 30_000 }, async () => {
    // Seed bằng testCtx.db (chưa bật đo) vì bulk insert nhiều cột vượt 100 params.
    // Quy tắc chunk: rows × binds/hàng ≤ 100 (Miniflare enforce SQLITE_MAX_VARIABLE_NUMBER=100
    // lúc execute). drizzle bind cả cột default: attempt 6 binds/hàng → chunk 15 (90);
    // attempt_answer ~9-10 binds/hàng → chunk 8 (≤80).
    const scaleUserId = "usr_scale_1";
    const ctrlUserId = "usr_scale_2";
    await testCtx.db.insert(user).values([
      { id: scaleUserId, name: "Scale 1", email: "scale1@voxflow.local" },
      { id: ctrlUserId, name: "Scale 2", email: "scale2@voxflow.local" },
    ]);
    const scaleAttempts = Array.from({ length: 120 }, (_, i) => ({
      id: `att_scale_1_${i}`,
      userId: scaleUserId,
      mode: "full",
      status: "submitted" as const,
    }));
    for (let i = 0; i < scaleAttempts.length; i += 15) {
      await testCtx.db.insert(attempt).values(scaleAttempts.slice(i, i + 15));
    }
    await testCtx.db
      .insert(attempt)
      .values({ id: "att_scale_2_0", userId: ctrlUserId, mode: "full", status: "submitted" });

    const scaleAnswers = scaleAttempts.map((att) => ({
      id: `ans_${att.id}`,
      attemptId: att.id,
      questionKey: "p1-1",
      questionText: "Scale question",
      partNumber: 1,
      orderIndex: 0,
      audioKey: `users/${scaleUserId}/attempts/${att.id}/p1-1.webm`,
      durationMs: 1000,
      mimeType: "audio/webm",
    }));
    for (let i = 0; i < scaleAnswers.length; i += 8) {
      await testCtx.db.insert(attemptAnswer).values(scaleAnswers.slice(i, i + 8));
    }
    await testCtx.db.insert(attemptAnswer).values({
      id: "ans_scale_2_0",
      attemptId: "att_scale_2_0",
      questionKey: "p1-1",
      questionText: "Control question",
      partNumber: 1,
      orderIndex: 0,
      audioKey: `users/${ctrlUserId}/attempts/att_scale_2_0/p1-1.webm`,
      durationMs: 1000,
      mimeType: "audio/webm",
    });
    await testCtx.db.insert(scoreRun).values([
      {
        attemptId: "att_scale_1_0",
        runIndex: 0,
        fc: 6.5,
        lr: 6,
        gra: 6,
        p: 6.5,
        overall: 6.5,
        payloadJson: "{}",
        model: "test-model",
      },
      {
        attemptId: "att_scale_1_0",
        runIndex: 1,
        fc: 7,
        lr: 6.5,
        gra: 6.5,
        p: 6,
        overall: 6.5,
        payloadJson: "{}",
        model: "test-model",
      },
      {
        attemptId: "att_scale_2_0",
        runIndex: 0,
        fc: 6,
        lr: 6,
        gra: 6,
        p: 6,
        overall: 6,
        payloadJson: "{}",
        model: "test-model",
      },
    ]);

    // Bật đo SAU khi seed xong
    const { recording, captured } = createRecordingD1(testCtx.d1);
    const recordingDb = createDb({ DB: recording });

    // Export sweep — .then(() => null, e => e) để GREEN không thể pass nếu D1 vẫn ném.
    // RED: D1 local (miniflare) ném lỗi >100 SQL variables lúc execute (bind đã kịp capture).
    const exportErr = await exportUserData(recordingDb, scaleUserId).then(
      () => null,
      (e: unknown) => e,
    );
    const selectCaptures = captured.filter((c) => c.sql.startsWith("select"));
    // (a) guard chống capture rỗng
    expect(selectCaptures.length).toBeGreaterThanOrEqual(3);
    // (b) RED fail đúng lý do: 120 params > 100 trần D1
    for (const capture of selectCaptures) {
      expect(capture.params, `query vượt trần bind D1: ${capture.sql}`).toBeLessThanOrEqual(100);
    }
    // (c) GREEN không được còn lỗi runtime D1
    expect(exportErr).toBeNull();

    // GREEN-only: kết quả export đúng (chạy lại trên db thường, không đếm capture)
    const exported = await exportUserData(testCtx.db, scaleUserId);
    expect(exported.data.attempt).toHaveLength(120);
    expect(exported.data.attempt_answer).toHaveLength(120);

    // Erase sweep (reset trước khi đo) — cùng pattern .then(() => null, e => e)
    captured.length = 0;
    const eraseErr = await eraseUserData({ db: recordingDb }, scaleUserId).then(
      () => null,
      (e: unknown) => e,
    );
    const deleteCaptures = captured.filter((c) => c.sql.startsWith("delete"));
    // (a) guard chống capture rỗng
    expect(deleteCaptures.length).toBeGreaterThanOrEqual(2);
    // (b) RED fail đúng lý do: delete score_run với 120 params
    for (const capture of deleteCaptures) {
      expect(capture.params, `delete vượt trần bind D1: ${capture.sql}`).toBeLessThanOrEqual(100);
    }
    // (c) GREEN không được còn lỗi runtime D1
    expect(eraseErr).toBeNull();
    // (d) khóa đúng handler: delete phải chạm đúng bảng score_run & attempt_answer
    expect(deleteCaptures.some((c) => c.sql.includes('"score_run"'))).toBe(true);
    expect(deleteCaptures.some((c) => c.sql.includes('"attempt_answer"'))).toBe(true);

    // Behavior-lock: dữ liệu của scale user bị xóa sạch, control nguyên vẹn
    const remainingRuns = await testCtx.db
      .select()
      .from(scoreRun)
      .where(eq(scoreRun.attemptId, "att_scale_1_0"));
    expect(remainingRuns).toHaveLength(0);
    const remainingAnswers = await testCtx.db
      .select()
      .from(attemptAnswer)
      .where(eq(attemptAnswer.attemptId, "att_scale_1_0"));
    expect(remainingAnswers).toHaveLength(0);
    const remainingAttempts = await testCtx.db
      .select()
      .from(attempt)
      .where(eq(attempt.userId, scaleUserId));
    expect(remainingAttempts).toHaveLength(0);
    const ctrlRuns = await testCtx.db
      .select()
      .from(scoreRun)
      .where(eq(scoreRun.attemptId, "att_scale_2_0"));
    expect(ctrlRuns).toHaveLength(1);
    const ctrlAnswers = await testCtx.db
      .select()
      .from(attemptAnswer)
      .where(eq(attemptAnswer.attemptId, "att_scale_2_0"));
    expect(ctrlAnswers).toHaveLength(1);
    const ctrlAttempts = await testCtx.db
      .select()
      .from(attempt)
      .where(eq(attempt.userId, ctrlUserId));
    expect(ctrlAttempts).toHaveLength(1);
  });

  it("export payload only contains learner-facing result fields", async () => {
    const uid = "usr_shape_1";
    await testCtx.db
      .insert(user)
      .values({ id: uid, name: "Shape", email: "shape@voxflow.local" });
    await testCtx.db
      .insert(attempt)
      .values({ id: "att_shape_1", userId: uid, mode: "quick", status: "submitted" });
    await testCtx.db.insert(attemptScore).values({
      attemptId: "att_shape_1",
      userId: uid,
      status: "done",
      overall: 7,
      criteriaJson: "[]",
      oneLiner: "Good work",
      model: "test-model",
      tries: 2,
      lastError: "boom",
      costUsd: 0.02,
    });
    await testCtx.db.insert(scoreRun).values({
      attemptId: "att_shape_1",
      runIndex: 0,
      fc: 7,
      lr: 7,
      gra: 7,
      p: 7,
      overall: 7,
      payloadJson: '{"raw":true}',
      model: "test-model",
      costUsd: 0.02,
    });

    const exported = await exportUserData(testCtx.db, uid);

    // score_run là dữ liệu vận hành chấm điểm — không thuộc export cá nhân (#92)
    expect(exported.data.score_run).toEqual([]);

    // attempt_score chỉ trả trường kết quả học viên — exact key set loại trừ
    // userId/model/tries/lastError/costUsd/updatedAt
    const scores = exported.data.attempt_score ?? [];
    expect(scores).toHaveLength(1);
    const score = scores[0];
    expect(score && typeof score === "object" ? Object.keys(score).sort() : []).toEqual(
      [
        "attemptId",
        "status",
        "overall",
        "criteriaJson",
        "oneLiner",
        "createdAt",
        "scoredAt",
      ].sort(),
    );
  });
});
