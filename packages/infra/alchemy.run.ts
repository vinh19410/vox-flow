import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import "varlock/auto-load";

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
    // Empty pricing leaves cost_usd null.
    SCORING_PRICE_INPUT_PER_1M: Config.String("SCORING_PRICE_INPUT_PER_1M").pipe(Config.withDefault("")),
    SCORING_PRICE_OUTPUT_PER_1M: Config.String("SCORING_PRICE_OUTPUT_PER_1M").pipe(Config.withDefault("")),
    CORS_ORIGIN: Config.String("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    SEPAY_WEBHOOK_API_KEY: Config.Redacted("SEPAY_WEBHOOK_API_KEY"),
    ADMIN_EMAILS: Config.String("ADMIN_EMAILS").pipe(Config.withDefault("")),
    LAUNCH_OPEN: Config.String("LAUNCH_OPEN").pipe(Config.withDefault("false")),
    LAUNCH_ALLOWED_EMAILS: Config.String("LAUNCH_ALLOWED_EMAILS").pipe(Config.withDefault("")),
    OPENAI_API_KEY: Config.Redacted("OPENAI_API_KEY").pipe(Config.withDefault("")),
    SCORE_DISPUTE_ENABLED: Config.String("SCORE_DISPUTE_ENABLED").pipe(Config.withDefault("false")),
    GOOGLE_CLIENT_ID: Config.String("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: Config.Redacted("GOOGLE_CLIENT_SECRET"),
  },
  crons: ["0 * * * *"],
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
    // maxRetries must match SCORING_QUEUE_MAX_RETRIES in apps/server/src/queue.ts.
    yield* Cloudflare.Queues.Consumer("scoring-queue-consumer", {
      queueId: queue.queueId,
      scriptName: serverWorker.workerName,
      settings: {
        batchSize: 1,
        maxRetries: 3,
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
