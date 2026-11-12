export const EXAMINER_VOICE_IDS = ["uk-f", "us-m", "au-f"] as const;

export type ExaminerVoiceId = (typeof EXAMINER_VOICE_IDS)[number];

export const DEFAULT_ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

export const DEFAULT_ELEVENLABS_VOICE_IDS: Record<ExaminerVoiceId, string> = {
  "uk-f": "Xb7hH8MSUJpSbSDYk0k2",
  "us-m": "cjVigY5qzO86Huf0OWal",
  "au-f": "XrExE9yKIg1WjnnlVkGX",
};

const VOICE_ENV_KEYS: Record<ExaminerVoiceId, string> = {
  "uk-f": "ELEVENLABS_VOICE_UK_F",
  "us-m": "ELEVENLABS_VOICE_US_M",
  "au-f": "ELEVENLABS_VOICE_AU_F",
};

export const PREVIEW_TEXTS: Record<ExaminerVoiceId, string> = {
  "uk-f": "Hello, my name is Emma. I will be your examiner today.",
  "us-m": "Hello, my name is James. I will be your examiner today.",
  "au-f": "Hello, my name is Olivia. I will be your examiner today.",
};

export function isValidExaminerVoice(value: unknown): value is ExaminerVoiceId {
  return typeof value === "string" && (EXAMINER_VOICE_IDS as readonly string[]).includes(value);
}

/**
 * Safely reads a non-empty trimmed string from `env`, supporting plain strings
 * as well as Redacted-like `{ value: string }` wrappers.
 */
export function readEnvString(
  env: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  if (!env || typeof env !== "object") {
    return undefined;
  }
  const raw = env[key];
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (raw && typeof raw === "object" && "value" in raw) {
    const inner = (raw as { value?: unknown }).value;
    if (typeof inner === "string") {
      const trimmed = inner.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
  }
  return undefined;
}

export function resolveElevenLabsVoiceId(
  voice: ExaminerVoiceId,
  env?: Record<string, unknown>,
): string {
  return readEnvString(env, VOICE_ENV_KEYS[voice]) ?? DEFAULT_ELEVENLABS_VOICE_IDS[voice];
}

export function resolveElevenLabsModelId(env?: Record<string, unknown>): string {
  return readEnvString(env, "ELEVENLABS_MODEL_ID") ?? DEFAULT_ELEVENLABS_MODEL_ID;
}

export function resolveElevenLabsApiKey(env?: Record<string, unknown>): string | undefined {
  return readEnvString(env, "ELEVENLABS_API_KEY");
}
