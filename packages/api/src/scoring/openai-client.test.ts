import { describe, expect, it, vi } from "vitest";

import { transcribeAudio, transcribeAudioStrict } from "../exam/transcribe";
import { createOpenAIScoringClient, OpenAIRequestError } from "./openai-client";
import { isAudioRejection } from "./score-attempt";

const audio = new Uint8Array([1, 2, 3]).buffer;

describe("transcribeAudioStrict", () => {
  it("throws instead of returning fake text when the API key is missing", async () => {
    await expect(transcribeAudioStrict({ audioBuffer: audio, mimeType: "audio/webm", apiKey: "" })).rejects.toThrow(
      "OPENAI_API_KEY",
    );
    // The lenient variant used by the exam flow keeps its behaviour.
    await expect(transcribeAudio({ audioBuffer: audio, mimeType: "audio/webm" })).resolves.toMatchObject({
      text: expect.any(String),
    });
  });

  it("throws on a non-OK response", async () => {
    const fetchImpl = vi.fn(async () => new Response("bad file", { status: 400 }));
    await expect(
      transcribeAudioStrict({ audioBuffer: audio, mimeType: "audio/ogg", apiKey: "k", fetchImpl }),
    ).rejects.toThrow("Transcription API returned 400");
  });

  it("uploads with the extension of the real audio type and returns the text", async () => {
    let filename: string | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const file = (init!.body as FormData).get("file") as File;
      filename = file.name;
      return Response.json({ text: "  hello there " });
    });
    await expect(
      transcribeAudioStrict({ audioBuffer: audio, mimeType: "audio/mpeg", apiKey: "k", fetchImpl }),
    ).resolves.toBe("hello there");
    expect(filename).toBe("audio.mp3");
  });
});

describe("createOpenAIScoringClient", () => {
  it("returns content and token usage", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        choices: [{ message: { content: "{\"ok\":true}" } }],
        usage: { prompt_tokens: 12, completion_tokens: 3 },
      }),
    );
    const client = createOpenAIScoringClient({ apiKey: "k", fetchImpl });
    await expect(client.chatCompletion("{}")).resolves.toEqual({
      content: "{\"ok\":true}",
      inputTokens: 12,
      outputTokens: 3,
    });
  });

  it("raises OpenAIRequestError with the status on non-OK responses", async () => {
    const fetchImpl = vi.fn(async () => new Response("Invalid value for input_audio.format", { status: 400 }));
    const client = createOpenAIScoringClient({ apiKey: "k", fetchImpl });
    const error = await client.chatCompletion("{}").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(OpenAIRequestError);
    expect((error as OpenAIRequestError).status).toBe(400);
    expect(isAudioRejection(error)).toBe(true);
  });

  it("refuses to call the API without a key", async () => {
    const fetchImpl = vi.fn();
    const client = createOpenAIScoringClient({ apiKey: undefined, fetchImpl });
    await expect(client.chatCompletion("{}")).rejects.toThrow("OPENAI_API_KEY");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("isAudioRejection", () => {
  it("only matches client errors about audio/format or oversized payloads", () => {
    expect(isAudioRejection(new OpenAIRequestError(400, "This model does not support audio input"))).toBe(true);
    expect(isAudioRejection(new OpenAIRequestError(413, "Request too large"))).toBe(true);
    expect(isAudioRejection(new OpenAIRequestError(401, "Incorrect API key"))).toBe(false);
    expect(isAudioRejection(new OpenAIRequestError(500, "audio pipeline crashed"))).toBe(false);
    expect(isAudioRejection(new Error("audio"))).toBe(false);
  });
});
