/// <reference types="@cloudflare/workers-types" />
import type { Session } from "@vox-flow/auth";
import type { Database } from "@vox-flow/db";

import type { ScoringQueue } from "./scoring/queue";

export type ApiEnv = {
  AUDIO_BUCKET?: R2Bucket;
  ADMIN_EMAILS?: string;
  LAUNCH_OPEN?: string;
  LAUNCH_ALLOWED_EMAILS?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
  SCORE_DISPUTE_ENABLED?: string;
  /** Cloudflare Queue feeding the scoring consumer; absent in tests and local runs without it. */
  SCORING_QUEUE?: ScoringQueue;
  SCORING_MODEL?: string;
  SCORING_RUNS?: string;
  SCORING_PRICE_INPUT_PER_1M?: string;
  SCORING_PRICE_OUTPUT_PER_1M?: string;
  [key: string]: unknown;
};

export type Context = {
  session: Session | null;
  db: Database;
  env?: ApiEnv;
  /** Injectable clock (same shape as `score-attempt.ts`); tests pin time with it. */
  now?: () => Date;
};
