import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { useScoringJob } from "../use-scoring-job";

const ATTEMPT = "att-forecast-1";
const handlers = { onSubmitted: () => {}, onDone: () => {}, onNotScorable: () => {} };

describe("useScoringJob retry budget", () => {
  beforeEach(() => {
    submitSpy.mockReset();
    statusSpy.mockReset();
    retrySpy.mockReset();
    flushSpy.mockReset().mockResolvedValue({ failedQuestionKeys: [], storageUnreadable: false });
  });

  it("does not auto-retry a failed attempt after a lost submit and shows its retry budget", async () => {
    submitSpy.mockRejectedValue(
      Object.assign(new Error("Attempt is already submitted"), { data: { code: "BAD_REQUEST" } }),
    );
    statusSpy.mockResolvedValue({
      attemptId: ATTEMPT,
      status: "failed",
      scorable: true,
      manualRetries: 1,
      canRetry: false,
    });

    const { result } = renderHook(
      () => useScoringJob({ kind: "attempt", attemptId: ATTEMPT, submitted: false }, handlers),
    );

    await waitFor(() => expect(result.current.view.kind).toBe("failed"));
    // The failed view carries the server's retry budget so the screen can
    // disable "Chấm lại"; no retry mutate call is ever made on the auto path.
    expect(result.current.view).toEqual({ kind: "failed", manualRetries: 1, canRetry: false });
    expect(retrySpy).not.toHaveBeenCalled();
    expect(result.current.actionError).toBeNull();
  });

  it("carries the retry budget into the failed view when polling sees a failure", async () => {
    statusSpy.mockResolvedValue({
      attemptId: ATTEMPT,
      status: "failed",
      scorable: true,
      manualRetries: 0,
      canRetry: true,
    });

    const { result } = renderHook(
      () => useScoringJob({ kind: "attempt", attemptId: ATTEMPT, submitted: true }, handlers),
    );

    await waitFor(() => expect(result.current.view.kind).toBe("failed"));
    expect(result.current.view).toEqual({ kind: "failed", manualRetries: 0, canRetry: true });
    expect(retrySpy).not.toHaveBeenCalled();
  });

  it("surfaces the daily quota message and stays failed when the retry hits the daily limit", async () => {
    statusSpy.mockResolvedValue({
      attemptId: ATTEMPT,
      status: "failed",
      scorable: true,
      manualRetries: 0,
      canRetry: true,
    });
    retrySpy.mockRejectedValue(
      Object.assign(new Error("DAILY_RETRY_LIMIT_EXCEEDED"), { data: { code: "TOO_MANY_REQUESTS" } }),
    );

    const { result } = renderHook(
      () => useScoringJob({ kind: "attempt", attemptId: ATTEMPT, submitted: true }, handlers),
    );
    await waitFor(() => expect(result.current.view.kind).toBe("failed"));

    await act(async () => {
      await result.current.retryScoring();
    });

    expect(retrySpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(result.current.actionError).toBe(
      "Bạn đã đạt giới hạn 3 lần thử lại trong ngày. Vui lòng quay lại vào ngày mai.",
    );
    expect(result.current.view.kind).toBe("failed");
  });

  it("maps QUOTA_EXCEEDED and GLOBAL_CAP_REACHED on scoring.retry to Vietnamese quota messages", async () => {
    statusSpy.mockResolvedValue({
      attemptId: ATTEMPT,
      status: "failed",
      scorable: true,
      manualRetries: 0,
      canRetry: true,
    });

    const { result } = renderHook(
      () => useScoringJob({ kind: "attempt", attemptId: ATTEMPT, submitted: true }, handlers),
    );
    await waitFor(() => expect(result.current.view.kind).toBe("failed"));

    retrySpy.mockRejectedValueOnce(
      Object.assign(new Error("QUOTA_EXCEEDED"), { data: { code: "TOO_MANY_REQUESTS" } }),
    );
    await act(async () => {
      await result.current.retryScoring();
    });
    expect(result.current.actionError).toBe(
      "Bạn không đủ điểm miễn phí hôm nay để chấm lại bài này. Điểm sẽ đặt lại lúc 00:00 (giờ Việt Nam).",
    );
    expect(result.current.view.kind).toBe("failed");

    retrySpy.mockRejectedValueOnce(
      Object.assign(new Error("GLOBAL_CAP_REACHED"), { data: { code: "TOO_MANY_REQUESTS" } }),
    );
    await act(async () => {
      await result.current.retryScoring();
    });
    expect(result.current.actionError).toBe(
      "Hạn mức miễn phí toàn hệ thống hôm nay đã tạm đầy nên chưa thể chấm lại. Điểm miễn phí (nếu còn trong hạn mức hoàn 3 lần/ngày) được hoàn tự động; vui lòng thử lại sau 00:00 (giờ Việt Nam) hoặc nâng cấp gói trả phí.",
    );
    expect(result.current.view.kind).toBe("failed");
  });

  it("shows QUOTA_SUBMIT_CAP_MESSAGE with submit_error view when attempt.submit hits GLOBAL_CAP_REACHED", async () => {
    submitSpy.mockRejectedValueOnce(
      Object.assign(new Error("GLOBAL_CAP_REACHED"), { data: { code: "TOO_MANY_REQUESTS" } }),
    );

    const { result } = renderHook(
      () => useScoringJob({ kind: "attempt", attemptId: ATTEMPT, submitted: false }, handlers),
    );

    await waitFor(() => expect(result.current.view).toEqual({ kind: "submit_error" }));
    expect(result.current.actionError).toBe(
      "Hạn mức miễn phí hôm nay đã chạm trần khi nộp bài. Bản ghi âm của bạn vẫn được giữ nguyên — vui lòng nộp lại sau 00:00 (giờ Việt Nam) hoặc nâng cấp gói trả phí.",
    );
  });
});
