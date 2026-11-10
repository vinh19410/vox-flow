import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const submitSpy = vi.fn();
const statusSpy = vi.fn();
const retrySpy = vi.fn();
const flushSpy = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    attempt: { submit: { mutate: (...a: unknown[]) => submitSpy(...a) } },
    scoring: {
      status: { query: (...a: unknown[]) => statusSpy(...a) },
      retry: { mutate: (...a: unknown[]) => retrySpy(...a) },
    },
  },
}));

vi.mock("@/features/exam/answer-uploads", () => ({
  flushAnswerUploads: (...a: unknown[]) => flushSpy(...a),
}));

import { renderWithApp } from "@/test/harness";

import { ScoringScreen } from "../scoring-screen";
import {
  ATTEMPT_ALREADY_SUBMITTED_MESSAGE,
  DAILY_RETRY_LIMIT_EXCEEDED,
  MAX_POLL_ERRORS,
  POLL_BACKOFF_INTERVAL_MS,
  POLL_INTERVAL_MS,
  POLL_MAX_INTERVAL_MS,
  pollDelayMs,
  RETRY_LIMIT_EXCEEDED,
  SLOW_SCORING_AFTER_MS,
} from "../use-scoring-job";

const ATTEMPT = "att-forecast-1";
const st = (status: string, scorable = true, extra: Record<string, unknown> = {}) => ({
  attemptId: ATTEMPT,
  status,
  scorable,
  manualRetries: 0,
  canRetry: true,
  ...extra,
});

/** Flushes pending promises, then advances the poll timer. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("ScoringScreen (forecast practice scoring)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    submitSpy.mockReset();
    statusSpy.mockReset();
    retrySpy.mockReset();
    flushSpy.mockReset().mockResolvedValue({ failedQuestionKeys: [], storageUnreadable: false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("submits the attempt, polls status every interval and opens the results route on done", async () => {
    submitSpy.mockResolvedValue({ success: true });
    statusSpy
      .mockResolvedValueOnce(st("queued"))
      .mockResolvedValueOnce(st("processing"))
      .mockResolvedValueOnce(st("done"));

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
    expect(screen.getAllByTestId("scoring-step").map((n) => n.textContent)).toEqual([
      expect.stringContaining("Chuyển giọng nói thành chữ"),
      expect.stringContaining("Chấm 4 tiêu chí"),
      expect.stringContaining("Tổng hợp kết quả"),
    ]);

    await advance(0);
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
    expect(statusSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("scoring-status").textContent).toContain("chờ đến lượt");

    await advance(POLL_INTERVAL_MS);
    expect(statusSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("scoring-status").textContent).toContain("đang phân tích");
    expect(h.goResult).not.toHaveBeenCalled();

    await advance(POLL_INTERVAL_MS);
    expect(statusSpy).toHaveBeenCalledTimes(3);
    expect(h.goResult).toHaveBeenCalledWith(ATTEMPT, { replace: true });
    expect(h.state().scoringAttempt).toBeNull();

    await advance(POLL_INTERVAL_MS * 3);
    expect(statusSpy).toHaveBeenCalledTimes(3);
  });

  it("waits for answer uploads to finish before submitting", async () => {
    let finish!: (r: { failedQuestionKeys: string[]; storageUnreadable: boolean }) => void;
    flushSpy.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    submitSpy.mockResolvedValue({ success: true });
    statusSpy.mockResolvedValue(st("queued"));

    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(flushSpy).toHaveBeenCalledWith(ATTEMPT);
    expect(submitSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();

    await act(async () => finish({ failedQuestionKeys: [], storageUnreadable: false }));
    await advance(0);
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
  });

  it("does not submit when a recording failed to upload, and resends it on demand", async () => {
    flushSpy
      .mockResolvedValueOnce({ failedQuestionKeys: ["q2"], storageUnreadable: false })
      .mockResolvedValueOnce({ failedQuestionKeys: ["q2"], storageUnreadable: false })
      .mockResolvedValueOnce({ failedQuestionKeys: [], storageUnreadable: false });
    submitSpy.mockResolvedValue({ success: true });
    statusSpy.mockResolvedValue(st("queued"));

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.getByTestId("scoring-upload-error")).toBeTruthy();
    expect(screen.getByText(/1 câu trả lời chưa tải lên được/)).toBeTruthy();
    expect(submitSpy).not.toHaveBeenCalled();
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: false });

    // Still failing: stays on the error with a message, nothing submitted.
    fireEvent.click(screen.getByText("Gửi lại"));
    await advance(0);
    expect(screen.getByRole("alert").textContent).toContain("chưa tải lên được");
    expect(submitSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Gửi lại"));
    await advance(0);
    expect(flushSpy).toHaveBeenCalledTimes(3);
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
  });

  it("lets the learner submit without the recordings that keep failing", async () => {
    flushSpy.mockResolvedValue({ failedQuestionKeys: ["q1", "q2"], storageUnreadable: false });
    submitSpy.mockResolvedValue({ success: true });
    statusSpy.mockResolvedValue(st("queued"));

    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.getByText(/2 câu trả lời chưa tải lên được/)).toBeTruthy();

    fireEvent.click(screen.getByText("Bỏ qua câu bị lỗi và nộp bài"));
    await advance(0);
    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
  });

  it("does not submit when the recordings kept on the device could not be read", async () => {
    flushSpy.mockResolvedValue({ failedQuestionKeys: [], storageUnreadable: true });
    submitSpy.mockResolvedValue({ success: true });

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.getByTestId("scoring-upload-error")).toBeTruthy();
    expect(screen.getByText(/Chưa đọc được các bản ghi âm lưu trên thiết bị/)).toBeTruthy();
    expect(submitSpy).not.toHaveBeenCalled();
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: false });
  });

  it("offers a plain submit, not a skip, when it is unknown which recordings are missing", async () => {
    flushSpy.mockResolvedValue({ failedQuestionKeys: [], storageUnreadable: true });
    submitSpy.mockResolvedValue({ success: true });
    statusSpy.mockResolvedValue(st("queued"));

    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.queryByText("Bỏ qua câu bị lỗi và nộp bài")).toBeNull();

    fireEvent.click(screen.getByText("Vẫn nộp bài"));
    await advance(0);
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
  });

  it("never mentions multiple runs while scoring", async () => {
    statusSpy.mockResolvedValue(st("processing"));
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    expect(document.body.textContent).not.toMatch(/lần chấm|lượt chấm|3 lần/i);
  });

  it("stops polling on unmount", async () => {
    statusSpy.mockResolvedValue(st("processing"));
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    expect(submitSpy).not.toHaveBeenCalled();
    expect(statusSpy).toHaveBeenCalledTimes(1);
    h.unmount();
    await advance(POLL_INTERVAL_MS * 4);
    expect(statusSpy).toHaveBeenCalledTimes(1);
  });

  it("shows the failed state with Chấm lại, which calls scoring.retry and resumes polling", async () => {
    statusSpy.mockResolvedValueOnce(st("failed")).mockResolvedValueOnce(st("queued")).mockResolvedValueOnce(st("done"));
    retrySpy.mockResolvedValue(st("queued"));

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    expect(screen.getByTestId("scoring-failed")).toBeTruthy();
    expect(screen.getByText("Chấm điểm chưa thành công")).toBeTruthy();

    await advance(POLL_INTERVAL_MS * 2);
    expect(statusSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Chấm lại"));
    await advance(0);
    expect(retrySpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
    expect(statusSpy).toHaveBeenCalledTimes(2);

    await advance(POLL_INTERVAL_MS);
    expect(h.goResult).toHaveBeenCalledWith(ATTEMPT, { replace: true });
  });

  it("keeps the failed state and shows an error when retry itself fails", async () => {
    statusSpy.mockResolvedValue(st("failed"));
    retrySpy.mockRejectedValue(new Error("network"));
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    fireEvent.click(screen.getByText("Chấm lại"));
    await advance(0);
    expect(screen.getByRole("alert").textContent).toContain("Chưa gửi được yêu cầu chấm lại");
    expect(screen.getByTestId("scoring-failed")).toBeTruthy();
    fireEvent.click(screen.getByText("Về trang chủ"));
    expect(h.go).toHaveBeenCalledWith("dashboard");
  });

  it("disables Chấm lại and explains the exhausted per-attempt retry when canRetry is false", async () => {
    statusSpy.mockResolvedValue(st("failed", true, { manualRetries: 1, canRetry: false }));
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    expect(screen.getByTestId("scoring-failed")).toBeTruthy();
    expect(
      screen.getByText("Bài thi đã được thử lại tối đa 1 lần. Vui lòng tạo bài luyện tập mới."),
    ).toBeTruthy();

    const retryButton = screen.getByRole("button", { name: "Chấm lại" }) as HTMLButtonElement;
    expect(retryButton.disabled).toBe(true);
    fireEvent.click(retryButton);
    await advance(0);
    expect(retrySpy).not.toHaveBeenCalled();
  });

  it("disables Chấm lại and shows the daily-quota message when only the daily limit is exhausted", async () => {
    statusSpy.mockResolvedValue(st("failed", true, { manualRetries: 0, canRetry: false }));
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    expect(screen.getByTestId("scoring-failed")).toBeTruthy();
    expect(
      screen.getByText("Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai."),
    ).toBeTruthy();
    expect(
      screen.queryByText("Bài thi đã được thử lại tối đa 1 lần. Vui lòng tạo bài luyện tập mới."),
    ).toBeNull();

    const retryButton = screen.getByRole("button", { name: "Chấm lại" }) as HTMLButtonElement;
    expect(retryButton.disabled).toBe(true);
    fireEvent.click(retryButton);
    await advance(0);
    expect(retrySpy).not.toHaveBeenCalled();
  });

  it("maps the daily retry quota error to a clear daily message", async () => {
    statusSpy.mockResolvedValue(st("failed"));
    retrySpy.mockRejectedValue(
      Object.assign(new Error(DAILY_RETRY_LIMIT_EXCEEDED), { data: { code: "TOO_MANY_REQUESTS" } }),
    );
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    fireEvent.click(screen.getByText("Chấm lại"));
    await advance(0);
    expect(screen.getByRole("alert").textContent).toContain("3 lần thử lại trong ngày");
    expect(screen.getByTestId("scoring-failed")).toBeTruthy();
  });

  it("maps the per-attempt retry quota error to an out-of-retries message", async () => {
    statusSpy.mockResolvedValue(st("failed"));
    retrySpy.mockRejectedValue(
      Object.assign(new Error(RETRY_LIMIT_EXCEEDED), { data: { code: "BAD_REQUEST" } }),
    );
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    fireEvent.click(screen.getByText("Chấm lại"));
    await advance(0);
    expect(screen.getByRole("alert").textContent).toContain("hết số lần thử lại cho phép");
    expect(screen.getByTestId("scoring-failed")).toBeTruthy();
  });

  it("surfaces a failed submit with a resend action instead of spinning", async () => {
    submitSpy.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ success: true });
    statusSpy.mockResolvedValueOnce(st("not_scored")).mockResolvedValue(st("queued"));

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.getByTestId("scoring-submit-error")).toBeTruthy();
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: false });

    fireEvent.click(screen.getByText("Gửi lại"));
    await advance(0);
    expect(submitSpy).toHaveBeenCalledTimes(2);
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
  });

  describe("resend after a submit whose response was lost", () => {
    /**
     * Mirrors the server once the first submit committed: submit rejects as
     * already submitted, status reports the score row, and retry only accepts
     * a failed or unscored attempt (packages/api/src/routers/scoring.ts).
     * The client only auto-retries the unscored rescue path; a failed attempt
     * keeps its retry budget for an explicit "Chấm lại".
     */
    function serverAlreadySubmitted(initial: "queued" | "processing" | "done" | "failed" | "not_scored") {
      let score = initial;
      submitSpy
        .mockRejectedValueOnce(new Error("response lost"))
        .mockRejectedValue(Object.assign(new Error(ATTEMPT_ALREADY_SUBMITTED_MESSAGE), { data: { code: "BAD_REQUEST" } }));
      // The recovery check right after the lost submit also fails, so the screen shows the resend action.
      statusSpy.mockRejectedValueOnce(new Error("offline")).mockImplementation(async () => st(score));
      retrySpy.mockImplementation(async () => {
        if (score !== "failed" && score !== "not_scored") {
          throw Object.assign(new Error("Only a failed or unscored attempt can be retried"), {
            data: { code: "BAD_REQUEST" },
          });
        }
        score = "queued";
        return st("queued");
      });
    }

    async function renderAndResend() {
      const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
      await advance(0);
      expect(screen.getByTestId("scoring-submit-error")).toBeTruthy();
      fireEvent.click(screen.getByText("Gửi lại"));
      await advance(0);
      return h;
    }

    it.each(["queued", "processing"] as const)("resumes polling without a retry when scoring is %s", async (status) => {
      serverAlreadySubmitted(status);
      const h = await renderAndResend();
      expect(retrySpy).not.toHaveBeenCalled();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByTestId("scoring-progress")).toBeTruthy();
      expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
    });

    it("opens the results when scoring already finished", async () => {
      serverAlreadySubmitted("done");
      const h = await renderAndResend();
      expect(retrySpy).not.toHaveBeenCalled();
      expect(h.goResult).toHaveBeenCalledWith(ATTEMPT, { replace: true });
    });

    it("re-enqueues scoring when it is not_scored", async () => {
      serverAlreadySubmitted("not_scored");
      const h = await renderAndResend();
      expect(retrySpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByTestId("scoring-progress")).toBeTruthy();
      expect(screen.getByTestId("scoring-status").textContent).toContain("chờ đến lượt");
      expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
    });

    it("shows the failed state directly without spending a retry when scoring failed", async () => {
      serverAlreadySubmitted("failed");
      const h = await renderAndResend();
      expect(retrySpy).not.toHaveBeenCalled();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByTestId("scoring-failed")).toBeTruthy();
      expect(screen.getByText("Chấm điểm chưa thành công")).toBeTruthy();
      expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
    });
  });

  it("does not re-enqueue scoring for other BAD_REQUEST rejections of a resend", async () => {
    submitSpy
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(Object.assign(new Error("Attempt is abandoned"), { data: { code: "BAD_REQUEST" } }));
    statusSpy.mockResolvedValue(st("not_scored"));

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    fireEvent.click(screen.getByText("Gửi lại"));
    await advance(0);
    expect(retrySpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("scoring-submit-error")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Vẫn chưa gửi được bài");
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: false });
  });

  it("continues polling when a submit error hides a submit that actually succeeded", async () => {
    submitSpy.mockRejectedValue(new Error("response lost"));
    statusSpy.mockResolvedValue(st("queued"));
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.queryByTestId("scoring-submit-error")).toBeNull();
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
    const job = h.state().scoringAttempt;
    expect(job?.kind === "attempt" && job.submitted).toBe(true);
  });

  it("backs off polling over time", () => {
    expect(pollDelayMs(0)).toBe(POLL_INTERVAL_MS);
    expect(pollDelayMs(59_999)).toBe(POLL_INTERVAL_MS);
    expect(pollDelayMs(60_000)).toBe(POLL_BACKOFF_INTERVAL_MS);
    expect(pollDelayMs(3 * 60_000)).toBe(POLL_MAX_INTERVAL_MS);
    expect(pollDelayMs(9 * 60_000)).toBe(POLL_MAX_INTERVAL_MS);
  });

  it("polls less often after the first minute and stops with a slow state after the limit", async () => {
    statusSpy.mockResolvedValue(st("processing"));
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    // First minute at the fast interval: the initial check plus one per interval.
    await advance(60_000);
    const afterFirstMinute = statusSpy.mock.calls.length;
    expect(afterFirstMinute).toBe(1 + 60_000 / POLL_INTERVAL_MS);

    await advance(60_000);
    expect(statusSpy.mock.calls.length - afterFirstMinute).toBeLessThanOrEqual(60_000 / POLL_BACKOFF_INTERVAL_MS + 1);

    await advance(SLOW_SCORING_AFTER_MS);
    expect(screen.getByTestId("scoring-slow")).toBeTruthy();
    expect(screen.getByText("Đang chậm hơn bình thường")).toBeTruthy();
    const callsWhenSlow = statusSpy.mock.calls.length;
    // Bounded total: far fewer checks than polling every 2.5s for 10 minutes.
    expect(callsWhenSlow).toBeLessThan(SLOW_SCORING_AFTER_MS / POLL_INTERVAL_MS / 2);

    await advance(POLL_MAX_INTERVAL_MS * 5);
    expect(statusSpy.mock.calls.length).toBe(callsWhenSlow);

    // Manual check resumes polling and hands off once done.
    statusSpy.mockResolvedValue(st("done"));
    fireEvent.click(screen.getByText("Kiểm tra lại"));
    await advance(0);
    expect(statusSpy.mock.calls.length).toBe(callsWhenSlow + 1);
    expect(screen.queryByTestId("scoring-slow")).toBeNull();
  });

  it("asks to retry after repeated status errors and resumes polling on demand", async () => {
    statusSpy.mockRejectedValue(new Error("offline"));
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    await advance(POLL_INTERVAL_MS * (MAX_POLL_ERRORS - 1));
    expect(screen.getByTestId("scoring-connection-error")).toBeTruthy();
    expect(statusSpy).toHaveBeenCalledTimes(MAX_POLL_ERRORS);

    statusSpy.mockResolvedValue(st("processing"));
    fireEvent.click(screen.getByText("Thử lại"));
    await advance(0);
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
  });

  it("falls back to the recorded state when the server says the attempt is not scorable", async () => {
    statusSpy.mockResolvedValue(st("not_scored", false));
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "attempt", attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    expect(screen.getByText("Bài thi đã được ghi nhận!")).toBeTruthy();
    expect(h.state().scoringAttempt).toBeNull();
  });

  it("keeps the unchanged recorded state for non-forecast submissions without calling scoring", async () => {
    renderWithApp(<ScoringScreen />, {}, { pendingSubmission: true });
    await advance(POLL_INTERVAL_MS * 2);
    expect(screen.getByText("Bài thi đã được ghi nhận!")).toBeTruthy();
    expect(screen.queryByTestId("scoring-progress")).toBeNull();
    expect(submitSpy).not.toHaveBeenCalled();
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it("renders an honest local-only state instead of the recorded copy when the exam was submitted without an attempt", async () => {
    renderWithApp(<ScoringScreen />, { scoringAttempt: { kind: "local_only" } });
    await advance(0);
    expect(screen.getByText("Chưa gửi được bài thi lên máy chủ")).toBeTruthy();
    expect(screen.getByText(/lưu tạm trên thiết bị này/)).toBeTruthy();
    expect(screen.queryByText("Bài thi đã được ghi nhận!")).toBeNull();
    expect(screen.queryByText(/Gửi lại/)).toBeNull();
    expect(screen.getByText("Về trang chủ")).toBeTruthy();
    expect(screen.getByText("Luyện thêm đề khác")).toBeTruthy();
    // Warning icon, not the success CheckCircle2 of RecordedState.
    expect(document.querySelector(".lucide-triangle-alert")).toBeTruthy();
    expect(document.querySelector(".lucide-check-circle-2")).toBeNull();
  });
});
