import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getActiveSpy = vi.fn();
const startSpy = vi.fn();
const submitSpy = vi.fn();
const trackUploadSpy = vi.fn();
const recordedBlob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    attempt: {
      getActive: { query: (...a: unknown[]) => getActiveSpy(...a) },
      start: { mutate: (...a: unknown[]) => startSpy(...a) },
      submit: { mutate: (...a: unknown[]) => submitSpy(...a) },
    },
  },
}));

vi.mock("../answer-uploads", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../answer-uploads")>()),
  trackAnswerUpload: (...a: unknown[]) => trackUploadSpy(...a),
}));

const saveAudioSpy = vi.fn<(record: { attemptId: string }) => Promise<void>>();
const deleteAudioSpy = vi.fn<(attemptId: string, questionKey: string) => Promise<void>>();

vi.mock("../storage", () => ({
  saveAudioBlob: (record: { attemptId: string }) => saveAudioSpy(record),
  deleteAudioBlob: (attemptId: string, questionKey: string) => deleteAudioSpy(attemptId, questionKey),
}));

const stopSpy = vi.fn();

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

import type { PracticeSession } from "@/features/app-state/types";
import { renderWithApp } from "@/test/harness";

import { ExamScreen } from "../exam-screen";

const PRACTICE: PracticeSession = {
  topicId: "p1-tidiness",
  title: "Tidiness",
  kind: "p1",
  items: [{ id: "p1-tidiness-0", part: 1, text: "Are you a tidy person?", answer: "Yes I am quite tidy." }],
  singleQuestionId: "p1-tidiness-0",
};

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("ExamScreen submit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getActiveSpy.mockReset().mockResolvedValue(null);
    startSpy.mockReset();
    submitSpy.mockReset().mockResolvedValue({ success: true });
    trackUploadSpy.mockReset().mockResolvedValue(true);
    stopSpy.mockReset().mockResolvedValue({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" });
    saveAudioSpy.mockReset().mockResolvedValue(undefined);
    deleteAudioSpy.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hands a forecast practice attempt to the scoring screen without submitting in the background", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-forecast" });
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    fireEvent.click(screen.getByText(/nộp & chấm/i));

    expect(h.state().scoringAttempt).toEqual({ attemptId: "att-forecast", submitted: false });
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("registers each recording's upload under the attempt as soon as recording stops", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-forecast" });
    renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
    const [attemptId, recording] = trackUploadSpy.mock.calls[0]!;
    expect(attemptId).toBe("att-forecast");
    await expect(recording).resolves.toMatchObject({
      attemptId: "att-forecast",
      questionKey: "p1-tidiness-0",
      blob: recordedBlob,
      durationMs: 4000,
      mimeType: "audio/webm",
      part: 1,
      order: 0,
    });
  });

  it("keeps the background submit for a mock test and clears any stale scoring attempt", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, {
      mode: "p1",
      scoringAttempt: { attemptId: "att-old", submitted: true },
    });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    fireEvent.click(screen.getByText(/nộp & chấm/i));

    expect(submitSpy).toHaveBeenCalledWith({ attemptId: "att-mock" });
    expect(h.state().scoringAttempt).toBeNull();
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
    expect(h.go).toHaveBeenCalledWith("scoring");
  });

  it("uploads a session-id recording under the real attempt once attempt.start answers", async () => {
    const { promise: startPromise, resolve: resolveStart } = Promise.withResolvers<{ attemptId: string }>();
    startSpy.mockReturnValue(startPromise);
    renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    await flush();
    expect(trackUploadSpy).not.toHaveBeenCalled();
    expect(saveAudioSpy).toHaveBeenCalledTimes(1);
    const sessionId = saveAudioSpy.mock.calls[0]![0].attemptId;
    expect(sessionId).toBeTruthy();
    expect(sessionId).not.toBe("att-late");

    await act(async () => {
      resolveStart({ attemptId: "att-late" });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
    const [attemptId, recording] = trackUploadSpy.mock.calls[0]!;
    expect(attemptId).toBe("att-late");
    await expect(recording).resolves.toMatchObject({
      attemptId: "att-late",
      questionKey: "p1-tidiness-0",
      part: 1,
      order: 0,
    });

    await flush();
    await flush();
    expect(deleteAudioSpy).toHaveBeenCalledTimes(1);
    expect(deleteAudioSpy.mock.calls[0]![0]).toBe(sessionId);
    expect(deleteAudioSpy.mock.calls[0]![1]).toBe("p1-tidiness-0");

    await flush();
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
  });

  it("tracks a recording whose encode finishes after the attempt id arrived", async () => {
    const { promise: stopPromise, resolve: resolveStop } = Promise.withResolvers<{
      blob: Blob;
      durationMs: number;
      mimeType: string;
    }>();
    const { promise: startPromise, resolve: resolveStart } = Promise.withResolvers<{ attemptId: string }>();
    stopSpy.mockReturnValue(stopPromise);
    startSpy.mockReturnValue(startPromise);
    renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    const begin = screen.queryByText(/^Bắt đầu Part \d$/);
    if (begin) fireEvent.click(begin);
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    fireEvent.click(screen.getByLabelText("Bắt đầu ghi"));
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    fireEvent.click(screen.getByLabelText("Dừng ghi"));

    await act(async () => {
      resolveStart({ attemptId: "att-late" });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    expect(trackUploadSpy).not.toHaveBeenCalled();

    await act(async () => {
      resolveStop({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
    const [attemptId, recording] = trackUploadSpy.mock.calls[0]!;
    expect(attemptId).toBe("att-late");
    expect(recording).toMatchObject({ attemptId: "att-late" });
    expect(saveAudioSpy).not.toHaveBeenCalled();
  });

  it("keeps the recording device-only when attempt.start never answers", async () => {
    startSpy.mockReturnValue(Promise.withResolvers<{ attemptId: string }>().promise);
    renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    await flush();
    expect(trackUploadSpy).not.toHaveBeenCalled();
    expect(saveAudioSpy).toHaveBeenCalledTimes(1);
  });

  it("backfills from the resumed active attempt (attempt.getActive)", async () => {
    const { promise: activePromise, resolve: resolveActive } = Promise.withResolvers<unknown>();
    getActiveSpy.mockReturnValue(activePromise);
    renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    await flush();
    expect(trackUploadSpy).not.toHaveBeenCalled();

    await act(async () => {
      resolveActive({
        attempt: { id: "att-resume", topicId: "p1-tidiness", questionKey: "p1-tidiness-0", mode: "part1" },
        answers: [],
      });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
    const [attemptId, recording] = trackUploadSpy.mock.calls[0]!;
    expect(attemptId).toBe("att-resume");
    await expect(recording).resolves.toMatchObject({ attemptId: "att-resume", questionKey: "p1-tidiness-0" });
    expect(startSpy).not.toHaveBeenCalled();
  });

  it("only tracks the newest take when two takes finish before the attempt id", async () => {
    const { promise: startPromise, resolve: resolveStart } = Promise.withResolvers<{ attemptId: string }>();
    const { promise: stop1Promise, resolve: resolveStop1 } = Promise.withResolvers<{
      blob: Blob;
      durationMs: number;
      mimeType: string;
    }>();
    const { promise: stop2Promise, resolve: resolveStop2 } = Promise.withResolvers<{
      blob: Blob;
      durationMs: number;
      mimeType: string;
    }>();
    startSpy.mockReturnValue(startPromise);
    renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    const begin = screen.queryByText(/^Bắt đầu Part \d$/);
    if (begin) fireEvent.click(begin);
    act(() => {
      vi.advanceTimersByTime(3200);
    });

    stopSpy.mockReturnValueOnce(stop1Promise);
    fireEvent.click(screen.getByLabelText("Bắt đầu ghi"));
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    fireEvent.click(screen.getByLabelText("Dừng ghi"));
    await act(async () => {
      resolveStop1({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    expect(saveAudioSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(/Nói lại/));
    stopSpy.mockReturnValueOnce(stop2Promise);
    fireEvent.click(screen.getByLabelText("Bắt đầu ghi"));
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    fireEvent.click(screen.getByLabelText("Dừng ghi"));
    await act(async () => {
      resolveStop2({ blob: recordedBlob, durationMs: 5000, mimeType: "audio/webm" });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    expect(saveAudioSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveStart({ attemptId: "att-late" });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
    const [, recording] = trackUploadSpy.mock.calls[0]!;
    await expect(recording).resolves.toMatchObject({ attemptId: "att-late", durationMs: 5000 });
  });

  it("blocks submit while the attempt is syncing", async () => {
    const { promise: startPromise, resolve: resolveStart } = Promise.withResolvers<{ attemptId: string }>();
    startSpy.mockReturnValue(startPromise);
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    const lockButton = screen.getByText(/đang đồng bộ phiên thi/i);
    expect(lockButton).toHaveProperty("disabled", true);
    fireEvent.click(lockButton);
    expect(h.state().scoringAttempt).toBeNull();

    await act(async () => {
      resolveStart({ attemptId: "att-late" });
      await vi.advanceTimersByTimeAsync(0);
    });
    await flush();
    // Drain must have registered the pending recording before any submit can
    // happen — assert before the click so a regression back to an async effect
    // drain (that skips flushing) turns this red.
    expect(trackUploadSpy).toHaveBeenCalledTimes(1);
    const submitButton = screen.getByText(/nộp & chấm/i);
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);
    expect(h.state().scoringAttempt).toEqual({ attemptId: "att-late", submitted: false });
    expect(trackUploadSpy).toHaveBeenCalled();
  });

  it("re-enables submit when attempt.start fails (offline/mock)", async () => {
    startSpy.mockRejectedValue(new Error("network down"));
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    const submitButton = screen.getByText(/nộp & chấm/i);
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);
    expect(h.state().scoringAttempt).toBeNull();
    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("forgets pending recordings in memory on unmount without deleting device copies", async () => {
    startSpy.mockReturnValue(Promise.withResolvers<{ attemptId: string }>().promise);
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    await flush();
    expect(saveAudioSpy).toHaveBeenCalledTimes(1);

    h.unmount();
    expect(deleteAudioSpy).not.toHaveBeenCalled();
  });
});

/** Answers the current step; the Part intro only appears on the first step of a part. */
function answerStep() {
  const begin = screen.queryByText(/^Bắt đầu Part \d$/);
  if (begin) fireEvent.click(begin);
  act(() => {
    vi.advanceTimersByTime(3200);
  });
  fireEvent.click(screen.getByLabelText("Bắt đầu ghi"));
  act(() => {
    vi.advanceTimersByTime(1200);
  });
  fireEvent.click(screen.getByLabelText("Dừng ghi"));
  fireEvent.click(screen.getByText(/Câu tiếp theo|Hoàn thành/));
}
