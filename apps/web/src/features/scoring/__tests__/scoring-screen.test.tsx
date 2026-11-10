import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const submitSpy = vi.fn();
const statusSpy = vi.fn();
const retrySpy = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    attempt: { submit: { mutate: (...a: unknown[]) => submitSpy(...a) } },
    scoring: {
      status: { query: (...a: unknown[]) => statusSpy(...a) },
      retry: { mutate: (...a: unknown[]) => retrySpy(...a) },
    },
  },
}));

import { renderWithApp } from "@/test/harness";

import { ScoringScreen } from "../scoring-screen";
import { MAX_POLL_ERRORS, POLL_INTERVAL_MS } from "../use-scoring-job";

const ATTEMPT = "att-forecast-1";
const st = (status: string, scorable = true) => ({ attemptId: ATTEMPT, status, scorable });

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

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: false } });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
    expect(screen.getAllByTestId("scoring-step").map((n) => n.textContent)).toEqual([
      expect.stringContaining("Chuyển giọng nói thành chữ"),
      expect.stringContaining("Chấm 4 tiêu chí"),
      expect.stringContaining("Tổng hợp kết quả"),
    ]);

    await advance(0);
    expect(submitSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(h.state().scoringAttempt).toEqual({ attemptId: ATTEMPT, submitted: true });
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

  it("never mentions multiple runs while scoring", async () => {
    statusSpy.mockResolvedValue(st("processing"));
    renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    expect(document.body.textContent).not.toMatch(/lần chấm|lượt chấm|3 lần/i);
  });

  it("stops polling on unmount", async () => {
    statusSpy.mockResolvedValue(st("processing"));
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: true } });
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

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: true } });
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
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: true } });
    await advance(0);
    fireEvent.click(screen.getByText("Chấm lại"));
    await advance(0);
    expect(screen.getByRole("alert").textContent).toContain("Chưa gửi được yêu cầu chấm lại");
    expect(screen.getByTestId("scoring-failed")).toBeTruthy();
    fireEvent.click(screen.getByText("Về trang chủ"));
    expect(h.go).toHaveBeenCalledWith("dashboard");
  });

  it("surfaces a failed submit with a resend action instead of spinning", async () => {
    submitSpy.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ success: true });
    statusSpy.mockResolvedValueOnce(st("not_scored")).mockResolvedValue(st("queued"));

    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.getByTestId("scoring-submit-error")).toBeTruthy();
    expect(h.state().scoringAttempt).toEqual({ attemptId: ATTEMPT, submitted: false });

    fireEvent.click(screen.getByText("Gửi lại"));
    await advance(0);
    expect(submitSpy).toHaveBeenCalledTimes(2);
    expect(h.state().scoringAttempt).toEqual({ attemptId: ATTEMPT, submitted: true });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
  });

  it("re-enqueues scoring when a resend finds the attempt already submitted", async () => {
    submitSpy
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(Object.assign(new Error("already submitted"), { data: { code: "BAD_REQUEST" } }));
    statusSpy.mockResolvedValueOnce(st("not_scored")).mockResolvedValue(st("queued"));
    retrySpy.mockResolvedValue(st("queued"));

    renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    fireEvent.click(screen.getByText("Gửi lại"));
    await advance(0);
    expect(retrySpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
  });

  it("continues polling when a submit error hides a submit that actually succeeded", async () => {
    submitSpy.mockRejectedValue(new Error("response lost"));
    statusSpy.mockResolvedValue(st("queued"));
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: false } });
    await advance(0);
    expect(screen.queryByTestId("scoring-submit-error")).toBeNull();
    expect(screen.getByTestId("scoring-progress")).toBeTruthy();
    expect(h.state().scoringAttempt?.submitted).toBe(true);
  });

  it("asks to retry after repeated status errors and resumes polling on demand", async () => {
    statusSpy.mockRejectedValue(new Error("offline"));
    renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: true } });
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
    const h = renderWithApp(<ScoringScreen />, { scoringAttempt: { attemptId: ATTEMPT, submitted: true } });
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
});
