import { readScoringConfig, readScoringQueueMaxRetries } from "@vox-flow/api/scoring/config";
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
  // Single source: SCORING_QUEUE_MAX_RETRIES in packages/infra/alchemy.run.ts
  // configures both the consumer's settings.maxRetries and this env binding.
  // Typed field access: renaming or removing the binding in alchemy.run.ts
  // breaks the type check here instead of silently drifting to the fallback.
  const maxRetries = readScoringQueueMaxRetries({
    SCORING_QUEUE_MAX_RETRIES: ENV.SCORING_QUEUE_MAX_RETRIES,
  });
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
      const isLastDelivery = message.attempts > maxRetries;
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
