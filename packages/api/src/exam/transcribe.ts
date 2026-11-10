import { getAudioExtension, normalizeMimeType } from "../audio";

export type TranscribeOptions = {
  audioBuffer: ArrayBuffer | Uint8Array;
  mimeType: string;
  apiKey?: string;
};

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

export type TranscribeStrictOptions = {
  audioBuffer: ArrayBuffer | Uint8Array;
  mimeType: string;
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/**
 * Whisper transcription that never invents text: a missing key, network error
 * or non-OK response throws. Used where a transcript is graded, so fake or
 * empty-on-error text would silently corrupt a score.
 */
export async function transcribeAudioStrict(options: TranscribeStrictOptions): Promise<string> {
  const { audioBuffer, mimeType, apiKey, timeoutMs = 60_000, fetchImpl = fetch } = options;
  if (!apiKey) {
    throw new Error("Transcription unavailable: OPENAI_API_KEY is not configured");
  }

  const normalized = normalizeMimeType(mimeType);
  if (!normalized) {
    throw new Error(`Transcription unavailable: unsupported audio type "${mimeType}"`);
  }

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([audioBuffer], { type: normalized }),
    `audio.${getAudioExtension(normalized)}`,
  );
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  const res = await fetchImpl(WHISPER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Transcription API returned ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as { text?: unknown };
  if (typeof data.text !== "string") {
    throw new Error("Transcription API returned no text field");
  }
  return data.text.trim();
}

export async function transcribeAudio(options: TranscribeOptions): Promise<{ text: string }> {
  const { audioBuffer, mimeType, apiKey } = options;

  if (!apiKey) {
    return {
      text: "I live in an apartment in the city center. It is convenient and close to work, but quite noisy at night.",
    };
  }

  try {
    const filename = mimeType.includes("mp4") ? "audio.mp4" : "audio.webm";
    const blob = new Blob([audioBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("Transcription API non-OK:", res.status, err);
      return { text: "" };
    }

    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "" };
  } catch (err) {
    console.warn("Transcription failed:", err);
    return { text: "" };
  }
}
