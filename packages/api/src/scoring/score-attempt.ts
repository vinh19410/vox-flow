import { and, asc, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@vox-flow/db";
import { attempt, attemptAnswer, attemptScore, scoreRun } from "@vox-flow/db/schema";

import { isValidAudioKey } from "../audio";
import { aggregateRuns, overallFromCriteria, type CriterionBands } from "./aggregate";
import { computeCostUsd, type ScoringConfig } from "./config";
import { OpenAIRequestError, type ScoringOpenAIClient } from "./openai-client";
import {
  bandOf,
  buildGradingRequestBody,
  parseGradingContent,
  type GradingAnswer,
  type GradingAudio,
  type ProcessedRun,
} from "./prompt";
import { CRITERION_KEYS, scoredCriterionSchema, type ScoredCriterion } from "./types";

/** Processing attempts (queue deliveries or manual retries) before a score is marked failed. */
export const MAX_SCORING_TRIES = 3;

/**
 * How long a claim stays exclusive. Longer than the slowest pipeline
 * (transcription 60s, then up to three sequential 180s grading calls), so a
 * live worker is never overtaken; after it, the row is assumed abandoned.
 */
export const SCORING_LEASE_MS = 12 * 60 * 1000;

/** An error retrying cannot fix (e.g. the attempt has no answers); fails the score immediately. */
export class NonRetriableScoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetriableScoringError";
  }
}

/** Minimal R2 read surface used by the pipeline. */
export type AudioReader = {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
};

export type ScoreAttemptDeps = {
  db: Database;
  audioBucket: AudioReader | undefined;
  client: ScoringOpenAIClient;
  config: Pick<ScoringConfig, "model" | "runs" | "priceInputPer1M" | "priceOutputPer1M">;
  now?: () => Date;
};

/**
 * - `done`: the score was produced by this call.
 * - `skipped`: nothing to do (no row, already done/failed) — safe to ack.
 * - `failed`: this call hit a terminal error and marked the score failed — safe to ack.
 * Retriable errors are thrown so the queue redelivers the message.
 */
export type ScoreAttemptOutcome = "done" | "skipped" | "failed";

const storedRunPayloadSchema = z.object({
  criteria: z.array(scoredCriterionSchema),
  oneLiner: z.string(),
});

const SECRET_PATTERNS = [/sk-[A-Za-z0-9_-]{8,}/g, /Bearer\s+[A-Za-z0-9._-]+/gi];

/** Error text safe to persist and show to operators: no keys, bounded length. */
export function describeScoringError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  let message = raw;
  for (const pattern of SECRET_PATTERNS) {
    message = message.replace(pattern, "[redacted]");
  }
  return message.slice(0, 500) || "Unknown scoring error";
}

/** True when the API refused the audio part (format, modality or size) rather than the request. */
export function isAudioRejection(error: unknown): boolean {
  if (!(error instanceof OpenAIRequestError)) return false;
  if (error.status === 413) return true;
  return (
    error.status >= 400 &&
    error.status < 500 &&
    // Text-only models reject the input_audio block itself, e.g.
    // "Content blocks are expected to be either text or image_url type".
    /audio|input_audio|format|modalit|content blocks? (are|is) expected/i.test(error.message)
  );
}

/** Marks a non-terminal score as failed with a sanitised reason. */
export async function markScoreFailed(
  db: Database,
  attemptId: string,
  error: unknown,
  now: Date = new Date(),
): Promise<void> {
  await db
    .update(attemptScore)
    .set({ status: "failed", lastError: describeScoringError(error), updatedAt: now })
    .where(
      and(
        eq(attemptScore.attemptId, attemptId),
        inArray(attemptScore.status, ["queued", "processing"]),
      ),
    );
}

/**
 * Scores one forecast-practice attempt end to end. Idempotent and resumable:
 * transcripts already saved and runs already stored are reused, so calling it
 * again after a partial failure only pays for the missing work, and calling it
 * on a `done` row is a no-op.
 */
export async function scoreAttempt(
  deps: ScoreAttemptDeps,
  attemptId: string,
): Promise<ScoreAttemptOutcome> {
  const { db } = deps;
  const now = deps.now ?? (() => new Date());

  // Claim only a queued row, or a processing row whose lease expired (its
  // worker presumably died). A live claim blocks duplicate deliveries.
  const claimedAt = now();
  const leaseCutoff = new Date(claimedAt.getTime() - SCORING_LEASE_MS);
  const [claimed] = await db
    .update(attemptScore)
    .set({
      status: "processing",
      tries: sql`${attemptScore.tries} + 1`,
      updatedAt: claimedAt,
    })
    .where(
      and(
        eq(attemptScore.attemptId, attemptId),
        lt(attemptScore.tries, MAX_SCORING_TRIES),
        or(
          eq(attemptScore.status, "queued"),
          and(
            eq(attemptScore.status, "processing"),
            lt(sql`coalesce(${attemptScore.updatedAt}, ${attemptScore.createdAt})`, leaseCutoff.getTime()),
          ),
        ),
      ),
    )
    .returning({ tries: attemptScore.tries });

  if (!claimed) {
    return "skipped";
  }

  try {
    await runPipeline(deps, attemptId, now);
    return "done";
  } catch (error) {
    const terminal =
      error instanceof NonRetriableScoringError || claimed.tries >= MAX_SCORING_TRIES;
    // Only the current lease holder may record the outcome: a stale worker
    // whose lease was taken over must not overwrite the newer claim. A
    // retriable failure releases the lease (back to queued) so the queue's
    // redelivery can claim it again.
    const released = await db
      .update(attemptScore)
      .set({
        status: terminal ? "failed" : "queued",
        lastError: describeScoringError(error),
        updatedAt: now(),
      })
      .where(
        and(
          eq(attemptScore.attemptId, attemptId),
          eq(attemptScore.status, "processing"),
          eq(attemptScore.tries, claimed.tries),
        ),
      )
      .returning({ attemptId: attemptScore.attemptId });
    if (released.length === 0) {
      console.warn(
        `[scoring] Attempt ${attemptId} lost its lease before failing; leaving the newer claim in charge:`,
        describeScoringError(error),
      );
      return "skipped";
    }
    if (terminal) {
      console.error(`[scoring] Attempt ${attemptId} failed permanently:`, describeScoringError(error));
      return "failed";
    }
    throw error;
  }
}

async function runPipeline(
  deps: ScoreAttemptDeps,
  attemptId: string,
  now: () => Date,
): Promise<void> {
  const { db, config } = deps;

  const [attemptRow] = await db.select().from(attempt).where(eq(attempt.id, attemptId)).limit(1);
  if (!attemptRow) {
    throw new NonRetriableScoringError("Attempt not found");
  }
  if (!attemptRow.topicId) {
    throw new NonRetriableScoringError("Attempt is not a forecast practice attempt");
  }

  const answerRows = await db
    .select()
    .from(attemptAnswer)
    .where(eq(attemptAnswer.attemptId, attemptId))
    .orderBy(asc(attemptAnswer.partNumber), asc(attemptAnswer.orderIndex));
  if (answerRows.length === 0) {
    throw new NonRetriableScoringError("Attempt has no recorded answers");
  }
  for (const row of answerRows) {
    if (!isValidAudioKey(row.audioKey, attemptRow.userId, attemptId)) {
      throw new NonRetriableScoringError(`Answer ${row.questionKey} has an invalid audio key`);
    }
  }

  const existingRuns = await db
    .select({ runIndex: scoreRun.runIndex })
    .from(scoreRun)
    .where(and(eq(scoreRun.attemptId, attemptId), lt(scoreRun.runIndex, config.runs)));
  const doneIndexes = new Set(existingRuns.map((r) => r.runIndex));
  const missingRunIndexes = Array.from({ length: config.runs }, (_, i) => i).filter(
    (i) => !doneIndexes.has(i),
  );

  const needsTranscript = answerRows.filter((row) => row.transcript === null);
  const needsAudio = missingRunIndexes.length > 0 ? answerRows : needsTranscript;

  // 1. Load audio from R2 (once per answer; shared by transcription and grading).
  const audio: GradingAudio = new Map();
  if (needsAudio.length > 0) {
    if (!deps.audioBucket) {
      throw new Error("AUDIO_BUCKET binding unavailable");
    }
    const bucket = deps.audioBucket;
    await Promise.all(
      needsAudio.map(async (row) => {
        const object = await bucket.get(row.audioKey);
        if (!object) {
          throw new Error(`Audio not found for answer ${row.questionKey}`);
        }
        audio.set(row.questionKey, await object.arrayBuffer());
      }),
    );
  }

  // 2. Transcribe answers without a transcript; persist each success so a retry skips it.
  const transcripts = new Map(answerRows.map((row) => [row.questionKey, row.transcript]));
  const transcription = await Promise.allSettled(
    needsTranscript.map(async (row) => {
      const text = await deps.client.transcribe({
        audio: audio.get(row.questionKey)!,
        mimeType: row.mimeType,
      });
      await db.update(attemptAnswer).set({ transcript: text }).where(eq(attemptAnswer.id, row.id));
      transcripts.set(row.questionKey, text);
    }),
  );
  throwFirstRejection(transcription);

  const partCounters = new Map<number, number>();
  const answers: GradingAnswer[] = answerRows.map((row) => {
    const indexInPart = (partCounters.get(row.partNumber) ?? 0) + 1;
    partCounters.set(row.partNumber, indexInPart);
    return {
      questionKey: row.questionKey,
      questionText: row.questionText,
      partNumber: row.partNumber,
      indexInPart,
      transcript: transcripts.get(row.questionKey) ?? "",
      mimeType: row.mimeType,
    };
  });

  // 3. Grade the missing runs in parallel. Every run sends the identical request,
  //    so each body is serialised once and shared.
  if (missingRunIndexes.length > 0) {
    let audioBody: string | undefined;
    let textBody: string | undefined;
    const getAudioBody = () =>
      (audioBody ??= buildGradingRequestBody({ model: config.model, answers, audio }));
    const getTextBody = () => (textBody ??= buildGradingRequestBody({ model: config.model, answers }));

    const grading = await Promise.allSettled(
      missingRunIndexes.map(async (runIndex) => {
        let audioUsed = true;
        let response;
        try {
          response = await deps.client.chatCompletion(getAudioBody());
        } catch (error) {
          if (!isAudioRejection(error)) throw error;
          console.warn(
            `[scoring] Audio rejected for attempt ${attemptId} run ${runIndex}; retrying transcript-only:`,
            describeScoringError(error),
          );
          audioUsed = false;
          response = await deps.client.chatCompletion(getTextBody());
        }

        const run = parseGradingContent(response.content, answers);
        const bands = bandsOf(run);
        await db
          .insert(scoreRun)
          .values({
            attemptId,
            runIndex,
            fc: bands.FC,
            lr: bands.LR,
            gra: bands.GRA,
            p: bands.P,
            overall: overallFromCriteria(bands),
            payloadJson: JSON.stringify(run),
            model: config.model,
            audioUsed,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            costUsd: computeCostUsd(config, response.inputTokens, response.outputTokens),
          })
          .onConflictDoNothing({ target: [scoreRun.attemptId, scoreRun.runIndex] });
      }),
    );
    throwFirstRejection(grading);
  }

  // 4. Aggregate the stored runs (including ones produced by an earlier call).
  const storedRuns = await db
    .select()
    .from(scoreRun)
    .where(and(eq(scoreRun.attemptId, attemptId), lt(scoreRun.runIndex, config.runs)))
    .orderBy(asc(scoreRun.runIndex));
  if (storedRuns.length < config.runs) {
    throw new Error(`Expected ${config.runs} grading runs, found ${storedRuns.length}`);
  }

  const runs = storedRuns.map((row) => {
    const payload = storedRunPayloadSchema.safeParse(JSON.parse(row.payloadJson));
    if (!payload.success) {
      throw new Error(`Stored run ${row.runIndex} has an invalid payload`);
    }
    return { row, payload: payload.data as ProcessedRun };
  });

  const aggregated = aggregateRuns(runs.map((r) => bandsOf(r.payload)));
  const criteria: ScoredCriterion[] = CRITERION_KEYS.map((key) => {
    const target = aggregated.criteria[key];
    const representative = closestBy(runs, (r) => bandOf(r.payload, key), target);
    const criterion = representative.payload.criteria.find((c) => c.key === key)!;
    return { ...criterion, band: target };
  });
  const oneLiner = closestBy(runs, (r) => r.row.overall, aggregated.overall).payload.oneLiner;

  const runCosts = runs.map((r) => r.row.costUsd);
  const costUsd = runCosts.every((c): c is number => c !== null)
    ? runCosts.reduce((sum, c) => sum + c, 0)
    : null;
  const models = [...new Set(runs.map((r) => r.row.model))].join(",");

  const finishedAt = now();
  await db
    .update(attemptScore)
    .set({
      status: "done",
      overall: aggregated.overall,
      criteriaJson: JSON.stringify(criteria),
      oneLiner,
      model: models,
      costUsd,
      lastError: null,
      scoredAt: finishedAt,
      updatedAt: finishedAt,
    })
    // A finished result wins over a failure recorded meanwhile by another worker.
    .where(and(eq(attemptScore.attemptId, attemptId), ne(attemptScore.status, "done")));
}

function bandsOf(run: ProcessedRun): CriterionBands {
  return Object.fromEntries(CRITERION_KEYS.map((key) => [key, bandOf(run, key)])) as CriterionBands;
}

/** First item whose value is closest to target (ties keep the earliest, i.e. lowest runIndex). */
function closestBy<T>(items: readonly T[], value: (item: T) => number, target: number): T {
  if (items.length === 0) {
    throw new Error("closestBy requires at least one item");
  }
  let best: T = items[0] as T;
  for (const item of items) {
    if (Math.abs(value(item) - target) < Math.abs(value(best) - target)) {
      best = item;
    }
  }
  return best;
}

function throwFirstRejection(results: readonly PromiseSettledResult<unknown>[]): void {
  for (const result of results) {
    if (result.status === "rejected") {
      throw result.reason;
    }
  }
}
