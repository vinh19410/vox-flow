import { createAuth as createConfiguredAuth } from "@vox-flow/auth";
import { type Database, createDb } from "@vox-flow/db";

import { ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}
export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()));
}
