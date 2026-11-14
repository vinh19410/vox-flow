/// <reference types="@cloudflare/workers-types" />
import type { Session } from "@vox-flow/auth";
import type { Database } from "@vox-flow/db";

import type { Entitlement } from "./entitlements";
import type { ScoringQueue } from "./scoring/queue";

export type ApiEnv = {
  AUDIO_BUCKET?: R2Bucket;
  ADMIN_EMAILS?: string;
  LAUNCH_OPEN?: string;
  LAUNCH_ALLOWED_EMAILS?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_MODEL_ID?: string;
  ELEVENLABS_VOICE_UK_F?: string;
  ELEVENLABS_VOICE_US_M?: string;
  ELEVENLABS_VOICE_AU_F?: string;
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
  SCORE_DISPUTE_ENABLED?: string;
  /** Cloudflare Queue feeding the scoring consumer; absent in tests and local runs without it. */
  SCORING_QUEUE?: ScoringQueue;
  SCORING_MODEL?: string;
  SCORING_RUNS?: string;
  SCORING_PRICE_INPUT_PER_1M?: string;
  SCORING_PRICE_OUTPUT_PER_1M?: string;
  FREE_DAILY_BUDGET_VND?: string;
  [key: string]: unknown;
};

export type Context = {
  session: Session | null;
  db: Database;
  env?: ApiEnv;
  /** Optional entitlement resolver override used in unit tests. */
  getEntitlement?: (db: Database, userId: string) => Promise<Entitlement>;
  /** Injectable clock (same shape as `score-attempt.ts`); tests pin time with it. */
  now?: () => Date;
  /** Cloudflare ExecutionContext.waitUntil hook for non-blocking background tasks. */
  waitUntil?: (promise: Promise<unknown>) => void;
};
