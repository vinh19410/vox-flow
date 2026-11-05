import { trpcServer } from "@hono/trpc-server";
import { and, attempt, attemptAnswer, eq, or } from "@vox-flow/db";
import { appRouter } from "@vox-flow/api/routers/index";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";
import { ENV } from "./env.server";
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
  const rawContentType = (c.req.header("content-type") ?? "audio/webm").split(";")[0]?.trim().toLowerCase() ?? "audio/webm";
  const allowedTypes = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"];
  const contentType = allowedTypes.includes(rawContentType) ? rawContentType : "audio/webm";
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

  const ext = contentType.includes("mp4") ? "mp4" : "webm";
  const audioKey = `users/${session.user.id}/attempts/${attemptId}/${questionKey}.${ext}`;

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

  if (!currentAttempt || currentAttempt.userId !== session.user.id) {
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

  const bucket = "AUDIO_BUCKET" in ENV ? (ENV.AUDIO_BUCKET as R2Bucket) : undefined;
  if (!bucket) {
    return c.text("Storage unavailable", 503);
  }

  const rangeHeader = c.req.header("range");
  const object = await bucket.get(ans.audioKey, {
    range: rangeHeader ? c.req.raw.headers : undefined,
  });
  if (!object) {
    return c.text("Audio not found", 404);
  }

  c.header("Content-Type", ans.mimeType || "audio/webm");
  c.header("Accept-Ranges", "bytes");
  if (object.range && "offset" in object.range && "length" in object.range) {
    const range = object.range as { offset: number; length: number };
    c.header("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
    return c.body(object.body, 206);
  }
  c.header("Content-Disposition", "inline");
  return c.body(object.body);
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
