import type { Database } from "@vox-flow/db";

export type Entitlement = "free" | "paid";

/**
 * Resolves the user's current plan tier. Defaults to `"free"` until billing
 * tables (`subscription`, #19) are introduced.
 */
export async function getEntitlement(_db: Database, _userId: string): Promise<Entitlement> {
  return "free";
}

/**
 * Server-side authority for D-04 detail visibility (`scoring.getResult`).
 * Billing (#19) will extend this with per-attempt `detail_unlock` lookups.
 */
export async function canViewDetail(
  db: Database,
  userId: string,
  _attemptId: string,
): Promise<boolean> {
  return (await getEntitlement(db, userId)) === "paid";
}
