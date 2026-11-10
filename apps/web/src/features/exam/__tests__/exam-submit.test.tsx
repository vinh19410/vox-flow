import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getActiveSpy = vi.fn();
const startSpy = vi.fn();
const submitSpy = vi.fn();
const trackUploadSpy = vi.fn();
const flushSpy = vi.fn();
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
  flushAnswerUploads: (...a: unknown[]) => flushSpy(...a),
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
import { promiseWithResolvers } from "@/lib/promise-with-resolvers";
import { renderWithApp } from "@/test/harness";

import { ExamScreen } from "../exam-screen";
import { useExamSession } from "../use-exam-session";

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
    flushSpy.mockReset().mockResolvedValue({ failedQuestionKeys: [], storageUnreadable: false });
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

  it("flushes every answer upload before submitting a mock test", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, {
      mode: "p1",
      scoringAttempt: { attemptId: "att-old", submitted: true },
    });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: flushPromise, resolve: resolveFlush } = promiseWithResolvers<{
      failedQuestionKeys: string[];
      storageUnreadable: boolean;
    }>();
    flushSpy.mockReturnValue(flushPromise);
    const { promise: submitPromise, resolve: resolveSubmit } = promiseWithResolvers<{ success: boolean }>();
    submitSpy.mockReturnValue(submitPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));

    expect(flushSpy).toHaveBeenCalledWith("att-mock");
    expect(submitSpy).not.toHaveBeenCalled();
    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(screen.getByText(/Đang tải lên bản ghi…/)).toHaveProperty("disabled", true);

    await act(async () => {
      resolveFlush({ failedQuestionKeys: [], storageUnreadable: false });
      await flush();
    });
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: "att-mock" });
    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(screen.getByText(/Đang nộp…/)).toHaveProperty("disabled", true);

    await act(async () => {
      resolveSubmit({ success: true });
      await flush();
    });
    expect(h.state().scoringAttempt).toBeNull();
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(screen.getByText(/nộp & chấm/i)).toHaveProperty("disabled", false);
  });

  it("blocks submit and offers a retry when uploads still fail after retries", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    flushSpy.mockResolvedValueOnce({ failedQuestionKeys: ["p1-x-0"], storageUnreadable: false });
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(screen.getByText("Vẫn chưa tải lên được một số câu trả lời. Kiểm tra kết nối mạng rồi thử lại.")).toBeTruthy();
    expect(screen.queryByText("Vẫn nộp")).toBeNull();

    flushSpy.mockResolvedValueOnce({ failedQuestionKeys: [], storageUnreadable: false });
    fireEvent.click(screen.getByText("Thử lại"));
    await flush();
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(h.go).toHaveBeenCalledWith("scoring");
  });

  it("offers submit anyway when the device storage cannot be read", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    flushSpy.mockResolvedValueOnce({ failedQuestionKeys: [], storageUnreadable: true });
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();

    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(
      screen.getByText(
        "Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận.",
      ),
    ).toBeTruthy();
    expect(flushSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Vẫn nộp"));
    await flush();
    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: "att-mock" });
    expect(h.go).toHaveBeenCalledWith("scoring");
  });

  it("treats an already-submitted rejection as success", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    submitSpy.mockRejectedValue(
      Object.assign(new Error("Attempt is already submitted"), { data: { code: "BAD_REQUEST" } }),
    );
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();

    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
    expect(screen.queryByText(/Vẫn chưa nộp được bài/)).toBeNull();
  });

  it("surfaces a failed submit without navigating and retries cleanly", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: submitPromise, reject: rejectSubmit } = promiseWithResolvers<{ success: boolean }>();
    submitSpy.mockReturnValueOnce(submitPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();

    await act(async () => {
      rejectSubmit(new Error("network down"));
      await flush();
    });
    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(screen.getByText("Vẫn chưa nộp được bài. Kiểm tra kết nối mạng rồi thử lại.")).toBeTruthy();

    fireEvent.click(screen.getByText("Thử lại"));
    await flush();
    expect(submitSpy).toHaveBeenCalledTimes(2);
    expect(h.go).toHaveBeenCalledWith("scoring");
  });

  it("distinguishes a permanent rejection from a network error", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    submitSpy.mockRejectedValueOnce(
      Object.assign(new Error("Attempt is abandoned"), { data: { code: "BAD_REQUEST" } }),
    );
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();

    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(
      screen.getByText("Bài thi không thể nộp lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiếp tục gặp lỗi."),
    ).toBeTruthy();
  });

  it("does not flush or submit when attempt.start failed (offline mock)", async () => {
    startSpy.mockRejectedValue(new Error("network down"));
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    fireEvent.click(screen.getByText(/nộp & chấm/i));

    expect(flushSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
  });

  it("ignores a second submit click while one is already running", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: flushPromise, resolve: resolveFlush } = promiseWithResolvers<{
      failedQuestionKeys: string[];
      storageUnreadable: boolean;
    }>();
    flushSpy.mockReturnValue(flushPromise);
    const clickTarget = screen.getByText(/nộp & chấm/i);
    fireEvent.click(clickTarget);
    fireEvent.click(clickTarget);
    await act(async () => {
      resolveFlush({ failedQuestionKeys: [], storageUnreadable: false });
      await flush();
    });

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(h.go).toHaveBeenCalledWith("scoring");
  });

  it("does not navigate in the background after closing the modal mid-flush", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: flushPromise, resolve: resolveFlush } = promiseWithResolvers<{
      failedQuestionKeys: string[];
      storageUnreadable: boolean;
    }>();
    flushSpy.mockReturnValue(flushPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    fireEvent.click(screen.getByText("Quay lại"));
    await act(async () => {
      resolveFlush({ failedQuestionKeys: [], storageUnreadable: false });
      await flush();
    });

    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).not.toHaveBeenCalled();
  });

  it("navigates to scoring when the modal closes mid-submit but the submit succeeds", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: submitPromise, resolve: resolveSubmit } = promiseWithResolvers<{ success: boolean }>();
    submitSpy.mockReturnValue(submitPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();
    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Đang nộp…/)).toBeTruthy();

    fireEvent.click(screen.getByText("Quay lại"));
    await act(async () => {
      resolveSubmit({ success: true });
      await flush();
    });

    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
  });

  it("discards a failed submit silently when the modal is closed mid-submit", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: submitPromise, reject: rejectSubmit } = promiseWithResolvers<{ success: boolean }>();
    submitSpy.mockReturnValue(submitPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();
    expect(screen.getByText(/Đang nộp…/)).toBeTruthy();

    fireEvent.click(screen.getByText("Quay lại"));
    await act(async () => {
      rejectSubmit(new Error("network down"));
      await flush();
    });

    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(screen.queryByText(/Vẫn chưa nộp được bài/)).toBeNull();

    // Reopening the review after the silent discard must not resurrect the error.
    fireEvent.click(screen.getByText(/Hoàn thành|Về danh sách nộp/));
    await flush();
    expect(screen.queryByText(/Vẫn chưa nộp được bài/)).toBeNull();
  });

  it("never navigates after exiting the exam mid-submit", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: submitPromise, resolve: resolveSubmit } = promiseWithResolvers<{ success: boolean }>();
    submitSpy.mockReturnValue(submitPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();
    expect(screen.getByText(/Đang nộp…/)).toBeTruthy();

    fireEvent.click(screen.getAllByText("Thoát")[0]!);
    await flush();
    // The header trigger only opens ExitExamModal; confirm the exit there.
    fireEvent.click(screen.getAllByText("Thoát").at(-1)!);
    await flush();
    expect(h.go).toHaveBeenCalledWith("select");

    await act(async () => {
      resolveSubmit({ success: true });
      await flush();
    });
    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).not.toHaveBeenCalled();
  });

  it("never submits after exiting the exam mid-flush", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: flushPromise, resolve: resolveFlush } = promiseWithResolvers<{
      failedQuestionKeys: string[];
      storageUnreadable: boolean;
    }>();
    flushSpy.mockReturnValue(flushPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    expect(screen.getByText(/Đang tải lên bản ghi…/)).toBeTruthy();

    fireEvent.click(screen.getAllByText("Thoát")[0]!);
    await flush();
    fireEvent.click(screen.getAllByText("Thoát").at(-1)!);
    await flush();
    expect(h.go).toHaveBeenCalledWith("select");

    await act(async () => {
      resolveFlush({ failedQuestionKeys: [], storageUnreadable: false });
      await flush();
    });
    expect(submitSpy).not.toHaveBeenCalled();
    expect(h.go).not.toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).not.toHaveBeenCalled();
  });

  it("resumes submitting normally after abandoning a slow flush", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-mock" });
    const h = renderWithApp(<ExamScreen />, { mode: "p1" });
    await flush();

    for (let k = 0; k < 4; k += 1) answerStep();
    const { promise: flushPromise, resolve: resolveFlush } = promiseWithResolvers<{
      failedQuestionKeys: string[];
      storageUnreadable: boolean;
    }>();
    flushSpy.mockReturnValueOnce(flushPromise);
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    fireEvent.click(screen.getByText("Quay lại"));

    // Reopen the review and submit again: the abandoned run must not brick the button.
    fireEvent.click(screen.getByText(/Hoàn thành|Về danh sách nộp/));
    fireEvent.click(screen.getByText(/nộp & chấm/i));
    await flush();

    expect(flushSpy).toHaveBeenCalledTimes(2);
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(
      h.go.mock.calls.filter(([target]) => target === "scoring"),
    ).toHaveLength(1);

    // The abandoned flush settles afterwards and must not navigate either.
    await act(async () => {
      resolveFlush({ failedQuestionKeys: [], storageUnreadable: false });
      await flush();
    });
    expect(
      h.go.mock.calls.filter(([target]) => target === "scoring"),
    ).toHaveLength(1);
  });

  it("uploads a session-id recording under the real attempt once attempt.start answers", async () => {
    const { promise: startPromise, resolve: resolveStart } = promiseWithResolvers<{ attemptId: string }>();
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
    const { promise: stopPromise, resolve: resolveStop } = promiseWithResolvers<{
      blob: Blob;
      durationMs: number;
      mimeType: string;
    }>();
    const { promise: startPromise, resolve: resolveStart } = promiseWithResolvers<{ attemptId: string }>();
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
    startSpy.mockReturnValue(promiseWithResolvers<{ attemptId: string }>().promise);
    renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    await flush();
    expect(trackUploadSpy).not.toHaveBeenCalled();
    expect(saveAudioSpy).toHaveBeenCalledTimes(1);
  });

  it("backfills from the resumed active attempt (attempt.getActive)", async () => {
    const { promise: activePromise, resolve: resolveActive } = promiseWithResolvers<unknown>();
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
    const { promise: startPromise, resolve: resolveStart } = promiseWithResolvers<{ attemptId: string }>();
    const { promise: stop1Promise, resolve: resolveStop1 } = promiseWithResolvers<{
      blob: Blob;
      durationMs: number;
      mimeType: string;
    }>();
    const { promise: stop2Promise, resolve: resolveStop2 } = promiseWithResolvers<{
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
    const { promise: startPromise, resolve: resolveStart } = promiseWithResolvers<{ attemptId: string }>();
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
    startSpy.mockReturnValue(promiseWithResolvers<{ attemptId: string }>().promise);
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    await flush();
    expect(saveAudioSpy).toHaveBeenCalledTimes(1);

    h.unmount();
    expect(deleteAudioSpy).not.toHaveBeenCalled();
  });

  it("fails the attempt sync after ~15s when attempt.start never answers", async () => {
    startSpy.mockReturnValue(promiseWithResolvers<{ attemptId: string }>().promise);
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    const lockButton = screen.getByText(/đang đồng bộ phiên thi/i);
    expect(lockButton).toHaveProperty("disabled", true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    await flush();
    const submitButton = screen.getByText(/nộp & chấm/i);
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);
    expect(h.state().scoringAttempt).toBeNull();
    expect(h.go).toHaveBeenCalledWith("scoring");
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("applies a late attempt id after the sync timeout already failed", async () => {
    const { promise: startPromise, resolve: resolveStart } = promiseWithResolvers<{ attemptId: string }>();
    startSpy.mockReturnValue(startPromise);
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE });
    await flush();

    answerStep();
    await flush();
    expect(saveAudioSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    await flush();
    // The unlock must land before the id does — this assertion is red until
    // the timer exists (pre-fix the button is still locked here).
    const submitButton = screen.getByText(/nộp & chấm/i);
    expect(submitButton).toHaveProperty("disabled", false);

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
    });

    const settledButton = screen.getByText(/nộp & chấm/i);
    fireEvent.click(settledButton);
    expect(h.state().scoringAttempt).toEqual({ attemptId: "att-late", submitted: false });
  });

  it("keeps attempt ready past the timeout once the bootstrap settled", async () => {
    startSpy.mockResolvedValue({ attemptId: "att-fast" });
    renderWithApp(<SessionProbe />);
    await flush();
    expect(screen.getByTestId("attempt-status").textContent).toBe("ready");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(screen.getByTestId("attempt-status").textContent).toBe("ready");
  });

  it("fails the attempt sync after ~15s when attempt.getActive never answers", async () => {
    getActiveSpy.mockReturnValue(promiseWithResolvers<unknown>().promise);
    renderWithApp(<SessionProbe />);
    await flush();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(screen.getByTestId("attempt-status").textContent).toBe("failed");
  });
});

function SessionProbe() {
  const session = useExamSession();
  return <span data-testid="attempt-status">{session.attemptStatus}</span>;
}

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
