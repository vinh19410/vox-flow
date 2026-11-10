import { readScoringConfig } from "@vox-flow/api/scoring/config";
import { createOpenAIScoringClient } from "@vox-flow/api/scoring/openai-client";
import { parseScoringQueueMessage } from "@vox-flow/api/scoring/queue";
import {
  describeScoringError,
  markScoreFailed,
  scoreAttempt,
  type ScoreAttemptDeps,
} from "@vox-flow/api/scoring/score-attempt";

import { ENV } from "./env.server";
import { getDb } from "./services";

/** Must match `settings.maxRetries` of the scoring consumer in packages/infra/alchemy.run.ts. */
export const SCORING_QUEUE_MAX_RETRIES = 3;

type QueueMessageLike = {
  readonly body: unknown;
  readonly attempts: number;
  ack(): void;
  retry(): void;
};

function createScoringDeps(): ScoreAttemptDeps {
  const env = ENV as unknown as Record<string, unknown>;
  const config = readScoringConfig(env);
  return {
    db: getDb(),
    audioBucket: ENV.AUDIO_BUCKET,
    client: createOpenAIScoringClient({ apiKey: config.apiKey }),
    config,
  };
}

/**
 * Scoring queue consumer. Each message is acked once scoring finished (done,
 * skipped, or terminally failed) and retried on retriable errors; on the final
 * delivery an error marks the score failed so it never stays pending.
 */
export async function handleScoringQueue(batch: { readonly messages: readonly QueueMessageLike[] }): Promise<void> {
  for (const message of batch.messages) {
    const body = parseScoringQueueMessage(message.body);
    if (!body) {
      console.error("[scoring-queue] Dropping malformed message");
      message.ack();
      continue;
    }

    try {
      const outcome = await scoreAttempt(createScoringDeps(), body.attemptId);
      console.log(`[scoring-queue] Attempt ${body.attemptId}: ${outcome}`);
      message.ack();
    } catch (error) {
      const isLastDelivery = message.attempts > SCORING_QUEUE_MAX_RETRIES;
      console.error(
        `[scoring-queue] Attempt ${body.attemptId} delivery ${message.attempts} failed:`,
        describeScoringError(error),
      );
      if (!isLastDelivery) {
        message.retry();
        continue;
      }
      try {
        await markScoreFailed(getDb(), body.attemptId, error);
      } catch (markError) {
        console.error(
          `[scoring-queue] Could not mark attempt ${body.attemptId} failed:`,
          describeScoringError(markError),
        );
      }
      message.ack();
    }
  }
}
