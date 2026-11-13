import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getActiveSpy = vi.fn();
const startSpy = vi.fn();
const submitSpy = vi.fn();
const prepareNextQuestionSpy = vi.fn();
const invalidateLinkedPromptSpy = vi.fn();
const trackUploadSpy = vi.fn();
const stopSpy = vi.fn();
const prefetchSpeechSpy = vi.fn();
const speakTextSpy = vi.fn();
const cancelSpeechSpy = vi.fn();

const recordedBlob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    attempt: {
      getActive: { query: (...a: unknown[]) => getActiveSpy(...a) },
      start: { mutate: (...a: unknown[]) => startSpy(...a) },
      submit: { mutate: (...a: unknown[]) => submitSpy(...a) },
      prepareNextQuestion: { mutate: (...a: unknown[]) => prepareNextQuestionSpy(...a) },
      invalidateLinkedPrompt: { mutate: (...a: unknown[]) => invalidateLinkedPromptSpy(...a) },
    },
  },
}));

vi.mock("../answer-uploads", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../answer-uploads")>()),
  trackAnswerUpload: (...a: unknown[]) => trackUploadSpy(...a),
}));

vi.mock("../storage", () => ({
  saveAudioBlob: vi.fn().mockResolvedValue(undefined),
  deleteAudioBlob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/hooks/use-recorder", () => ({
  useRecorder: () => ({
    status: "idle",
    isRecording: false,
    mimeType: "audio/webm",
    start: async () => true,
    stop: (...a: unknown[]) => stopSpy(...a),
    cancel: () => {},
  }),
}));

vi.mock("@/lib/speech", () => ({
  prefetchSpeech: (...a: unknown[]) => prefetchSpeechSpy(...a),
  speakText: (...a: unknown[]) => speakTextSpy(...a),
  cancelSpeech: (...a: unknown[]) => cancelSpeechSpy(...a),
}));

import type { PracticeSession } from "@/features/app-state/types";
import { promiseWithResolvers } from "@/lib/promise-with-resolvers";
import { renderWithApp } from "@/test/harness";

import { ExamScreen } from "../exam-screen";

const PART1_PRACTICE: PracticeSession = {
  topicId: "f-neighborhood",
  title: "Neighborhood",
  kind: "p1",
  items: [
    { id: "f-neighborhood-0", part: 1, text: "Where do you live?", answer: "I live in a quiet neighborhood in Hanoi." },
    { id: "f-neighborhood-1", part: 1, text: "Do you like your neighborhood?", answer: "Yes, it is peaceful and convenient." },
  ],
};

const PART23_PRACTICE: PracticeSession = {
  topicId: "f-helped",
  title: "Describe a time when you helped someone",
  kind: "p23",
  items: [
    {
      id: "f-helped-p2",
      part: 2,
      text: "Describe a time when you helped someone.",
      answer: "Last month I helped my neighbor carry heavy groceries upstairs.",
      cue: {
        title: "Describe a time when you helped someone",
        points: ["Who you helped", "How you helped them", "Why they needed help"],
        ending: "and explain how you felt afterwards.",
      },
    },
    {
      id: "f-helped-p3-0",
      part: 3,
      text: "Why do people help each other in a community?",
      answer: "Helping builds trust and makes neighborhoods safer.",
    },
  ],
};

const SINGLE_QUESTION_PRACTICE: PracticeSession = {
  topicId: "f-neighborhood",
  title: "Neighborhood",
  kind: "p1",
  items: [PART1_PRACTICE.items[0]!],
  singleQuestionId: "f-neighborhood-0",
};

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

function beginAndReveal() {
  const begin = screen.queryByText(/^Bắt đầu Part \d$/);
  if (begin) fireEvent.click(begin);
  act(() => {
    vi.advanceTimersByTime(3500);
  });
}

function recordAndStop() {
  const mic = screen.queryByLabelText("Bắt đầu ghi");
  if (mic) fireEvent.click(mic);
  else fireEvent.click(screen.getByText("Sẵn sàng, bắt đầu nói"));
  act(() => {
    vi.advanceTimersByTime(1200);
  });
  fireEvent.click(screen.getByLabelText("Dừng ghi"));
}

describe("ExamScreen linked multi-question practice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getActiveSpy.mockReset().mockResolvedValue(null);
    startSpy.mockReset().mockResolvedValue({ attemptId: "att-linked-1" });
    submitSpy.mockReset().mockResolvedValue({ success: true });
    prepareNextQuestionSpy.mockReset().mockResolvedValue({ linked: false, questionText: null, triggerPhrase: null });
    invalidateLinkedPromptSpy.mockReset().mockResolvedValue({ cleared: true });
    trackUploadSpy.mockReset().mockResolvedValue(true);
    stopSpy.mockReset().mockResolvedValue({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" });
    prefetchSpeechSpy.mockReset().mockResolvedValue(null);
    speakTextSpy.mockReset();
    cancelSpeechSpy.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prepares next Part 1 question after upload, shows examiner-thinking while pending, and uses attempt TTS", async () => {
    const upload = promiseWithResolvers<boolean>();
    const prep = promiseWithResolvers<{ linked: boolean; questionText: string | null; triggerPhrase: string | null }>();
    trackUploadSpy.mockReturnValueOnce(upload.promise);
    prepareNextQuestionSpy.mockReturnValueOnce(prep.promise);

    renderWithApp(<ExamScreen />, { practice: PART1_PRACTICE, voice: "uk-f" });
    await flush();

    // Only Q1 static forecast audio should be prefetched initially (not unlinked Q2).
    const initialPrefetches = prefetchSpeechSpy.mock.calls.map((c) => String(c[0]));
    expect(initialPrefetches.some((u) => u.includes("/api/tts/forecast/uk-f/f-neighborhood/f-neighborhood-0"))).toBe(true);
    expect(initialPrefetches.some((u) => u.includes("/api/tts/forecast/uk-f/f-neighborhood/f-neighborhood-1"))).toBe(false);

    beginAndReveal();
    recordAndStop();

    // prepareNextQuestion must wait until the answer upload settles.
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
    expect(prepareNextQuestionSpy).not.toHaveBeenCalled();

    await act(async () => {
      upload.resolve(true);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(prepareNextQuestionSpy).toHaveBeenCalledTimes(1);
    expect(prepareNextQuestionSpy).toHaveBeenCalledWith(
      {
        attemptId: "att-linked-1",
        previousQuestionKey: "f-neighborhood-0",
        nextQuestionKey: "f-neighborhood-1",
        previousGeneration: expect.any(Number),
        prepToken: expect.stringMatching(/^s0-t\d+$/),
      },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    // User clicks "Câu tiếp theo" while prepareNextQuestion is still in flight -> examiner-thinking state.
    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.getByText("Đang chuẩn bị câu tiếp theo…")).toBeTruthy();
    expect(screen.getByText("Giám khảo AI đang phân tích câu trả lời…")).toBeTruthy();
    expect(screen.queryByText("Where do you live?")).toBeNull();
    expect(screen.queryByText("Câu tiếp theo")).toBeNull();

    // Linked question arrives -> prefetches & speaks /api/tts/attempt/... and displays linked text + trigger chip.
    await act(async () => {
      prep.resolve({
        linked: true,
        questionText: "What do you enjoy most about your quiet neighborhood?",
        triggerPhrase: "quiet neighborhood",
      });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();

    expect(screen.queryByText("Đang chuẩn bị câu tiếp theo…")).toBeNull();
    expect(screen.getByText(/Hỏi nối tiếp · dựa trên “quiet neighborhood” trong câu trả lời của bạn/)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByText("What do you enjoy most about your quiet neighborhood?")).toBeTruthy();

    const prefetchedUrls = prefetchSpeechSpy.mock.calls.map((c) => String(c[0]));
    expect(prefetchedUrls.some((u) => u.includes("/api/tts/attempt/att-linked-1/uk-f/f-neighborhood-1?v="))).toBe(true);

    const spokenCalls = speakTextSpy.mock.calls;
    const lastSpoken = spokenCalls.at(-1)!;
    expect(lastSpoken[0]).toBe("What do you enjoy most about your quiet neighborhood?");
    expect((lastSpoken[1] as { audioUrl?: string }).audioUrl).toContain(
      "/api/tts/attempt/att-linked-1/uk-f/f-neighborhood-1?v=",
    );
  });

  it("links Part 2 to Part 3 across the part boundary and plays attempt TTS after Part 3 intro", async () => {
    const prep = promiseWithResolvers<{ linked: boolean; questionText: string | null; triggerPhrase: string | null }>();
    prepareNextQuestionSpy.mockReturnValueOnce(prep.promise);

    renderWithApp(<ExamScreen />, { practice: PART23_PRACTICE, voice: "us-m" });
    await flush();

    beginAndReveal();
    expect(screen.getByText("CUE CARD")).toBeTruthy();
    recordAndStop();
    await flush();

    expect(prepareNextQuestionSpy).toHaveBeenCalledWith(
      {
        attemptId: "att-linked-1",
        previousQuestionKey: "f-helped-p2",
        nextQuestionKey: "f-helped-p3-0",
        previousGeneration: expect.any(Number),
        prepToken: expect.stringMatching(/^s0-t\d+$/),
      },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.getByText("Đang chuẩn bị câu tiếp theo…")).toBeTruthy();
    expect(screen.queryByText("CUE CARD")).toBeNull();

    await act(async () => {
      prep.resolve({
        linked: true,
        questionText: "Why do neighbors help each other with daily errands in cities?",
        triggerPhrase: "helped my neighbor",
      });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();

    // Crossing Part 2 -> Part 3 lands on Part 3 intro first.
    expect(screen.getByText("Bắt đầu Part 3")).toBeTruthy();
    fireEvent.click(screen.getByText("Bắt đầu Part 3"));
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.getByText(/Hỏi nối tiếp · dựa trên “helped my neighbor” trong câu trả lời của bạn/)).toBeTruthy();
    expect(screen.getByText("Why do neighbors help each other with daily errands in cities?")).toBeTruthy();

    const lastSpoken = speakTextSpy.mock.calls.at(-1)!;
    expect((lastSpoken[1] as { audioUrl?: string }).audioUrl).toContain(
      "/api/tts/attempt/att-linked-1/us-m/f-helped-p3-0?v=",
    );
  });

  it("never calls prepareNextQuestion and advances synchronously for single-question practice and mock tests", async () => {
    // 1. Single-question forecast practice
    const single = renderWithApp(<ExamScreen />, { practice: SINGLE_QUESTION_PRACTICE });
    await flush();
    beginAndReveal();
    recordAndStop();
    await flush();

    expect(prepareNextQuestionSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Hoàn thành"));
    expect(screen.getByText("Kiểm tra trước khi nộp")).toBeTruthy();
    single.unmount();

    // 2. Mock test (practice: null)
    prepareNextQuestionSpy.mockClear();
    renderWithApp(<ExamScreen />, { practice: null, mode: "p1" });
    await flush();
    beginAndReveal();
    recordAndStop();
    await flush();

    expect(prepareNextQuestionSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.queryByText("Đang chuẩn bị câu tiếp theo…")).toBeNull();
    expect(screen.getByText(/Hỏi nối tiếp · dựa trên “quite noisy at night”/)).toBeTruthy();
  });

  it("invalidates stale prepareNextQuestion results on retry ('Nói lại') and regenerates on the new recording", async () => {
    const prep1 = promiseWithResolvers<{ linked: boolean; questionText: string | null; triggerPhrase: string | null }>();
    const prep2 = promiseWithResolvers<{ linked: boolean; questionText: string | null; triggerPhrase: string | null }>();
    prepareNextQuestionSpy.mockReturnValueOnce(prep1.promise).mockReturnValueOnce(prep2.promise);

    renderWithApp(<ExamScreen />, { practice: PART1_PRACTICE });
    await flush();

    beginAndReveal();
    recordAndStop();
    await flush();
    expect(prepareNextQuestionSpy).toHaveBeenCalledTimes(1);

    // Learner clicks "Nói lại" before prep1 finishes, then records again.
    fireEvent.click(screen.getByText("Nói lại"));
    expect(invalidateLinkedPromptSpy).toHaveBeenCalledWith({
      attemptId: "att-linked-1",
      questionKey: "f-neighborhood-1",
      prepToken: "s0-t1",
    });
    recordAndStop();
    await flush();
    expect(prepareNextQuestionSpy).toHaveBeenCalledTimes(2);

    // Late resolution from the abandoned first recording must be ignored.
    await act(async () => {
      prep1.resolve({
        linked: true,
        questionText: "STALE QUESTION SHOULD BE IGNORED",
        triggerPhrase: "stale phrase",
      });
      await vi.advanceTimersByTimeAsync(0);
    });

    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.getByText("Đang chuẩn bị câu tiếp theo…")).toBeTruthy();

    await act(async () => {
      prep2.resolve({
        linked: true,
        questionText: "Fresh linked question from second take?",
        triggerPhrase: "second take idea",
      });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();

    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.queryByText("STALE QUESTION SHOULD BE IGNORED")).toBeNull();
    expect(screen.getByText("Fresh linked question from second take?")).toBeTruthy();
    expect(screen.getByText(/Hỏi nối tiếp · dựa trên “second take idea”/)).toBeTruthy();
  });

  it("clears an already-settled linked override on retry so old linked text never leaks if the second take falls back", async () => {
    prepareNextQuestionSpy
      .mockResolvedValueOnce({
        linked: true,
        questionText: "First take linked question?",
        triggerPhrase: "first trigger",
      })
      .mockResolvedValueOnce({
        linked: false,
        questionText: null,
        triggerPhrase: null,
      });

    renderWithApp(<ExamScreen />, { practice: PART1_PRACTICE });
    await flush();

    beginAndReveal();
    recordAndStop();
    await flush();

    fireEvent.click(screen.getByText("Nói lại"));
    recordAndStop();
    await flush();

    fireEvent.click(screen.getByText("Câu tiếp theo"));
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText("First take linked question?")).toBeNull();
    expect(screen.getByText("Do you like your neighborhood?")).toBeTruthy();
  });

  it("falls back cleanly to the canonical topic question when prepareNextQuestion returns linked: false, rejects, or times out", async () => {
    // 1. linked: false
    const prepFalse = promiseWithResolvers<{ linked: boolean; questionText: string | null; triggerPhrase: string | null }>();
    prepareNextQuestionSpy.mockReturnValueOnce(prepFalse.promise);

    const h1 = renderWithApp(<ExamScreen />, { practice: PART1_PRACTICE, voice: "uk-f" });
    await flush();
    beginAndReveal();
    recordAndStop();
    await flush();
    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.getByText("Đang chuẩn bị câu tiếp theo…")).toBeTruthy();

    await act(async () => {
      prepFalse.resolve({ linked: false, questionText: null, triggerPhrase: null });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByText("Do you like your neighborhood?")).toBeTruthy();
    expect(screen.queryByText(/Hỏi nối tiếp/)).toBeNull();
    expect((speakTextSpy.mock.calls.at(-1)![1] as { audioUrl?: string }).audioUrl).toContain(
      "/api/tts/forecast/uk-f/f-neighborhood/f-neighborhood-1?v=",
    );
    h1.unmount();

    // 2. rejection
    speakTextSpy.mockClear();
    const prepErr = promiseWithResolvers<{ linked: boolean; questionText: string | null; triggerPhrase: string | null }>();
    prepareNextQuestionSpy.mockReturnValueOnce(prepErr.promise);

    const h2 = renderWithApp(<ExamScreen />, { practice: PART1_PRACTICE, voice: "uk-f" });
    await flush();
    beginAndReveal();
    recordAndStop();
    await flush();
    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.getByText("Đang chuẩn bị câu tiếp theo…")).toBeTruthy();

    await act(async () => {
      prepErr.reject(new Error("LLM unavailable"));
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByText("Do you like your neighborhood?")).toBeTruthy();
    expect((speakTextSpy.mock.calls.at(-1)![1] as { audioUrl?: string }).audioUrl).toContain(
      "/api/tts/forecast/uk-f/f-neighborhood/f-neighborhood-1?v=",
    );
    h2.unmount();

    // 3. client 12s safety timeout
    speakTextSpy.mockClear();
    const prepHung = promiseWithResolvers<{ linked: boolean; questionText: string | null; triggerPhrase: string | null }>();
    prepareNextQuestionSpy.mockReturnValueOnce(prepHung.promise);

    renderWithApp(<ExamScreen />, { practice: PART1_PRACTICE, voice: "uk-f" });
    await flush();
    beginAndReveal();
    recordAndStop();
    await flush();
    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.getByText("Đang chuẩn bị câu tiếp theo…")).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
    expect(invalidateLinkedPromptSpy).toHaveBeenCalledWith({
      attemptId: "att-linked-1",
      questionKey: "f-neighborhood-1",
      prepToken: "s0-t1",
    });
    await flush();
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.queryByText("Đang chuẩn bị câu tiếp theo…")).toBeNull();
    expect(screen.getByText("Do you like your neighborhood?")).toBeTruthy();
    expect((speakTextSpy.mock.calls.at(-1)![1] as { audioUrl?: string }).audioUrl).toContain(
      "/api/tts/forecast/uk-f/f-neighborhood/f-neighborhood-1?v=",
    );
  });

  it("skips prepareNextQuestion and clears linked prompt when retry recording returns null", async () => {
    renderWithApp(<ExamScreen />, { practice: PART1_PRACTICE, voice: "uk-f" });
    await flush();

    beginAndReveal();
    recordAndStop();
    await flush();
    expect(prepareNextQuestionSpy).toHaveBeenCalledTimes(1);

    // Retry ("Nói lại") followed by an empty/null recording (e.g. mic error on take #2).
    fireEvent.click(screen.getByText("Nói lại"));
    invalidateLinkedPromptSpy.mockClear();
    stopSpy.mockResolvedValueOnce(null);
    recordAndStop();
    await flush();

    // Take #2 must NOT call prepareNextQuestion without previousGeneration (which would reuse take #1).
    expect(prepareNextQuestionSpy).toHaveBeenCalledTimes(1);
    expect(invalidateLinkedPromptSpy).toHaveBeenCalledWith({
      attemptId: "att-linked-1",
      questionKey: "f-neighborhood-1",
      prepToken: "s0-t3",
    });

    fireEvent.click(screen.getByText("Câu tiếp theo"));
    expect(screen.queryByText("Đang chuẩn bị câu tiếp theo…")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByText("Do you like your neighborhood?")).toBeTruthy();
  });
});
