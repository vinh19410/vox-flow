import { trpcServer } from "@hono/trpc-server";
import {
  and,
  attempt,
  attemptAnswer,
  desc,
  eq,
  forecastTopic,
  or,
  scoreDispute,
} from "@vox-flow/db";
import {
  canAccessAudio,
  buildAudioKey,
  isValidAudioKey,
  resolveAudioStreamResponse,
  upsertAnswerRecording,
} from "@vox-flow/api";
import { appRouter } from "@vox-flow/api/routers/index";
import {
  getValidQuestionKeysForTopic,
  MAX_TOTAL_AUDIO_BYTES,
} from "@vox-flow/api/scoring/forecast-keys";
import {
  maxAnswersForAttempt,
  TOPIC_LESS_CAP,
} from "@vox-flow/api/scoring/answer-limits";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";
import { createContext } from "./context";
import { ENV } from "./env.server";
import { handleScoringQueue } from "./queue";
import { handleScheduled } from "./scheduled";
import { createAuth, getDb } from "./services";
const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN.replace(/\/+$/, ""),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => (await createAuth()).handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);
const AUDIO_EXT_MAP = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
} as const;
type AllowedAudioType = keyof typeof AUDIO_EXT_MAP;

const audioUploadQuerySchema = z.object({
  part: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(3)).default(1),
  order: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100)).default(0),
  durationMs: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(3_600_000)).default(0),
  questionText: z.string().max(2000).default(""),
  generation: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)).default(0),
});

app.post("/api/attempts/:attemptId/answers/:questionKey/audio", async (c) => {
  const auth = await createAuth();
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const attemptId = c.req.param("attemptId");
  const questionKey = c.req.param("questionKey");

  // Sanitize questionKey against path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(questionKey)) {
    return c.json({ error: "Invalid question key" }, 400);
  }

  // Enforce Content-Length header checks
  const contentLengthHeader = c.req.header("content-length");
  if (!contentLengthHeader) {
    return c.json({ error: "Content-Length header required" }, 411);
  }
  if (!/^\d+$/.test(contentLengthHeader)) {
    return c.json({ error: "Invalid Content-Length header" }, 400);
  }
  const contentLength = parseInt(contentLengthHeader, 10);
  if (contentLength === 0) {
    return c.json({ error: "Empty payload not allowed" }, 400);
  }
  if (contentLength > 10 * 1024 * 1024) {
    return c.json({ error: "Payload too large (max 10MB)" }, 413);
  }

  // Enforce Content-Type allowlist (no silent fallback)
  const rawContentType = c.req.header("content-type");
  if (!rawContentType) {
    return c.json({ error: "Unsupported Media Type" }, 415);
  }
  const baseContentType = rawContentType.split(";")[0]?.trim().toLowerCase();
  if (!baseContentType || !Object.hasOwn(AUDIO_EXT_MAP, baseContentType)) {
    return c.json({ error: "Unsupported Media Type" }, 415);
  }
  const contentType = baseContentType as AllowedAudioType;

  // Validate query parameters via Zod
  const queryResult = audioUploadQuerySchema.safeParse(c.req.query());
  if (!queryResult.success) {
    return c.json({ error: "Invalid query parameters", details: queryResult.error.flatten() }, 400);
  }
  const { part: partNumber, order: orderIndex, durationMs, questionText, generation } = queryResult.data;

  // Ceiling on the client-supplied generation: a poisoned value (far beyond any
  // real epoch-ms stamp) must not lock this question's row forever. Ownership is
  // already enforced above, so a bad value can only hurt its own attempt; the
  // ceiling exists for client bugs, not attackers — keep it generous (24h) so
  // moderately fast clocks are not rejected forever.
  if (generation > Date.now() + 24 * 60 * 60 * 1000) {
    return c.json({ error: "Generation too far in the future" }, 400);
  }

  if (!c.req.raw.body) {
    return c.json({ error: "Empty payload body" }, 400);
  }


  const db = getDb();
  const [currentAttempt] = await db
    .select()
    .from(attempt)
    .where(eq(attempt.id, attemptId))
    .limit(1);

  if (!currentAttempt) {
    return c.json({ error: "Attempt not found" }, 404);
  }
  if (currentAttempt.userId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (currentAttempt.status !== "in_progress") {
    return c.json({ error: "Cannot upload to finalized attempt" }, 400);
  }

  // Load existing answers once: validates question keys against the topic,
  // caps the answer count, enables upsert-aware byte accounting, and feeds the
  // stale-generation fast path (a read-only optimization; the conditional
  // upsert below is the real ordering gate).
  const existingAnswers = await db
    .select()
    .from(attemptAnswer)
    .where(eq(attemptAnswer.attemptId, attemptId));
  const existingAnswer = existingAnswers.find((a) => a.questionKey === questionKey);

  if (existingAnswer && generation < existingAnswer.generation) {
    return c.json({ error: "stale_generation", storedGeneration: existingAnswer.generation }, 409);
  }

  if (currentAttempt.topicId) {
    const [topic] = await db
      .select({
        id: forecastTopic.id,
        part: forecastTopic.part,
        questions: forecastTopic.questions,
      })
      .from(forecastTopic)
      .where(eq(forecastTopic.id, currentAttempt.topicId))
      .limit(1);
    if (topic) {
      const validKeys = getValidQuestionKeysForTopic(topic, currentAttempt.questionKey);
      if (!validKeys.has(questionKey)) {
        return c.json({ error: "Invalid question key for this attempt" }, 400);
      }
    }
    // A missing topic row must not shrink the limit to 0 and brick the
    // attempt: fall back to the static cap (answer-limits.ts).
    const maxCount = maxAnswersForAttempt(currentAttempt, topic ?? null);
    if (!existingAnswer && existingAnswers.length >= maxCount) {
      return c.json({ error: "Question limit reached for this attempt" }, 400);
    }
  } else if (!existingAnswer && existingAnswers.length >= TOPIC_LESS_CAP) {
    return c.json({ error: "Question limit reached" }, 400);
  }

  // Upsert-aware accounting: re-recording replaces the previous size instead
  // of accumulating it.
  const currentTotalBytes = existingAnswers.reduce((sum, a) => sum + a.sizeBytes, 0);
  const existingBytes = existingAnswer?.sizeBytes ?? 0;
  const newTotalBytes = currentTotalBytes - existingBytes + contentLength;
  if (newTotalBytes > MAX_TOTAL_AUDIO_BYTES) {
    return c.json({ error: "Payload too large: total audio exceeds 35MB" }, 413);
  }

  const audioKey = buildAudioKey(session.user.id, attemptId, questionKey, contentType, generation);

  const bucket = "AUDIO_BUCKET" in ENV ? (ENV.AUDIO_BUCKET as R2Bucket) : undefined;
  if (!bucket) {
    return c.json({ error: "Storage unavailable" }, 503);
  }

  const putResult = await bucket.put(audioKey, c.req.raw.body, {
    httpMetadata: { contentType },
  });
  // Fail closed: only the size R2 reports for the stored object may be
  // recorded. A missing/zero size leaves an unverifiable object behind —
  // remove it and reject instead of trusting the client-declared header.
  const reportedSize = putResult?.size;
  if (!reportedSize || reportedSize <= 0) {
    await bucket.delete(audioKey).catch(() => {});
    return c.json({ error: "Storage write failed: unverifiable object size" }, 503);
  }
  const actualSizeBytes = reportedSize;

  const updated = await upsertAnswerRecording(db, {
    id: crypto.randomUUID(),
    attemptId,
    questionKey,
    questionText,
    partNumber,
    orderIndex,
    audioKey,
    durationMs,
    mimeType: contentType,
    generation,
    sizeBytes: actualSizeBytes,
  });

  if (updated.length === 0) {
    // Lost the race against a higher generation that landed mid-flight: the blob
    // this request put is now orphaned, and the stored row holds the real winner.
    const [winner] = await db
      .select({ generation: attemptAnswer.generation })
      .from(attemptAnswer)
      .where(and(eq(attemptAnswer.attemptId, attemptId), eq(attemptAnswer.questionKey, questionKey)))
      .limit(1);
    await bucket.delete(audioKey).catch(() => {});
    return c.json({ error: "stale_generation", storedGeneration: winner?.generation ?? 0 }, 409);
  }

  // This request won: drop every other blob of this question (previous
  // generations and pre-migration bare keys). The "<questionKey>." prefix cannot
  // match other questions' keys, and the winning key itself is kept. Listed, not
  // taken from the pre-read: between the pre-read and this upsert another higher
  // generation may have won and its blob must not be orphaned by us.
  try {
    const listed = await bucket.list({ prefix: `users/${session.user.id}/attempts/${attemptId}/${questionKey}.` });
    const staleKeys = listed.objects.map((obj) => obj.key).filter((key) => key !== updated[0]!.audioKey);
    await Promise.all(staleKeys.map((key) => bucket.delete(key).catch(() => {})));
  } catch {
    // Best-effort cleanup; erasure by prefix still reaches any missed blob.
  }

  return c.json({
    success: true,
    audioKey,
    attemptId,
    questionKey,
  });
});

app.get("/api/attempts/:attemptId/answers/:answerId/audio", async (c) => {
  const auth = await createAuth();
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.text("Unauthorized", 401);
  }

  const attemptId = c.req.param("attemptId");
  const answerId = c.req.param("answerId");
  const db = getDb();

  const [currentAttempt] = await db
    .select()
    .from(attempt)
    .where(eq(attempt.id, attemptId))
    .limit(1);

  if (!currentAttempt) {
    return c.text("Forbidden", 403);
  }

  let disputeShareConsent: boolean | null = null;
  if (currentAttempt.userId !== session.user.id) {
    const [disputeRecord] = await db
      .select({ shareConsent: scoreDispute.shareConsent })
      .from(scoreDispute)
      .where(eq(scoreDispute.attemptId, attemptId))
      .orderBy(desc(scoreDispute.createdAt))
      .limit(1);
    disputeShareConsent = disputeRecord ? Boolean(disputeRecord.shareConsent) : null;
  }

  const adminEmails = "ADMIN_EMAILS" in ENV ? (ENV.ADMIN_EMAILS as string) : undefined;
  const isAllowed = canAccessAudio({
    userId: session.user.id,
    userEmail: session.user.email,
    attemptOwnerId: currentAttempt.userId,
    adminEmails,
    disputeShareConsent,
  });

  if (!isAllowed) {
    return c.text("Forbidden", 403);
  }

  const [ans] = await db
    .select()
    .from(attemptAnswer)
    .where(
      and(
        eq(attemptAnswer.attemptId, attemptId),
        or(eq(attemptAnswer.id, answerId), eq(attemptAnswer.questionKey, answerId)),
      ),
    )
    .limit(1);

  if (!ans) {
    return c.text("Not found", 404);
  }

  if (!isValidAudioKey(ans.audioKey, currentAttempt.userId, attemptId)) {
    return c.text("Forbidden", 403);
  }

  const bucket = "AUDIO_BUCKET" in ENV ? (ENV.AUDIO_BUCKET as R2Bucket) : undefined;
  if (!bucket) {
    return c.text("Storage unavailable", 503);
  }

  const rangeHeader = c.req.header("range");
  const object = await bucket.get(ans.audioKey, {
    range: rangeHeader ? c.req.raw.headers : undefined,
  });

  const streamResult = resolveAudioStreamResponse({
    audioKey: ans.audioKey,
    mimeType: ans.mimeType,
    attemptOwnerId: currentAttempt.userId,
    attemptId,
    object,
  });

  if (streamResult.status === 403) {
    return c.text(streamResult.body, 403);
  }
  if (streamResult.status === 404) {
    return c.text(streamResult.body, 404);
  }

  for (const [k, v] of Object.entries(streamResult.headers)) {
    c.header(k, v);
  }
  return c.body(streamResult.body as any, streamResult.status);
});

app.get("/", (c) => {
  return c.text("OK");
});

export { app };
export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
  queue: handleScoringQueue,
};
