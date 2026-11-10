import { eq, inArray } from "drizzle-orm";

import type { Database } from "@vox-flow/db";
import {
  account,
  attempt,
  attemptAnswer,
  attemptScore,
  consentEvent,
  forecastReport,
  scoreDispute,
  scoreRun,
  scoringRetryLog,
  session,
  user,
  userProfile,
} from "@vox-flow/db/schema";

export type EraseContext = {
  db: Database;
  /** R2-backed audio storage. `list` is required so erasure can reach orphaned
   * generation blobs that no attempt_answer row points at anymore. */
  audioBucket: {
    delete: (key: string) => Promise<void>;
    list: (opts: { prefix: string; cursor?: string }) => Promise<{
      objects: { key: string }[];
      truncated: boolean;
      cursor?: string;
    }>;
  };
};

export interface TablePersonalDataHandler {
  tableName: string;
  export: (db: Database, userId: string) => Promise<unknown[]>;
  erase: (ctx: EraseContext, userId: string) => Promise<void>;
}

// Convention cho bảng thêm sau này (xem #92):
// - `export` chỉ lộ trường kết quả của học viên; trường vận hành (model, cost,
//   token, lỗi, payload thô) không bao giờ nằm trong payload export.
// - Bảng mới CHỈ có khóa `attempt_id` (không có cột `user_id` riêng) phải query
//   theo `userId` qua subquery (`attempt_id IN (SELECT id FROM attempt WHERE
//   user_id = ?)`), không bao giờ IN-list danh sách id — D1 giới hạn 100 bind
//   parameters/query. Bảng có cột `user_id` riêng thì `eq(col.userId, userId)`
//   trực tiếp (ví dụ `attempt_score`).
export const DATA_REGISTRY: Record<string, TablePersonalDataHandler> = {
  user: {
    tableName: "user",
    export: async (db, userId) => {
      return db.select().from(user).where(eq(user.id, userId));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(user).where(eq(user.id, userId));
    },
  },
  user_profile: {
    tableName: "user_profile",
    export: async (db, userId) => {
      return db.select().from(userProfile).where(eq(userProfile.userId, userId));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(userProfile).where(eq(userProfile.userId, userId));
    },
  },
  consent_event: {
    tableName: "consent_event",
    export: async (db, userId) => {
      return db.select().from(consentEvent).where(eq(consentEvent.userId, userId));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(consentEvent).where(eq(consentEvent.userId, userId));
    },
  },
  session: {
    tableName: "session",
    export: async (db, userId) => {
      const rows = await db.select().from(session).where(eq(session.userId, userId));
      return rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        userAgent: r.userAgent,
        ipAddress: r.ipAddress,
      }));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(session).where(eq(session.userId, userId));
    },
  },
  account: {
    tableName: "account",
    export: async (db, userId) => {
      const rows = await db.select().from(account).where(eq(account.userId, userId));
      return rows.map((r) => ({
        id: r.id,
        providerId: r.providerId,
        accountId: r.accountId,
        createdAt: r.createdAt,
      }));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(account).where(eq(account.userId, userId));
    },
  },
  forecast_report: {
    tableName: "forecast_report",
    export: async (db, userId) => {
      const rows = await db
        .select()
        .from(forecastReport)
        .where(eq(forecastReport.userId, userId));
      return rows.map((r) => ({
        id: r.id,
        topicId: r.topicId,
        notes: r.notes,
        createdAt: r.createdAt,
      }));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(forecastReport).where(eq(forecastReport.userId, userId));
    },
  },
  attempt_score: {
    tableName: "attempt_score",
    export: async (db, userId) => {
      // Chỉ trường kết quả học viên; bỏ userId/model/tries/lastError/costUsd/
      // updatedAt (dữ liệu vận hành, xem #92).
      return db
        .select({
          attemptId: attemptScore.attemptId,
          status: attemptScore.status,
          overall: attemptScore.overall,
          criteriaJson: attemptScore.criteriaJson,
          oneLiner: attemptScore.oneLiner,
          createdAt: attemptScore.createdAt,
          scoredAt: attemptScore.scoredAt,
        })
        .from(attemptScore)
        .where(eq(attemptScore.userId, userId));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(attemptScore).where(eq(attemptScore.userId, userId));
    },
  },
  score_run: {
    tableName: "score_run",
    // score_run là dữ liệu vận hành chấm điểm (schema: "Never shown to the
    // learner directly") — không thuộc export cá nhân theo quyết định #92.
    // Nếu OQ-6 kết luận phải xuất, mở lại bằng projection riêng.
    export: async () => [],
    // Erase vẫn xóa đầy đủ: subquery theo userId, không IN-list id (trần 100
    // bind parameters của D1, xem #92).
    erase: async (ctx, userId) => {
      await ctx.db.delete(scoreRun).where(
        inArray(
          scoreRun.attemptId,
          ctx.db.select({ id: attempt.id }).from(attempt).where(eq(attempt.userId, userId)),
        ),
      );
    },
  },
  attempt: {
    tableName: "attempt",
    export: async (db, userId) => {
      return db.select().from(attempt).where(eq(attempt.userId, userId));
    },
    erase: async (ctx, userId) => {
      const userAttempts = await ctx.db.select().from(attempt).where(eq(attempt.userId, userId));
      for (const att of userAttempts) {
        // Erase by R2 prefix, not by row: per-generation audio keys leave orphaned
        // blobs no attempt_answer row points at anymore. R2 pages at 1000 objects,
        // so keep following `truncated`/`cursor` until the prefix is empty. Any
        // failure throws BEFORE the attempt row is deleted — a deleted row would
        // make the prefix unreachable for every later erasure pass.
        const prefix = `users/${userId}/attempts/${att.id}/`;
        let cursor: string | undefined;
        const undeleted: string[] = [];
        do {
          const page = await ctx.audioBucket.list({ prefix, cursor });
          for (const obj of page.objects) {
            try {
              await ctx.audioBucket.delete(obj.key);
            } catch {
              // One retry for transient errors, then give up loudly.
              try {
                await ctx.audioBucket.delete(obj.key);
              } catch {
                undeleted.push(obj.key);
              }
            }
          }
          if (page.truncated && !page.cursor) {
            throw new Error(`Erasure stalled for ${prefix}: truncated page without a cursor`);
          }
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);
        if (undeleted.length > 0) {
          throw new Error(`Erasure left ${undeleted.length} audio object(s) undeleted under ${prefix}`);
        }
      }
      await ctx.db.delete(attempt).where(eq(attempt.userId, userId));
    },
  },
  attempt_answer: {
    tableName: "attempt_answer",
    export: async (db, userId) => {
      return db
        .select()
        .from(attemptAnswer)
        .where(
          inArray(
            attemptAnswer.attemptId,
            db.select({ id: attempt.id }).from(attempt).where(eq(attempt.userId, userId)),
          ),
        );
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(attemptAnswer).where(
        inArray(
          attemptAnswer.attemptId,
          ctx.db.select({ id: attempt.id }).from(attempt).where(eq(attempt.userId, userId)),
        ),
      );
    },
  },
  score_dispute: {
    tableName: "score_dispute",
    export: async (db, userId) => {
      return db.select().from(scoreDispute).where(eq(scoreDispute.userId, userId));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(scoreDispute).where(eq(scoreDispute.userId, userId));
    },
  },
  scoring_retry_log: {
    tableName: "scoring_retry_log",
    export: async (db, userId) => {
      return db.select().from(scoringRetryLog).where(eq(scoringRetryLog.userId, userId));
    },
    erase: async (ctx, userId) => {
      await ctx.db.delete(scoringRetryLog).where(eq(scoringRetryLog.userId, userId));
    },
  },
};

export const NON_PERSONAL_TABLES: Record<string, string> = {
  verification:
    "Bảng verification lưu token OTP/email tạm thời xác thực, không liên kết trực tiếp theo khóa ngoại với userId của học viên",
  forecast_topic:
    "Bảng forecast_topic chứa đề thi IELTS forecast theo quý do quản trị viên biên soạn và duyệt, không chứa dữ liệu định danh người dùng",
  forecast_source:
    "Bảng forecast_source chứa thông tin nguồn gốc của đề thi (tự soạn, học viên hoặc web) phục vụ kiểm duyệt nội dung",
};

export async function exportUserData(db: Database, userId: string) {
  const result: Record<string, unknown[]> = {};
  for (const [tableName, handler] of Object.entries(DATA_REGISTRY)) {
    result[tableName] = await handler.export(db, userId);
  }
  return {
    exportedAt: new Date().toISOString(),
    userId,
    data: result,
  };
}

export async function eraseUserData(ctx: EraseContext, userId: string) {
  // Delete all dependent child tables first, then delete user table
  const dependentTables = Object.keys(DATA_REGISTRY).filter((t) => t !== "user");
  for (const tableName of dependentTables) {
    const handler = DATA_REGISTRY[tableName];
    if (handler) {
      await handler.erase(ctx, userId);
    }
  }
  if (DATA_REGISTRY.user) {
    await DATA_REGISTRY.user.erase(ctx, userId);
  }
}
