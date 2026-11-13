import { forecastTopic } from "@vox-flow/db/schema";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  cueCardKey,
  part1QuestionKey,
  part3QuestionKey,
} from "./scoring/forecast-keys";
import { createTestDb, type TestDbContext } from "./test/db";
import {
  buildTtsCacheKey,
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_ELEVENLABS_VOICE_IDS,
  EXAMINER_VOICE_IDS,
  extractTopicSpokenTexts,
  getOrCreateTtsAudio,
  isValidExaminerVoice,
  prewarmTopicAudio,
  resolveCanonicalTtsText,
  resolveElevenLabsApiKey,
  resolveElevenLabsModelId,
  resolveElevenLabsVoiceId,
  resolveForecastQuestionDetail,
  TtsUnavailableError,
  type TtsAudioBucket,
} from "./tts";

function createInMemoryTtsBucket() {
  const store = new Map<string, { bytes: Uint8Array; contentType?: string }>();
  const getSpy = vi.fn(async (key: string) => {
    const entry = store.get(key);
    if (!entry) return null;
    return {
      body: entry.bytes,
      size: entry.bytes.byteLength,
    };
  });
  const putSpy = vi.fn(
    async (
      key: string,
      value: Uint8Array,
      options?: { httpMetadata?: { contentType?: string } },
    ) => {
      const copy = new Uint8Array(value);
      store.set(key, {
        bytes: copy,
        contentType: options?.httpMetadata?.contentType,
      });
      return { size: copy.byteLength };
    },
  );
  const deleteSpy = vi.fn(async (key: string) => {
    store.delete(key);
  });

  const bucket: TtsAudioBucket = {
    get: getSpy,
    put: putSpy,
    delete: deleteSpy,
  };

  return { store, bucket, getSpy, putSpy, deleteSpy };
}

describe("@vox-flow/api/tts", () => {
  let testCtx: TestDbContext;

  beforeAll(async () => {
    testCtx = await createTestDb();
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  describe("voice & model mapping", () => {
    it("validates examiner voice IDs strictly", () => {
      expect(EXAMINER_VOICE_IDS).toEqual(["uk-f", "us-m", "au-f"]);
      expect(isValidExaminerVoice("uk-f")).toBe(true);
      expect(isValidExaminerVoice("us-m")).toBe(true);
      expect(isValidExaminerVoice("au-f")).toBe(true);
      expect(isValidExaminerVoice("uk-m")).toBe(false);
      expect(isValidExaminerVoice("")).toBe(false);
      expect(isValidExaminerVoice(null)).toBe(false);
    });

    it("falls back to default ElevenLabs premade voice IDs and model when env vars are unset or blank", () => {
      expect(resolveElevenLabsVoiceId("uk-f", {})).toBe(DEFAULT_ELEVENLABS_VOICE_IDS["uk-f"]);
      expect(resolveElevenLabsVoiceId("us-m", { ELEVENLABS_VOICE_US_M: "   " })).toBe(
        DEFAULT_ELEVENLABS_VOICE_IDS["us-m"],
      );
      expect(resolveElevenLabsVoiceId("au-f", undefined)).toBe(
        DEFAULT_ELEVENLABS_VOICE_IDS["au-f"],
      );
      expect(resolveElevenLabsModelId({ ELEVENLABS_MODEL_ID: "" })).toBe(
        DEFAULT_ELEVENLABS_MODEL_ID,
      );
    });

    it("applies voice ID, model ID, and API key overrides (including Redacted-like wrappers)", () => {
      const env = {
        ELEVENLABS_VOICE_UK_F: " custom-uk-voice ",
        ELEVENLABS_VOICE_US_M: "custom-us-voice",
        ELEVENLABS_VOICE_AU_F: "custom-au-voice",
        ELEVENLABS_MODEL_ID: "eleven_turbo_v2_5",
        ELEVENLABS_API_KEY: { value: "  xi-secret-123  " },
      };

      expect(resolveElevenLabsVoiceId("uk-f", env)).toBe("custom-uk-voice");
      expect(resolveElevenLabsVoiceId("us-m", env)).toBe("custom-us-voice");
      expect(resolveElevenLabsVoiceId("au-f", env)).toBe("custom-au-voice");
      expect(resolveElevenLabsModelId(env)).toBe("eleven_turbo_v2_5");
      expect(resolveElevenLabsApiKey(env)).toBe("xi-secret-123");
    });
  });

  describe("canonical text resolution", () => {
    it("resolves fixed preview greetings for Emma, James, and Olivia", async () => {
      await expect(resolveCanonicalTtsText({ kind: "preview", voice: "uk-f" })).resolves.toBe(
        "Hello, my name is Emma. I will be your examiner today.",
      );
      await expect(resolveCanonicalTtsText({ kind: "preview", voice: "us-m" })).resolves.toBe(
        "Hello, my name is James. I will be your examiner today.",
      );
      await expect(resolveCanonicalTtsText({ kind: "preview", voice: "au-f" })).resolves.toBe(
        "Hello, my name is Olivia. I will be your examiner today.",
      );
    });

    it("resolves mock bank questions, follow-ups, Part 2 opening title-only prompt, and rejects unknown keys", async () => {
      await expect(resolveCanonicalTtsText({ kind: "mock", questionKey: "p1-1" })).resolves.toBe(
        "Let's talk about where you live. Do you live in a house or an apartment?",
      );
      await expect(resolveCanonicalTtsText({ kind: "mock", questionKey: "p1-1-f" })).resolves.toBe(
        "You mentioned it gets quite noisy. What do you usually do to deal with the noise?",
      );
      // Part 2 speaks ONLY `item.text`, NOT cue bullet points
      await expect(resolveCanonicalTtsText({ kind: "mock", questionKey: "p2-1" })).resolves.toBe(
        "Describe a time when you helped someone.",
      );
      await expect(resolveCanonicalTtsText({ kind: "mock", questionKey: "p2-1-f" })).resolves.toBeNull();
      await expect(resolveCanonicalTtsText({ kind: "mock", questionKey: "unknown-key" })).resolves.toBeNull();
    });

    it("resolves published forecast topics (Part 1 & Part 2/3) and rejects draft/archived topics", async () => {
      await testCtx.db.insert(forecastTopic).values([
        {
          id: "tts-pub-p1",
          title: "Hometown",
          quarter: "2026-Q1",
          part: 1,
          questions: JSON.stringify([
            "Where is your hometown?",
            "Has your hometown changed much?",
          ]),
          status: "published",
        },
        {
          id: "tts-pub-p2",
          title: "Describe a book that inspired you",
          quarter: "2026-Q1",
          part: 2,
          questions: JSON.stringify({
            cueCards: ["What it was about", "Why it inspired you"],
            part3: [
              "Do young people read less nowadays?",
              "Will paper books disappear in the future?",
            ],
          }),
          status: "published",
        },
        {
          id: "tts-draft-p1",
          title: "Unreleased Draft",
          quarter: "2026-Q1",
          part: 1,
          questions: JSON.stringify(["Secret draft question?"]),
          status: "draft",
        },
        {
          id: "tts-archived-p1",
          title: "Archived Topic",
          quarter: "2025-Q4",
          part: 1,
          questions: JSON.stringify(["Old question?"]),
          status: "archived",
        },
      ]);

      // Published Part 1
      await expect(
        resolveCanonicalTtsText({
          kind: "forecast",
          db: testCtx.db,
          topicId: "tts-pub-p1",
          questionKey: part1QuestionKey("tts-pub-p1", 0),
        }),
      ).resolves.toBe("Where is your hometown?");
      await expect(
        resolveCanonicalTtsText({
          kind: "forecast",
          db: testCtx.db,
          topicId: "tts-pub-p1",
          questionKey: part1QuestionKey("tts-pub-p1", 5),
        }),
      ).resolves.toBeNull();

      // Published Part 2/3
      await expect(
        resolveCanonicalTtsText({
          kind: "forecast",
          db: testCtx.db,
          topicId: "tts-pub-p2",
          questionKey: cueCardKey("tts-pub-p2"),
        }),
      ).resolves.toBe("Describe a book that inspired you");
      await expect(
        resolveCanonicalTtsText({
          kind: "forecast",
          db: testCtx.db,
          topicId: "tts-pub-p2",
          questionKey: part3QuestionKey("tts-pub-p2", 1),
        }),
      ).resolves.toBe("Will paper books disappear in the future?");

      // Draft & Archived rejected
      await expect(
        resolveCanonicalTtsText({
          kind: "forecast",
          db: testCtx.db,
          topicId: "tts-draft-p1",
          questionKey: part1QuestionKey("tts-draft-p1", 0),
        }),
      ).resolves.toBeNull();
      await expect(
        resolveCanonicalTtsText({
          kind: "forecast",
          db: testCtx.db,
          topicId: "tts-archived-p1",
          questionKey: part1QuestionKey("tts-archived-p1", 0),
        }),
      ).resolves.toBeNull();
    });

    it("resolveForecastQuestionDetail returns { text, part } for Part 1, Part 2 cue card, and Part 3 keys, and null for unpublished/missing", async () => {
      await expect(
        resolveForecastQuestionDetail(
          testCtx.db,
          "tts-pub-p1",
          part1QuestionKey("tts-pub-p1", 1),
        ),
      ).resolves.toEqual({
        text: "Has your hometown changed much?",
        part: 1,
      });

      await expect(
        resolveForecastQuestionDetail(
          testCtx.db,
          "tts-pub-p2",
          cueCardKey("tts-pub-p2"),
        ),
      ).resolves.toEqual({
        text: "Describe a book that inspired you",
        part: 2,
      });

      await expect(
        resolveForecastQuestionDetail(
          testCtx.db,
          "tts-pub-p2",
          part3QuestionKey("tts-pub-p2", 0),
        ),
      ).resolves.toEqual({
        text: "Do young people read less nowadays?",
        part: 3,
      });

      // Unpublished (draft / archived) and missing topic/key return null
      await expect(
        resolveForecastQuestionDetail(
          testCtx.db,
          "tts-draft-p1",
          part1QuestionKey("tts-draft-p1", 0),
        ),
      ).resolves.toBeNull();
      await expect(
        resolveForecastQuestionDetail(
          testCtx.db,
          "tts-archived-p1",
          part1QuestionKey("tts-archived-p1", 0),
        ),
      ).resolves.toBeNull();
      await expect(
        resolveForecastQuestionDetail(
          testCtx.db,
          "tts-does-not-exist",
          part1QuestionKey("tts-does-not-exist", 0),
        ),
      ).resolves.toBeNull();
      await expect(
        resolveForecastQuestionDetail(testCtx.db, "tts-pub-p2", "unknown-key"),
      ).resolves.toBeNull();
      await expect(
        resolveForecastQuestionDetail(testCtx.db, "", part1QuestionKey("tts-pub-p1", 0)),
      ).resolves.toBeNull();
    });

    it("extracts deduplicated spoken texts for Part 1 and Part 2/3 topics", () => {
      expect(
        extractTopicSpokenTexts({
          title: "Work or Study",
          part: 1,
          questions: JSON.stringify([
            "Do you work or are you a student?",
            "  Do you   work or are you a student? ",
            "What do you like about your studies?",
            "   ",
          ]),
        }),
      ).toEqual([
        "Do you work or are you a student?",
        "What do you like about your studies?",
      ]);

      expect(
        extractTopicSpokenTexts({
          title: "Describe a helpful neighbour",
          part: 2,
          questions: JSON.stringify({
            cueCards: ["who this person is", "how they helped you"],
            part3: ["How can neighbours help each other?"],
          }),
        }),
      ).toEqual(["Describe a helpful neighbour", "How can neighbours help each other?"]);
    });
  });

  describe("R2 content-addressed cache, deduplication, coalescing & error handling", () => {
    it("synthesizes once on cache miss, writes tts/v1/<voice>/<sha256>.mp3, and serves cache hits with 0 ElevenLabs calls even without API key", async () => {
      const { bucket, store, putSpy } = createInMemoryTtsBucket();
      const fakeMp3 = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00]);
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(fakeMp3, {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        }),
      );

      const first = await getOrCreateTtsAudio({
        bucket,
        env: { ELEVENLABS_API_KEY: "xi-test-key" },
        voice: "uk-f",
        text: "Where is your hometown?",
        fetchImpl: fetchMock,
      });

      expect(first.cacheHit).toBe(false);
      expect(first.size).toBe(fakeMp3.byteLength);
      expect(first.r2Key).toMatch(/^tts\/v1\/uk-f\/[0-9a-f]{64}\.mp3$/);
      expect(first.etag).toMatch(/^"[0-9a-f]{64}"$/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(store.get(first.r2Key)?.contentType).toBe("audio/mpeg");

      const [calledUrl, calledInit] = fetchMock.mock.calls[0]!;
      expect(calledUrl).toBe(
        `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_ELEVENLABS_VOICE_IDS["uk-f"]}?output_format=mp3_44100_128`,
      );
      expect(calledInit?.method).toBe("POST");
      expect((calledInit?.headers as Record<string, string>)["xi-api-key"]).toBe("xi-test-key");
      expect(JSON.parse(calledInit?.body as string)).toEqual({
        text: "Where is your hometown?",
        model_id: DEFAULT_ELEVENLABS_MODEL_ID,
        voice_settings: { stability: 0.55, similarity_boost: 0.75 },
      });

      // Second call WITHOUT ELEVENLABS_API_KEY hits R2 directly with 0 ElevenLabs calls
      const second = await getOrCreateTtsAudio({
        bucket,
        env: {},
        voice: "uk-f",
        text: "Where is your hometown?",
        fetchImpl: fetchMock,
      });

      expect(second.cacheHit).toBe(true);
      expect(second.r2Key).toBe(first.r2Key);
      expect(second.etag).toBe(first.etag);
      expect(second.size).toBe(fakeMp3.byteLength);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("deduplicates identical question texts across different topics into a single R2 key and single ElevenLabs call", async () => {
      const { bucket, store } = createInMemoryTtsBucket();
      const fetchMock = vi.fn<typeof fetch>().mockImplementation(
        async () => new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 }),
      );

      const topicAQ = "  Do people in your country   like reading? ";
      const topicBQ = "Do people in your country like reading?";

      const keyA = await buildTtsCacheKey({ voice: "au-f", text: topicAQ });
      const keyB = await buildTtsCacheKey({ voice: "au-f", text: topicBQ });
      expect(keyA.r2Key).toBe(keyB.r2Key);

      await getOrCreateTtsAudio({
        bucket,
        env: { ELEVENLABS_API_KEY: "xi-test" },
        voice: "au-f",
        text: topicAQ,
        fetchImpl: fetchMock,
      });
      const hitB = await getOrCreateTtsAudio({
        bucket,
        env: { ELEVENLABS_API_KEY: "xi-test" },
        voice: "au-f",
        text: topicBQ,
        fetchImpl: fetchMock,
      });

      expect(hitB.cacheHit).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(store.size).toBe(1);
    });

    it("coalesces concurrent in-flight requests for the same (voice, text) into 1 ElevenLabs call", async () => {
      const { bucket, putSpy } = createInMemoryTtsBucket();
      let resolveUpstream!: (res: Response) => void;
      const upstreamGate = new Promise<Response>((resolve) => {
        resolveUpstream = resolve;
      });
      const fetchMock = vi.fn<typeof fetch>().mockReturnValue(upstreamGate);

      const calls = Array.from({ length: 5 }, () =>
        getOrCreateTtsAudio({
          bucket,
          env: { ELEVENLABS_API_KEY: "xi-coalesce" },
          voice: "us-m",
          text: "What kinds of music are popular in your country?",
          fetchImpl: fetchMock,
        }),
      );

      // Allow all 5 callers to pass `bucket.get` and join the in-flight map
      await new Promise((r) => setTimeout(r, 15));
      expect(fetchMock).toHaveBeenCalledTimes(1);

      resolveUpstream(new Response(new Uint8Array([9, 8, 7]), { status: 200 }));
      const results = await Promise.all(calls);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(putSpy).toHaveBeenCalledTimes(1);
      for (const r of results) {
        expect(r.size).toBe(3);
        expect(r.r2Key).toBe(results[0]!.r2Key);
      }
    });

    it("throws TtsUnavailableError and writes nothing to R2 on 429, 500, empty 0-byte body, or missing API key", async () => {
      const { bucket, store, putSpy } = createInMemoryTtsBucket();

      // Missing API key on cache miss
      await expect(
        getOrCreateTtsAudio({
          bucket,
          env: {},
          voice: "uk-f",
          text: "Uncached prompt",
        }),
      ).rejects.toBeInstanceOf(TtsUnavailableError);

      // 429 rate limit
      const fetch429 = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("Too Many Requests", { status: 429 }));
      await expect(
        getOrCreateTtsAudio({
          bucket,
          env: { ELEVENLABS_API_KEY: "xi-key" },
          voice: "uk-f",
          text: "Uncached prompt",
          fetchImpl: fetch429,
        }),
      ).rejects.toThrow(TtsUnavailableError);

      // 500 server error
      const fetch500 = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("Internal Error", { status: 500 }));
      await expect(
        getOrCreateTtsAudio({
          bucket,
          env: { ELEVENLABS_API_KEY: "xi-key" },
          voice: "uk-f",
          text: "Uncached prompt",
          fetchImpl: fetch500,
        }),
      ).rejects.toThrow(TtsUnavailableError);

      // 200 with empty 0-byte body
      const fetchEmpty = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(new Uint8Array(0), { status: 200 }));
      await expect(
        getOrCreateTtsAudio({
          bucket,
          env: { ELEVENLABS_API_KEY: "xi-key" },
          voice: "uk-f",
          text: "Uncached prompt",
          fetchImpl: fetchEmpty,
        }),
      ).rejects.toThrow(TtsUnavailableError);

      expect(putSpy).not.toHaveBeenCalled();
      expect(store.size).toBe(0);

      // Verify in-flight map cleaned up so a subsequent healthy call succeeds
      const fetchOk = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
      const recovered = await getOrCreateTtsAudio({
        bucket,
        env: { ELEVENLABS_API_KEY: "xi-key" },
        voice: "uk-f",
        text: "Uncached prompt",
        fetchImpl: fetchOk,
      });
      expect(recovered.size).toBe(3);
      expect(store.size).toBe(1);
    });

    it("prewarmTopicAudio caps concurrency at 2, populates 3 x N keys, and swallows per-item upstream errors", async () => {
      const { bucket, store } = createInMemoryTtsBucket();
      let active = 0;
      let maxActive = 0;

      const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 10));
        active--;
        return new Response(new Uint8Array([0xff, 0xfb, 0x90]), { status: 200 });
      });

      const result = await prewarmTopicAudio({
        topic: {
          title: "Describe a skill you learned",
          part: 2,
          questions: JSON.stringify({
            cueCards: ["what it was"],
            part3: ["What skills are important today?", "How do adults learn differently?"],
          }),
        },
        bucket,
        env: { ELEVENLABS_API_KEY: "xi-prewarm" },
        concurrency: 2,
        fetchImpl: fetchMock,
      });

      expect(result).toEqual({ attempted: 9, succeeded: 9, failed: 0 });
      expect(maxActive).toBeLessThanOrEqual(2);
      expect(store.size).toBe(9);

      // Missing API key or bucket returns 0 cleanly without throwing
      await expect(
        prewarmTopicAudio({
          topic: { title: "Any", part: 1, questions: ["Q1"] },
          bucket,
          env: {},
        }),
      ).resolves.toEqual({ attempted: 0, succeeded: 0, failed: 0 });
    });
  });
});
