import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PreSubmitModal } from "../pre-submit-modal";
import type { ExamAnswer, ExamStep } from "../../use-exam-session";

const steps: ExamStep[] = [{ key: "p1-0", part: 1, text: "Are you a tidy person?", answer: "Yes I am quite tidy." }];
const answers: Record<string, ExamAnswer> = { "p1-0": { secs: 4, words: 5 } };

function renderModal(overrides: Partial<Parameters<typeof PreSubmitModal>[0]> = {}) {
  const handlers = {
    onSubmit: vi.fn(),
    onSubmitAnyway: vi.fn(),
    onRetry: vi.fn(),
  };
  render(
    <PreSubmitModal
      open
      onClose={() => {}}
      steps={steps}
      answers={answers}
      short={() => true}
      flaggedCount={1}
      onRetry={handlers.onRetry}
      onSubmit={handlers.onSubmit}
      onSubmitAnyway={handlers.onSubmitAnyway}
      {...overrides}
    />,
  );
  return handlers;
}

describe("PreSubmitModal submit states", () => {
  it("disables every answer-changing control while flushing but keeps the way out", () => {
    renderModal({ submitPhase: "flushing" });

    expect(screen.getByText("Nói lại")).toHaveProperty("disabled", true);
    expect(screen.getByText("Quay lại")).toHaveProperty("disabled", false);
    expect(screen.getByText(/Đang tải lên bản ghi…/)).toHaveProperty("disabled", true);
  });

  it("shows the submitting label and keeps retry locked but the way out open", () => {
    renderModal({ submitPhase: "submitting" });

    expect(screen.getByText("Nói lại")).toHaveProperty("disabled", true);
    expect(screen.getByText("Quay lại")).toHaveProperty("disabled", false);
    expect(screen.getByText(/Đang nộp…/)).toHaveProperty("disabled", true);
  });

  it("offers only a retry for missing answers", () => {
    const { onSubmit } = renderModal({ submitError: "Vẫn chưa tải lên được một số câu trả lời." });

    expect(screen.getByText("Vẫn chưa tải lên được một số câu trả lời.")).toBeTruthy();
    expect(screen.queryByText("Vẫn nộp")).toBeNull();
    fireEvent.click(screen.getByText("Thử lại"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("offers submit anyway when the storage warning is actionable", () => {
    const { onSubmit, onSubmitAnyway } = renderModal({ allowSubmitAnyway: true });

    expect(
      screen.getByText(
        "Chưa đọc được bản ghi trên thiết bị nên chưa chắc bài đã đủ. Bạn vẫn có thể nộp những gì máy chủ đã nhận.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Thử lại"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Vẫn nộp"));
    expect(onSubmitAnyway).toHaveBeenCalledTimes(1);
  });
});
