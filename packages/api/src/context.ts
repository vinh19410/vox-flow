/// <reference types="@cloudflare/workers-types" />
import type { Session } from "@vox-flow/auth";
import type { Database } from "@vox-flow/db";

export type ApiEnv = {
  AUDIO_BUCKET?: R2Bucket;
  ADMIN_EMAILS?: string;
  LAUNCH_OPEN?: string;
  LAUNCH_ALLOWED_EMAILS?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
  [key: string]: unknown;
};

export type Context = {
  session: Session | null;
  db: Database;
  env?: ApiEnv;
};
