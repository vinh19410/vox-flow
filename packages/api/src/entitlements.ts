import { and, eq, gt } from "drizzle-orm";

import type { Database } from "@vox-flow/db";
import { detailUnlock, subscription } from "@vox-flow/db/schema";

export type Entitlement = "free" | "paid";

/**
 * Resolves the user's current plan tier for detail visibility and UI status.
 * Active time-based subscriptions (`expiresAt > now`) grant `"paid"` even when
 * `pointsRemaining === 0` (D-04 detail access stays open until expiry).
 * Note: quota deduction in `reserve()` never bypasses based on this value.
 */
export async function getEntitlement(
  db: Database,
  userId: string,
  now: Date = new Date(),
): Promise<Entitlement> {
  const [activeSub] = await db
    .select({ userId: subscription.userId })
    .from(subscription)
    .where(and(eq(subscription.userId, userId), gt(subscription.expiresAt, now)))
    .limit(1);

  return activeSub ? "paid" : "free";
}

/**
 * Server-side authority for D-04 detail visibility (`scoring.getResult`).
 * Grants access when the user holds an active time-based subscription OR has
 * unlocked the specific attempt via `detail_unlock`.
 */
export async function canViewDetail(
  db: Database,
  userId: string,
  attemptId: string,
  now: Date = new Date(),
): Promise<boolean> {
  if ((await getEntitlement(db, userId, now)) === "paid") {
    return true;
  }

  const [unlocked] = await db
    .select({ id: detailUnlock.id })
    .from(detailUnlock)
    .where(and(eq(detailUnlock.userId, userId), eq(detailUnlock.attemptId, attemptId)))
    .limit(1);

  return Boolean(unlocked);
}
