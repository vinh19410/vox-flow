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

vi.mock("../answer-uploads", () => ({
  trackAnswerUpload: (...a: unknown[]) => trackUploadSpy(...a),
}));

vi.mock("@/hooks/use-recorder", () => ({
  useRecorder: () => ({
    status: "idle",
    isRecording: false,
    mimeType: "audio/webm",
    start: async () => true,
    stop: async () => ({ blob: recordedBlob, durationMs: 4000, mimeType: "audio/webm" }),
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
