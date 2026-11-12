import { synthesizeWithElevenLabs, TtsUnavailableError } from "./elevenlabs";
import { extractTopicSpokenTexts, normalizeTtsText } from "./resolver";
import {
  EXAMINER_VOICE_IDS,
  type ExaminerVoiceId,
  resolveElevenLabsApiKey,
  resolveElevenLabsModelId,
  resolveElevenLabsVoiceId,
} from "./voices";

export type TtsAudioBucketObject = {
  readonly body: unknown;
  readonly size: number;
};

export type TtsAudioBucket = {
  head?: (key: string) => Promise<{ readonly size: number } | null>;
  get: (key: string) => Promise<TtsAudioBucketObject | null>;
  put: (
    key: string,
    value: Uint8Array,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<{ readonly size?: number } | null | void>;
  delete: (key: string) => Promise<void>;
};

export type BuildTtsCacheKeyParams = {
  voice: ExaminerVoiceId;
  text: string;
  env?: Record<string, unknown>;
  providerVoiceId?: string;
  modelId?: string;
};

export type TtsCacheKeyInfo = {
  r2Key: string;
  etag: string;
  hashHex: string;
  normalizedText: string;
  providerVoiceId: string;
  modelId: string;
};

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

export async function buildTtsCacheKey({
  voice,
  text,
  env,
  providerVoiceId,
  modelId,
}: BuildTtsCacheKeyParams): Promise<TtsCacheKeyInfo> {
  const resolvedVoiceId = providerVoiceId ?? resolveElevenLabsVoiceId(voice, env);
  const resolvedModelId = modelId ?? resolveElevenLabsModelId(env);
  const normalizedText = normalizeTtsText(text);
  const hashHex = await sha256Hex(`${resolvedVoiceId}:${resolvedModelId}:${normalizedText}`);
  return {
    r2Key: `tts/v1/${voice}/${hashHex}.mp3`,
    etag: `"${hashHex}"`,
    hashHex,
    normalizedText,
    providerVoiceId: resolvedVoiceId,
    modelId: resolvedModelId,
  };
}

/** In-flight synthesis coalescing map keyed by content-addressed `r2Key`. */
const inflightSyntheses = new Map<string, Promise<Uint8Array>>();

export type GetOrCreateTtsAudioParams = {
  bucket: TtsAudioBucket;
  env?: Record<string, unknown>;
  voice: ExaminerVoiceId;
  text: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type GetOrCreateTtsAudioResult = {
  body: unknown;
  size: number;
  r2Key: string;
  etag: string;
  cacheHit: boolean;
};

export async function getOrCreateTtsAudio({
  bucket,
  env,
  voice,
  text,
  fetchImpl,
  timeoutMs,
}: GetOrCreateTtsAudioParams): Promise<GetOrCreateTtsAudioResult> {
  const { r2Key, etag, normalizedText, providerVoiceId, modelId } = await buildTtsCacheKey({
    voice,
    text,
    env,
  });

  if (!normalizedText) {
    throw new TtsUnavailableError("TTS unavailable: prompt text is empty");
  }

  const existing = await bucket.get(r2Key);
  if (existing && existing.size > 0) {
    return {
      body: existing.body,
      size: existing.size,
      r2Key,
      etag,
      cacheHit: true,
    };
  }

  let pending = inflightSyntheses.get(r2Key);
  if (!pending) {
    const task = (async () => {
      try {
        // Yield once so `inflightSyntheses.set(r2Key, task)` always runs before `finally`.
        await Promise.resolve();

        const apiKey = resolveElevenLabsApiKey(env);
        if (!apiKey) {
          throw new TtsUnavailableError("TTS unavailable: ELEVENLABS_API_KEY is not configured");
        }

        const bytes = await synthesizeWithElevenLabs({
          apiKey,
          voiceId: providerVoiceId,
          modelId,
          text: normalizedText,
          fetchImpl,
          timeoutMs,
        });

        const putResult = await bucket.put(r2Key, bytes, {
          httpMetadata: { contentType: "audio/mpeg" },
        });
        if (putResult && typeof putResult.size === "number" && putResult.size <= 0) {
          await bucket.delete(r2Key).catch(() => {});
          throw new TtsUnavailableError("TTS storage write failed: unverifiable object size");
        }

        return bytes;
      } finally {
        inflightSyntheses.delete(r2Key);
      }
    })();
    inflightSyntheses.set(r2Key, task);
    pending = task;
  }

  const bytes = await pending;
  return {
    body: bytes,
    size: bytes.byteLength,
    r2Key,
    etag,
    cacheHit: false,
  };
}

export type PrewarmTopicAudioParams = {
  topic: { title: string; part: number; questions: string | unknown };
  bucket: TtsAudioBucket | undefined;
  env?: Record<string, unknown>;
  concurrency?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type PrewarmTopicAudioResult = {
  attempted: number;
  succeeded: number;
  failed: number;
};

export async function prewarmTopicAudio({
  topic,
  bucket,
  env,
  concurrency = 2,
  fetchImpl,
  timeoutMs,
}: PrewarmTopicAudioParams): Promise<PrewarmTopicAudioResult> {
  try {
    const apiKey = resolveElevenLabsApiKey(env);
    if (!bucket || !apiKey) {
      return { attempted: 0, succeeded: 0, failed: 0 };
    }

    const texts = extractTopicSpokenTexts(topic);
    if (texts.length === 0) {
      return { attempted: 0, succeeded: 0, failed: 0 };
    }

    const jobs: Array<{ voice: ExaminerVoiceId; text: string }> = [];
    for (const voice of EXAMINER_VOICE_IDS) {
      for (const text of texts) {
        jobs.push({ voice, text });
      }
    }

    const workerCount = Math.max(1, Math.min(Math.floor(concurrency) || 2, jobs.length));
    let nextIndex = 0;
    let succeeded = 0;
    let failed = 0;

    const workers = Array.from({ length: workerCount }, async () => {
      while (nextIndex < jobs.length) {
        const idx = nextIndex++;
        const job = jobs[idx];
        if (!job) break;
        try {
          if (typeof bucket.head === "function") {
            const { r2Key } = await buildTtsCacheKey({ voice: job.voice, text: job.text, env });
            const headed = await bucket.head(r2Key);
            if (headed && headed.size > 0) {
              succeeded++;
              continue;
            }
          }
          const created = await getOrCreateTtsAudio({
            bucket,
            env,
            voice: job.voice,
            text: job.text,
            fetchImpl,
            timeoutMs,
          });
          if (created.cacheHit && created.body && typeof created.body === "object") {
            const maybeCancel = (created.body as { cancel?: () => Promise<unknown> }).cancel;
            if (typeof maybeCancel === "function") {
              await maybeCancel.call(created.body).catch(() => {});
            }
          }
          succeeded++;
        } catch (err) {
          failed++;
          const rawMsg = err instanceof Error ? err.message : String(err);
          console.warn(
            `[tts] Background pre-warm failed for voice=${job.voice}:`,
            rawMsg
              .replace(/(?:sk_|sk-|xi-)[A-Za-z0-9_-]{8,}/g, "[REDACTED_KEY]")
              .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]"),
          );
        }
      }
    });

    await Promise.all(workers);
    return {
      attempted: jobs.length,
      succeeded,
      failed,
    };
  } catch (err) {
    console.warn(
      "[tts] Background pre-warm aborted unexpectedly:",
      err instanceof Error ? err.message : err,
    );
    return { attempted: 0, succeeded: 0, failed: 0 };
  }
}
