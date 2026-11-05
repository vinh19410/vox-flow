import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { D1Database } from "@cloudflare/workers-types";
import { createDb, type Database } from "@vox-flow/db";
import { Miniflare } from "miniflare";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../../../db/src/migrations");

export type TestDbContext = {
  db: Database;
  d1: D1Database;
  dispose: () => Promise<void>;
};

export async function createTestDb(): Promise<TestDbContext> {
  const mf = new Miniflare({
    modules: true,
    script: "export default { fetch: () => new Response('OK') }",
    d1Databases: ["DB"],
  });

  try {
    const rawD1 = await mf.getD1Database("DB");
    const d1 = rawD1 as unknown as D1Database;

    // Enable foreign keys in test SQLite/D1 instance
    await d1.prepare("PRAGMA foreign_keys = ON;").run();

    if (!existsSync(MIGRATIONS_DIR)) {
      throw new Error(`Migrations directory not found at ${MIGRATIONS_DIR}`);
    }

    const entries = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    if (entries.length === 0) {
      throw new Error(`No migration directories found in ${MIGRATIONS_DIR}`);
    }

    for (const dir of entries) {
      const migrationFilePath = join(MIGRATIONS_DIR, dir, "migration.sql");
      if (!existsSync(migrationFilePath)) {
        throw new Error(`Migration file missing: ${migrationFilePath}`);
      }
      const sqlContent = readFileSync(migrationFilePath, "utf-8");
      const statements = sqlContent
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const prepared = statements.map((stmt) => d1.prepare(stmt));
      if (prepared.length > 0) {
        await d1.batch(prepared);
      }
    }

    const db = createDb({ DB: d1 });

    return {
      db,
      d1,
      dispose: async () => {
        await mf.dispose();
      },
    };
  } catch (err) {
    await mf.dispose();
    throw err;
  }
}
