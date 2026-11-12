import { normalizeTtsText } from "./resolver";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";
export const DEFAULT_TTS_TIMEOUT_MS = 15_000;

export class TtsUnavailableError extends Error {
  readonly status?: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "TtsUnavailableError";
    this.status = options?.status;
  }
}

export type SynthesizeWithElevenLabsParams = {
  apiKey: string | undefined;
  voiceId: string;
  modelId: string;
  text: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function synthesizeWithElevenLabs({
  apiKey,
  voiceId,
  modelId,
  text,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TTS_TIMEOUT_MS,
}: SynthesizeWithElevenLabsParams): Promise<Uint8Array> {
  const trimmedKey = apiKey?.trim();
  if (!trimmedKey) {
    throw new TtsUnavailableError("TTS unavailable: ELEVENLABS_API_KEY is not configured");
  }

  const normalizedText = normalizeTtsText(text);
  if (!normalizedText) {
    throw new TtsUnavailableError("TTS unavailable: prompt text is empty");
  }

  const url = `${ELEVENLABS_BASE_URL}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "xi-api-key": trimmedKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: normalizedText,
        model_id: modelId,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof TtsUnavailableError) {
      throw err;
    }
    throw new TtsUnavailableError("ElevenLabs TTS network request failed", { cause: err });
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new TtsUnavailableError(`ElevenLabs TTS returned ${res.status}: ${detail}`, {
      status: res.status,
    });
  }

  let bytes: Uint8Array;
  try {
    const buffer = await res.arrayBuffer();
    bytes = new Uint8Array(buffer);
  } catch (err) {
    throw new TtsUnavailableError("Failed to read ElevenLabs TTS audio payload", { cause: err });
  }

  if (bytes.byteLength <= 0) {
    throw new TtsUnavailableError("ElevenLabs TTS returned an empty audio payload");
  }

  return bytes;
}
