import { z } from "zod";

import type { ScoringQueueMessage } from "./types";

/** Producer side of the scoring Cloudflare Queue (structurally matches `Queue.send`). */
export type ScoringQueue = {
  send(body: ScoringQueueMessage): Promise<unknown>;
};

const scoringQueueMessageSchema = z.object({ attemptId: z.string().min(1) });

/** Validates a queue message body coming off the wire. Returns null when malformed. */
export function parseScoringQueueMessage(body: unknown): ScoringQueueMessage | null {
  const parsed = scoringQueueMessageSchema.safeParse(body);
  return parsed.success ? { attemptId: parsed.data.attemptId } : null;
}

/**
 * Sends an attempt to the scoring queue without ever throwing: the score row is
 * already persisted as `queued`, and the scheduled sweep re-enqueues rows whose
 * message was lost, so a missing binding or a failed send must not fail the
 * learner's request. Returns whether the message was handed to the queue.
 */
export async function enqueueScoring(
  queue: ScoringQueue | undefined,
  attemptId: string,
): Promise<boolean> {
  if (!queue) {
    console.warn(`[scoring] SCORING_QUEUE binding unavailable; attempt ${attemptId} left queued`);
    return false;
  }
  try {
    await queue.send({ attemptId });
    return true;
  } catch (error) {
    console.error(`[scoring] Failed to enqueue attempt ${attemptId}:`, error);
    return false;
  }
}
