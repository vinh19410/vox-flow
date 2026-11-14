import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import "varlock/auto-load";

// Single source for the scoring queue's retry budget: applied to the consumer's
// settings.maxRetries and injected into the server worker env, where
// `readScoringQueueMaxRetries` (apps/server/src/queue.ts) decides the last
// delivery. Config.succeed makes the binding non-overridable from deploy env,
// so the two sides can never drift.
const SCORING_QUEUE_MAX_RETRIES = 3;
// Ceiling on concurrent scoring invocations. Unset, Cloudflare autoscales a
// push consumer to 250 parallel invocations; with batchSize 1 that is 250
// parallel grading pipelines against one OpenAI key (cost + rate limits).
// Invariant: pipeline duration depends on SCORING_RUNS (1-7; default 3 ≈ 10
// minutes — an unmeasured estimate from per-call timeouts, not a benchmark)
// and must stay under the 12-minute SCORING_LEASE_MS — runs > 3 can
// exceed the lease, letting the 5-minute sweep reap a live worker and
// duplicate the pipeline. Raising maxConcurrency only drains backlog faster;
// it does not fix the lease. Watch backlog before the 12-minute mark.
const SCORING_QUEUE_MAX_CONCURRENCY = 2;

export const db = Cloudflare.D1.Database("database", {
  migrations: "../../packages/db/src/migrations",
});

export const audioBucket = Cloudflare.R2.Bucket("audio-storage");

/** Forecast-practice scoring jobs; consumed by the server worker (see consumer below). */
export const scoringQueue = Cloudflare.Queues.Queue("scoring-queue");

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
  },
  env: {
    DB: db,
    AUDIO_BUCKET: audioBucket,
    SCORING_QUEUE: scoringQueue,
    SCORING_MODEL: Config.String("SCORING_MODEL").pipe(Config.withDefault("gpt-6-luna")),
    SCORING_RUNS: Config.String("SCORING_RUNS").pipe(Config.withDefault("3")),
    SCORING_QUEUE_MAX_RETRIES: Config.succeed(String(SCORING_QUEUE_MAX_RETRIES)),
    // Empty pricing leaves cost_usd null.
    SCORING_PRICE_INPUT_PER_1M: Config.String("SCORING_PRICE_INPUT_PER_1M").pipe(Config.withDefault("")),
    SCORING_PRICE_OUTPUT_PER_1M: Config.String("SCORING_PRICE_OUTPUT_PER_1M").pipe(Config.withDefault("")),
    FREE_DAILY_BUDGET_VND: Config.String("FREE_DAILY_BUDGET_VND").pipe(Config.withDefault("33000")),
    CORS_ORIGIN: Config.String("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    SEPAY_WEBHOOK_API_KEY: Config.Redacted("SEPAY_WEBHOOK_API_KEY"),
    ADMIN_EMAILS: Config.String("ADMIN_EMAILS").pipe(Config.withDefault("")),
    LAUNCH_OPEN: Config.String("LAUNCH_OPEN").pipe(Config.withDefault("false")),
    LAUNCH_ALLOWED_EMAILS: Config.String("LAUNCH_ALLOWED_EMAILS").pipe(Config.withDefault("")),
    OPENAI_API_KEY: Config.Redacted("OPENAI_API_KEY").pipe(Config.withDefault("")),
    ELEVENLABS_API_KEY: Config.Redacted("ELEVENLABS_API_KEY").pipe(Config.withDefault("")),
    ELEVENLABS_MODEL_ID: Config.String("ELEVENLABS_MODEL_ID").pipe(Config.withDefault("eleven_multilingual_v2")),
    ELEVENLABS_VOICE_UK_F: Config.String("ELEVENLABS_VOICE_UK_F").pipe(Config.withDefault("")),
    ELEVENLABS_VOICE_US_M: Config.String("ELEVENLABS_VOICE_US_M").pipe(Config.withDefault("")),
    ELEVENLABS_VOICE_AU_F: Config.String("ELEVENLABS_VOICE_AU_F").pipe(Config.withDefault("")),
    SCORE_DISPUTE_ENABLED: Config.String("SCORE_DISPUTE_ENABLED").pipe(Config.withDefault("false")),
    GOOGLE_CLIENT_ID: Config.String("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: Config.Redacted("GOOGLE_CLIENT_SECRET"),
  },
  // Hourly jobs, plus a 5-minute scoring sweep for lost queue messages.
  // Must match HOURLY_CRON / SCORING_SWEEP_CRON in apps/server/src/scheduled.ts.
  crons: ["0 * * * *", "*/5 * * * *"],
  domain: "api.vox.vinhtran.io.vn",
  dev: {
    port: 3000,
  },
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
  "vox-flow",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const serverWorker = yield* server;
    const queue = yield* scoringQueue;
    // The server worker's `queue` handler consumes scoring jobs one at a time.
    yield* Cloudflare.Queues.Consumer("scoring-queue-consumer", {
      queueId: queue.queueId,
      scriptName: serverWorker.workerName,
      settings: {
        batchSize: 1,
        maxRetries: SCORING_QUEUE_MAX_RETRIES,
        maxConcurrency: SCORING_QUEUE_MAX_CONCURRENCY,
        retryDelay: 30,
      },
    });
    const webWorker = yield* Cloudflare.Website.Vite("web", {
      rootDir: "../../apps/web",
      domain: "vox.vinhtran.io.vn",
      assets: {
        htmlHandling: "auto-trailing-slash",
        notFoundHandling: "single-page-application",
      },
      env: {
        VITE_SERVER_URL: serverWorker.url.as<string>(),
      },
      dev: {
        port: 3001,
      },
    });

    return {
      web: webWorker.url,
      server: serverWorker.url,
    };
  }),
);
