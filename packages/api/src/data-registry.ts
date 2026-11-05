import { eq } from "drizzle-orm";

import type { Database } from "@vox-flow/db";
import { account, consentEvent, session, user } from "@vox-flow/db/schema";

export type EraseContext = {
  db: Database;
  audioBucket?: {
    delete?: (key: string) => Promise<void>;
  };
};

export interface TablePersonalDataHandler {
  tableName: string;
  export: (db: Database, userId: string) => Promise<unknown[]>;
  erase: (ctx: EraseContext, userId: string) => Promise<void>;
}

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
};

export const NON_PERSONAL_TABLES: Record<string, string> = {
  verification:
    "Bảng verification lưu token OTP/email tạm thời xác thực, không liên kết trực tiếp theo khóa ngoại với userId của học viên",
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
