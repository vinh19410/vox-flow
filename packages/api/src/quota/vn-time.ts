import { startOfVietnamDayMs } from "../scoring/retry-limits";

/** Fixed UTC+7 offset: Vietnam (Asia/Ho_Chi_Minh) has no daylight saving time. */
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Milliseconds per calendar day in UTC+7. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Unsubmitted `in_progress` attempts older than 30 minutes release their
 * global budget hold so abandoned browser tabs cannot exhaust `FREE_DAILY_BUDGET_VND`.
 */
export const UNSUBMITTED_HOLD_TTL_MS = 30 * 60 * 1000;

/** Returns `"YYYY-MM-DD"` in Asia/Ho_Chi_Minh (`UTC+7`) for `nowMs`. */
export function vnDay(nowMs: number): string {
  return new Date(nowMs + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
}

/** Returns UTC epoch ms for the next `00:00:00.000` in Asia/Ho_Chi_Minh. */
export function nextVietnamMidnightMs(nowMs: number): number {
  return startOfVietnamDayMs(nowMs) + DAY_MS;
}
