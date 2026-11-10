/** Fixed UTC+7 offset: Vietnam (Asia/Ho_Chi_Minh) has no daylight saving time. */
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Start (UTC epoch ms) of the Vietnam calendar day containing `nowMs`.
 * Buckets the per-user daily manual-retry quota regardless of server timezone.
 */
export function startOfVietnamDayMs(nowMs: number): number {
  const localDate = new Date(nowMs + VIETNAM_OFFSET_MS);
  return (
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
    ) - VIETNAM_OFFSET_MS
  );
}
