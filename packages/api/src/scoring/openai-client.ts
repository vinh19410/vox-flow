import { TranscriptionApiError, transcribeAudioStrict } from "../exam/transcribe";

const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

/** Non-OK HTTP response from the OpenAI API; `status` drives retry/fallback decisions. */
export class OpenAIRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OpenAIRequestError";
    this.status = status;
  }
}

export type ChatCompletionResult = {
  content: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

/**
 * The slice of OpenAI the scoring pipeline needs. `chatCompletion` takes an
 * already-serialised request body so identical runs can share one (possibly
 * multi-megabyte, audio-bearing) string instead of re-encoding it per run.
 */
export type ScoringOpenAIClient = {
  transcribe(input: { audio: ArrayBuffer; mimeType: string }): Promise<string>;
  chatCompletion(requestBody: string): Promise<ChatCompletionResult>;
};

export type CreateOpenAIScoringClientOptions = {
  apiKey: string | undefined;
  fetchImpl?: typeof fetch;
  chatTimeoutMs?: number;
  transcribeTimeoutMs?: number;
};

export function createOpenAIScoringClient(
  options: CreateOpenAIScoringClientOptions,
): ScoringOpenAIClient {
  const { apiKey, fetchImpl = fetch, chatTimeoutMs = 180_000, transcribeTimeoutMs = 60_000 } =
    options;

  function requireKey(): string {
    if (!apiKey) {
      throw new Error("Scoring unavailable: OPENAI_API_KEY is not configured");
    }
    return apiKey;
  }

  return {
    async transcribe({ audio, mimeType }) {
      try {
        return await transcribeAudioStrict({
          audioBuffer: audio,
          mimeType,
          apiKey: requireKey(),
          timeoutMs: transcribeTimeoutMs,
          fetchImpl,
        });
      } catch (error) {
        // Surface Whisper HTTP failures with their status, like chat completions.
        if (error instanceof TranscriptionApiError) {
          throw new OpenAIRequestError(error.status, error.message);
        }
        throw error;
      }
    },

    async chatCompletion(requestBody) {
      const key = requireKey();
      const res = await fetchImpl(CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: requestBody,
        signal: AbortSignal.timeout(chatTimeoutMs),
      });

      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 500);
        throw new OpenAIRequestError(
          res.status,
          `OpenAI chat completion returned ${res.status}: ${detail}`,
        );
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
        usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
      };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        throw new Error("OpenAI chat completion returned an empty message");
      }
      return {
        content,
        inputTokens: typeof data.usage?.prompt_tokens === "number" ? data.usage.prompt_tokens : null,
        outputTokens:
          typeof data.usage?.completion_tokens === "number" ? data.usage.completion_tokens : null,
      };
    },
  };
}
