import { trpcServer } from "@hono/trpc-server";
import { and, attempt, attemptAnswer, desc, eq, or, scoreDispute } from "@vox-flow/db";
import {
  canAccessAudio,
  buildAudioKey,
  isValidAudioKey,
  normalizeMimeType,
  resolveAudioStreamResponse,
  type AllowedAudioMimeType,
} from "@vox-flow/api";
import { appRouter } from "@vox-flow/api/routers/index";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { handleScheduled } from "./scheduled";
import { createAuth, getDb } from "./services";
const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
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

  // Enforce 10MB payload size limit
  const contentLengthHeader = c.req.header("content-length");
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > 10 * 1024 * 1024) {
      return c.json({ error: "Payload too large (max 10MB)" }, 413);
    }
  }

  const rawPart = parseInt(c.req.query("part") ?? "1", 10);
  const partNumber = Number.isFinite(rawPart) ? rawPart : 1;
  const rawOrder = parseInt(c.req.query("order") ?? "0", 10);
  const orderIndex = Number.isFinite(rawOrder) ? rawOrder : 0;
  const rawDuration = parseInt(c.req.query("durationMs") ?? "0", 10);
  const durationMs = Number.isFinite(rawDuration) ? rawDuration : 0;
  const questionText = c.req.query("questionText") ?? "";
  const rawContentType = c.req.header("content-type");
  let contentType: AllowedAudioMimeType = "audio/webm";
  if (rawContentType) {
    const normalized = normalizeMimeType(rawContentType);
    if (!normalized) {
      return c.json({ error: "Unsupported media type" }, 415);
    }
    contentType = normalized;
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

  const audioKey = buildAudioKey(session.user.id, attemptId, questionKey, contentType);

  const bucket = "AUDIO_BUCKET" in ENV ? (ENV.AUDIO_BUCKET as R2Bucket) : undefined;
  if (!bucket) {
    return c.json({ error: "Storage unavailable" }, 503);
  }

  if (c.req.raw.body) {
    await bucket.put(audioKey, c.req.raw.body, {
      httpMetadata: { contentType },
    });
  }

  await db
    .insert(attemptAnswer)
    .values({
      id: crypto.randomUUID(),
      attemptId,
      questionKey,
      questionText,
      partNumber,
      orderIndex,
      audioKey,
      durationMs,
      mimeType: contentType,
    })
    .onConflictDoUpdate({
      target: [attemptAnswer.attemptId, attemptAnswer.questionKey],
      set: {
        questionText,
        partNumber,
        orderIndex,
        audioKey,
        durationMs,
        mimeType: contentType,
      },
    });

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

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
