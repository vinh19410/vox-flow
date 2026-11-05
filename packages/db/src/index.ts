import { drizzle } from "drizzle-orm/d1";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

export function createDb(env: DatabaseConfig) {
  return drizzle(env.DB, { relations });
}

export type Database = ReturnType<typeof createDb>;
export * from "./schema";
export { and, eq, or, desc, asc, sql } from "drizzle-orm";
