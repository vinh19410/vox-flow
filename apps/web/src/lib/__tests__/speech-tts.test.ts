import { act } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    attempt: {
      getActive: { query: () => Promise.resolve(null) },
      start: { mutate: () => Promise.reject(new Error("offline")) },
      submit: { mutate: () => Promise.resolve({ success: true }) },
    },
  },
}));

import { useExamSession, type ExamSessionValue } from "@/features/exam/use-exam-session";
import { renderWithApp } from "@/test/harness";
import { ENV } from "../../env.public";
import { cancelSpeech, clearSpeechPrefetchCache, prefetchSpeech, speakText } from "../speech";
import {
  buildAttemptTtsUrl,
  buildForecastTtsUrl,
  buildMockTtsUrl,
  buildPreviewTtsUrl,
  shortTextFingerprint,
} from "../tts-url";

interface MockAudioInstance {
  src: string;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
}

function createMp3Response(bytes = [0xff, 0xfb, 0x90, 0x64]): Response {
  const payload = new Uint8Array(bytes);
  // Node 22 undici Response rejects jsdom's Blob in its constructor (lacks .stream())
  // and returns node:buffer.Blob from .blob(), which fails `instanceof Blob` against jsdom's Blob.
  const res = new Response(payload, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg" },
  });
  res.blob = async () => {
    await res.arrayBuffer();
    return new Blob([payload], { type: "audio/mpeg" });
  };
  return res;
}

describe("tts-url builders", () => {
  const originalServerUrl = ENV.VITE_SERVER_URL;

  afterEach(() => {
    ENV.VITE_SERVER_URL = originalServerUrl;
  });

  it("builds canonical preview, mock, forecast, and attempt URLs with encoded segments and trimmed base URL", () => {
    ENV.VITE_SERVER_URL = "https://api.voxflow.test///";

    expect(buildPreviewTtsUrl("uk-f")).toBe("https://api.voxflow.test/api/tts/preview/uk-f");
    expect(buildMockTtsUrl("us-m", "p1-1")).toBe("https://api.voxflow.test/api/tts/mock/us-m/p1-1");
    expect(buildForecastTtsUrl("au-f", "topic/a b", "q:0")).toBe(
      "https://api.voxflow.test/api/tts/forecast/au-f/topic%2Fa%20b/q%3A0",
    );
    expect(buildAttemptTtsUrl("att/1 2", "uk-f", "q:0")).toBe(
      "https://api.voxflow.test/api/tts/attempt/att%2F1%202/uk-f/q%3A0",
    );
  });

  it("appends deterministic ?v= fingerprint for question text and updates when wording changes", () => {
    ENV.VITE_SERVER_URL = "http://localhost:3000";

    const v1 = shortTextFingerprint("Where is your hometown?");
    const v1Normalized = shortTextFingerprint("  Where   is\nyour hometown? ");
    const v2 = shortTextFingerprint("How has your hometown changed recently?");

    expect(v1).toMatch(/^[0-9a-f]{8}$/);
    expect(v1Normalized).toBe(v1);
    expect(v2).not.toBe(v1);

    expect(buildMockTtsUrl("uk-f", "p1-1", "Where is your hometown?")).toBe(
      `http://localhost:3000/api/tts/mock/uk-f/p1-1?v=${v1}`,
    );
    expect(buildMockTtsUrl("uk-f", "p1-1", "   ")).toBe(
      "http://localhost:3000/api/tts/mock/uk-f/p1-1",
    );

    const fUrl1 = buildForecastTtsUrl("uk-f", "f-home", "f-home-0", "Where is your hometown?");
    const fUrl2 = buildForecastTtsUrl(
      "uk-f",
      "f-home",
      "f-home-0",
      "How has your hometown changed recently?",
    );
    expect(fUrl1).toBe(`http://localhost:3000/api/tts/forecast/uk-f/f-home/f-home-0?v=${v1}`);
    expect(fUrl2).toBe(`http://localhost:3000/api/tts/forecast/uk-f/f-home/f-home-0?v=${v2}`);
    expect(fUrl1).not.toBe(fUrl2);

    const aUrl1 = buildAttemptTtsUrl("att-1", "uk-f", "p1-0", "Where is your hometown?");
    const aUrl2 = buildAttemptTtsUrl(
      "att-1",
      "uk-f",
      "p1-0",
      "How has your hometown changed recently?",
    );
    expect(aUrl1).toBe(`http://localhost:3000/api/tts/attempt/att-1/uk-f/p1-0?v=${v1}`);
    expect(aUrl2).toBe(`http://localhost:3000/api/tts/attempt/att-1/uk-f/p1-0?v=${v2}`);
    expect(aUrl1).not.toBe(aUrl2);
    expect(buildAttemptTtsUrl("att-1", "uk-f", "p1-0", "   ")).toBe(
      "http://localhost:3000/api/tts/attempt/att-1/uk-f/p1-0",
    );
  });
});

describe("speech remote audio playback, prefetch cache & fallback", () => {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const originalSpeechSynthesis = globalThis.speechSynthesis;

  let audioInstances: MockAudioInstance[] = [];
  let playImpl: () => Promise<void>;
  let fetchSpy: ReturnType<typeof vi.fn<typeof fetch>>;
  let speakSpy: ReturnType<typeof vi.fn>;
  let cancelSynthSpy: ReturnType<typeof vi.fn>;
  let revokeUrlSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    audioInstances = [];
    playImpl = () => Promise.resolve();
    fetchSpy = vi.fn<typeof fetch>();
    speakSpy = vi.fn();
    cancelSynthSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);
    (globalThis as Record<string, unknown>).speechSynthesis = {
      speak: speakSpy,
      cancel: cancelSynthSpy,
    };

    class MockAudio implements MockAudioInstance {
      src: string;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play = vi.fn(() => playImpl());
      pause = vi.fn();
      removeAttribute = vi.fn();

      constructor(src = "") {
        this.src = src;
        audioInstances.push(this);
      }
    }

    (globalThis as Record<string, unknown>).Audio = MockAudio;
    revokeUrlSpy = vi.spyOn(URL, "revokeObjectURL");
  });

  afterEach(() => {
    cancelSpeech();
    clearSpeechPrefetchCache();
    revokeUrlSpy.mockRestore();
    (globalThis as Record<string, unknown>).Audio = originalAudio;
    (globalThis as Record<string, unknown>).fetch = originalFetch;
    (globalThis as Record<string, unknown>).speechSynthesis = originalSpeechSynthesis;
    vi.restoreAllMocks();
  });

  it("fetches MP3 once with credentials: 'include', plays via HTMLAudioElement, fires onEnd, and reuses cached Blob on repeat", async () => {
    const audioUrl = "http://localhost:3000/api/tts/mock/uk-f/p1-1?v=abcd1234";
    fetchSpy.mockImplementation(async () => createMp3Response());

    const onEnd1 = vi.fn();
    speakText("Where do you live?", { audioUrl, lang: "en-GB", rate: 0.95, onEnd: onEnd1 });

    await vi.waitFor(() => expect(audioInstances).toHaveLength(1));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      audioUrl,
      expect.objectContaining({
        credentials: "include",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(audioInstances[0]!.play).toHaveBeenCalledTimes(1);
    expect(speakSpy).not.toHaveBeenCalled();

    audioInstances[0]!.onended?.();
    expect(onEnd1).toHaveBeenCalledTimes(1);
    expect(revokeUrlSpy).toHaveBeenCalledTimes(1);

    // Second call with the same URL reuses in-session Blob cache with 0 extra fetch calls
    const onEnd2 = vi.fn();
    speakText("Where do you live?", { audioUrl, lang: "en-GB", rate: 0.95, onEnd: onEnd2 });

    await vi.waitFor(() => expect(audioInstances).toHaveLength(2));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(audioInstances[1]!.play).toHaveBeenCalledTimes(1);
    audioInstances[1]!.onended?.();
    expect(onEnd2).toHaveBeenCalledTimes(1);
  });

  it("sends credentials: 'include' when prefetching authenticated attempt TTS endpoints", async () => {
    const attemptUrl = "http://localhost:3000/api/tts/attempt/att-xyz/uk-f/p1-1?v=12345678";
    fetchSpy.mockResolvedValueOnce(createMp3Response());

    const blob = await prefetchSpeech(attemptUrl);
    expect(blob).toBeInstanceOf(Blob);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      attemptUrl,
      expect.objectContaining({
        credentials: "include",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("reuses prefetched audio Blob with zero extra fetch calls when speakText runs", async () => {
    const audioUrl = "http://localhost:3000/api/tts/forecast/us-m/t-1/t-1-0?v=11223344";
    fetchSpy.mockResolvedValueOnce(createMp3Response());

    const prefetched = await prefetchSpeech(audioUrl);
    expect(prefetched).toBeInstanceOf(Blob);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockClear();
    speakText("Do you enjoy reading?", { audioUrl, lang: "en-US" });

    await vi.waitFor(() => expect(audioInstances).toHaveLength(1));
    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(audioInstances[0]!.play).toHaveBeenCalledTimes(1);
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it("evicts oldest prefetch cache entry once capacity exceeds 32 URLs", async () => {
    fetchSpy.mockImplementation(async () => createMp3Response());

    for (let i = 0; i < 33; i += 1) {
      await prefetchSpeech(`http://localhost:3000/api/tts/mock/uk-f/q-${i}`);
    }
    expect(fetchSpy).toHaveBeenCalledTimes(33);

    // q-32 is still cached -> 0 extra fetches
    fetchSpy.mockClear();
    await prefetchSpeech("http://localhost:3000/api/tts/mock/uk-f/q-32");
    expect(fetchSpy).toHaveBeenCalledTimes(0);

    // q-0 was evicted -> re-fetched cleanly
    await prefetchSpeech("http://localhost:3000/api/tts/mock/uk-f/q-0");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("cancels in-flight fetch or playing Audio immediately and never triggers speechSynthesis fallback", async () => {
    const inFlightUrl = "http://localhost:3000/api/tts/mock/uk-f/in-flight";
    let capturedSignal: AbortSignal | undefined;
    let rejectFetch!: (reason?: unknown) => void;

    fetchSpy.mockImplementationOnce((_input, init) => {
      capturedSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        rejectFetch = reject;
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    speakText("Question while loading", { audioUrl: inFlightUrl, lang: "en-GB" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    cancelSpeech();
    expect(capturedSignal?.aborted).toBe(true);
    rejectFetch(new DOMException("Aborted", "AbortError"));

    // Flush microtasks and ensure neither Audio nor speechSynthesis fallback ran
    await Promise.resolve();
    await Promise.resolve();
    expect(audioInstances).toHaveLength(0);
    expect(speakSpy).not.toHaveBeenCalled();

    // Now play an active Audio and cancel mid-playback
    const playingUrl = "http://localhost:3000/api/tts/mock/uk-f/playing";
    fetchSpy.mockResolvedValueOnce(createMp3Response());
    const onEnd = vi.fn();
    speakText("Question while playing", { audioUrl: playingUrl, lang: "en-GB", onEnd });

    await vi.waitFor(() => expect(audioInstances).toHaveLength(1));
    const active = audioInstances[0]!;
    expect(active.pause).not.toHaveBeenCalled();

    cancelSpeech();
    expect(active.pause).toHaveBeenCalledTimes(1);
    expect(active.onended).toBeNull();
    expect(active.onerror).toBeNull();
    expect(speakSpy).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("falls back to speechSynthesis on 503, network error, or Audio.play() rejection without caching failures", async () => {
    const flakyUrl = "http://localhost:3000/api/tts/preview/uk-f";

    // 1. 503 HTTP error -> fallback to speechSynthesis & not cached
    fetchSpy.mockResolvedValueOnce(new Response("Unavailable", { status: 503 }));
    const onEnd503 = vi.fn();
    speakText("Hello from Emma", { audioUrl: flakyUrl, lang: "en-GB", rate: 0.95, onEnd: onEnd503 });

    await vi.waitFor(() => expect(speakSpy).toHaveBeenCalledTimes(1));
    const u1 = speakSpy.mock.calls[0]![0] as SpeechSynthesisUtterance;
    expect(u1.text).toBe("Hello from Emma");
    expect(u1.lang).toBe("en-GB");
    expect(u1.rate).toBe(0.95);
    u1.onend?.call(u1, new Event("end") as SpeechSynthesisEvent);
    expect(onEnd503).toHaveBeenCalledTimes(1);

    // 2. Network rejection on retry -> still not cached, falls back again
    fetchSpy.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    speakText("Hello from Emma", { audioUrl: flakyUrl, lang: "en-GB" });

    await vi.waitFor(() => expect(speakSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    // 3. Subsequent retry succeeds via Audio because failures were evicted
    fetchSpy.mockResolvedValueOnce(createMp3Response());
    speakText("Hello from Emma", { audioUrl: flakyUrl, lang: "en-GB" });

    await vi.waitFor(() => expect(audioInstances).toHaveLength(1));
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(audioInstances[0]!.play).toHaveBeenCalledTimes(1);
    expect(speakSpy).toHaveBeenCalledTimes(2);

    // 4. Audio.play() rejection (e.g. autoplay policy / decode failure) -> falls back once
    const blockedUrl = "http://localhost:3000/api/tts/preview/au-f";
    fetchSpy.mockResolvedValueOnce(createMp3Response());
    playImpl = () => Promise.reject(new DOMException("NotAllowedError", "NotAllowedError"));

    speakText("Hello from Olivia", { audioUrl: blockedUrl, lang: "en-AU" });
    await vi.waitFor(() => expect(speakSpy).toHaveBeenCalledTimes(3));
    const u3 = speakSpy.mock.calls[2]![0] as SpeechSynthesisUtterance;
    expect(u3.text).toBe("Hello from Olivia");
    expect(u3.lang).toBe("en-AU");
  });

  it("prefetches current & next exam steps on intro and plays cached audio on asking for mock and forecast", async () => {
    fetchSpy.mockImplementation(async () => createMp3Response());

    let sessionRef: ExamSessionValue | null = null;
    function SessionProbe() {
      sessionRef = useExamSession();
      return null;
    }

    // 1. Mock exam mode
    const mockHarness = renderWithApp(createElement(SessionProbe), { mode: "p1", voice: "uk-f" });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("/api/tts/mock/uk-f/p1-1?v=");
    expect(String(fetchSpy.mock.calls[1]![0])).toContain("/api/tts/mock/uk-f/p1-1-f?v=");

    fetchSpy.mockClear();
    await act(async () => {
      sessionRef!.begin();
    });
    await vi.waitFor(() => expect(audioInstances).toHaveLength(1));
    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(audioInstances[0]!.play).toHaveBeenCalledTimes(1);

    act(() => {
      sessionRef!.toggleMuted();
    });
    expect(audioInstances[0]!.pause).toHaveBeenCalledTimes(1);
    mockHarness.unmount();

    // 2. Forecast practice mode
    fetchSpy.mockClear();
    audioInstances = [];
    const forecastHarness = renderWithApp(createElement(SessionProbe), {
      voice: "us-m",
      practice: {
        topicId: "f-hometown",
        title: "Hometown",
        kind: "p1",
        items: [
          { id: "f-hometown-0", part: 1, text: "Where is your hometown?" },
          { id: "f-hometown-1", part: 1, text: "Do you like living there?" },
        ],
      },
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(String(fetchSpy.mock.calls[0]![0])).toContain(
      "/api/tts/forecast/us-m/f-hometown/f-hometown-0?v=",
    );
    expect(String(fetchSpy.mock.calls[1]![0])).toContain(
      "/api/tts/forecast/us-m/f-hometown/f-hometown-1?v=",
    );

    fetchSpy.mockClear();
    await act(async () => {
      sessionRef!.begin();
    });
    await vi.waitFor(() => expect(audioInstances).toHaveLength(1));
    expect(fetchSpy).toHaveBeenCalledTimes(0);
    expect(audioInstances[0]!.play).toHaveBeenCalledTimes(1);
    forecastHarness.unmount();
  });
});
