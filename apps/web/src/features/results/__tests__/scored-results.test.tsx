import type { ScoringResult } from "@vox-flow/api/scoring/types";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const statusSpy = vi.fn();
const getResultSpy = vi.fn();
const retrySpy = vi.fn();
const disputeGetSpy = vi.fn();
const attemptStartSpy = vi.fn();

// FEATURES.scoring stays at its beta default (off): real results must render regardless.
vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    attempt: {
      start: { mutate: (...a: unknown[]) => attemptStartSpy(...a) },
    },
    scoring: {
      status: { query: (...a: unknown[]) => statusSpy(...a) },
      getResult: { query: (...a: unknown[]) => getResultSpy(...a) },
      retry: { mutate: (...a: unknown[]) => retrySpy(...a) },
    },
    dispute: { get: { query: (...a: unknown[]) => disputeGetSpy(...a) } },
  },
}));

import { FEATURES } from "@/lib/feature-flags";
import { renderWithApp } from "@/test/harness";

import { ResultsScreen } from "../results-screen";

const ATTEMPT = "att-scored-1";

const RESULT: ScoringResult = {
  attemptId: ATTEMPT,
  topicId: "p1-tidiness",
  overall: 6.5,
  range: [6.0, 7.0],
  locked: false,
  weakestQuestionKey: "q2",
  retakeOfAttemptId: null,
  previousOverall: null,
  oneLiner: "Trả lời trôi chảy, cần đa dạng cấu trúc câu hơn.",
  criteria: [
    {
      key: "P",
      band: 6,
      summary: "Phát âm rõ phần lớn thời gian.",
      evidence: [],
      improve: [],
    },
    {
      key: "FC",
      band: 7,
      summary: "Nói liền mạch, ít ngập ngừng.",
      evidence: [
        { quote: "I always keep my desk tidy", questionKey: "q1", where: "Part 1 · Câu 1", kind: "plus", note: "Câu mở rõ ý." },
      ],
      improve: [],
    },
    {
      key: "LR",
      band: 6.5,
      summary: "Từ vựng đủ dùng cho chủ đề quen thuộc.",
      evidence: [
        { quote: "very very messy", questionKey: "q2", where: "Part 1 · Câu 2", kind: "minus", note: "Lặp từ nhấn mạnh." },
      ],
      improve: [{ from: "very very messy", to: "chaotic", why: "Dùng một tính từ mạnh thay vì lặp lại." }],
    },
    {
      key: "GRA",
      band: 5.5,
      summary: "Chủ yếu dùng câu đơn, còn lỗi chia thì.",
      evidence: [
        { quote: "when I was child I keep", questionKey: "q2", where: "Part 1 · Câu 2", kind: "minus", note: "Thiếu mạo từ và sai thì quá khứ." },
      ],
      improve: [{ from: "when I was child I keep", to: "when I was a child, I kept", why: "Mạo từ và thì quá khứ." }],
    },
  ],
  answers: [
    { questionKey: "q1", questionText: "Are you a tidy person?", partNumber: 1, durationMs: 21000, transcript: "Yes, I always keep my desk tidy." },
    { questionKey: "q2", questionText: "Were you tidy as a child?", partNumber: 1, durationMs: 18000, transcript: "Not really, when I was child I keep my room very very messy." },
  ],
  scoredAt: Date.UTC(2026, 10, 9),
};

const status = (
  s: string,
  scorable = true,
  attemptStatus: "in_progress" | "submitted" | "abandoned" = "submitted",
) => ({ attemptId: ATTEMPT, status: s, scorable, attemptStatus });

describe("ResultsScreen with real scoring data", () => {
  beforeEach(() => {
    statusSpy.mockReset();
    getResultSpy.mockReset();
    retrySpy.mockReset();
    disputeGetSpy.mockReset().mockResolvedValue({ enabled: false, dispute: null });
    attemptStartSpy.mockReset();
  });

  it("keeps the beta flag off in this suite", () => {
    expect(FEATURES.scoring).toBe(false);
  });

  it("renders real bands, confidence range, criteria evidence and transcripts without per-run panels when unlocked", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(RESULT);
    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(screen.getByTestId("results-loading")).toBeTruthy();
    expect(await screen.findByText("Bạn đạt band 6.5")).toBeTruthy();
    expect(getResultSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(screen.getByText(RESULT.oneLiner)).toBeTruthy();
    expect(screen.getByText("Khoảng tin cậy")).toBeTruthy();
    expect(screen.getByText("6.0 – 7.0")).toBeTruthy();

    // Criteria grid shows all four real bands, unlocked.
    for (const [label, band] of [
      ["Độ trôi chảy & mạch lạc", "7.0"],
      ["Vốn từ vựng", "6.5"],
      ["Phát âm", "6.0"],
    ] as const) {
      const card = screen.getByText(label).closest("button") as HTMLElement;
      expect(card.textContent).toContain(band);
    }
    expect(screen.queryByText("Mở khóa chi tiết →")).toBeNull();
    expect(screen.queryByText("Xem vì sao bạn được từng band")).toBeNull();
    expect(screen.queryByText(/Mở khóa từ/)).toBeNull();
    expect(screen.queryByTestId("weakest-question-card")).toBeNull();

    // Default selection (GRA) shows real summary, verbatim evidence with its location, and improvements.
    expect(screen.getByText("Chủ yếu dùng câu đơn, còn lỗi chia thì.")).toBeTruthy();
    expect(screen.getByText("“when I was child I keep”")).toBeTruthy();
    expect(screen.getAllByText("Part 1 · Câu 2").length).toBeGreaterThan(0);
    expect(screen.getByText("when I was a child, I kept")).toBeTruthy();

    fireEvent.click(screen.getByText("Độ trôi chảy & mạch lạc"));
    expect(screen.getByText("“I always keep my desk tidy”")).toBeTruthy();
    expect(h.openPaywall).not.toHaveBeenCalled();

    // No raw run count or per-run median strip anywhere.
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Chấm 3 lần|trung vị|Chênh lệch giữa các lần/i);

    fireEvent.click(screen.getByText("Xem lại từng câu"));
    expect(screen.getByText("Were you tidy as a child?")).toBeTruthy();
    expect(screen.getByText("Not really, when I was child I keep my room very very messy.")).toBeTruthy();
    expect(screen.getAllByText(/^Part 1 · Câu [12]$/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Mở khóa đánh dấu lỗi")).toBeNull();
    expect(screen.queryByLabelText("Phát lại")).toBeNull();
  });

  it("enforces server locked state: renders range and unblurred weakest question card while gating criteria", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue({
      attemptId: ATTEMPT,
      topicId: "p1-tidiness",
      overall: 6.5,
      range: [6.0, 7.0],
      locked: true,
      weakestQuestionKey: "q2",
      retakeOfAttemptId: null,
      previousOverall: null,
      oneLiner: RESULT.oneLiner,
      criteria: [
        { key: "FC", evidence: [], improve: [] },
        {
          key: "LR",
          evidence: [
            { quote: "very very messy", questionKey: "q2", where: "Part 1 · Câu 2", kind: "minus", note: "Lặp từ nhấn mạnh." },
          ],
          improve: [{ from: "very very messy", to: "chaotic", why: "Dùng một tính từ mạnh thay vì lặp lại." }],
        },
        {
          key: "GRA",
          evidence: [
            { quote: "when I was child I keep", questionKey: "q2", where: "Part 1 · Câu 2", kind: "minus", note: "Thiếu mạo từ." },
          ],
          improve: [{ from: "when I was child I keep", to: "when I was a child, I kept", why: "Mạo từ và thì quá khứ." }],
        },
        { key: "P", evidence: [], improve: [] },
      ],
      answers: [RESULT.answers[1]!],
      scoredAt: RESULT.scoredAt,
    } satisfies ScoringResult);

    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);
    expect(await screen.findByText("Bạn đạt band 6.5")).toBeTruthy();
    expect(screen.getByText("Khoảng tin cậy")).toBeTruthy();
    expect(screen.getByText("6.0 – 7.0")).toBeTruthy();

    // Locked criteria show placeholder dash and open paywall on click.
    for (const label of ["Độ trôi chảy & mạch lạc", "Vốn từ vựng", "Ngữ pháp", "Phát âm"]) {
      const card = screen
        .getAllByText(label)
        .map((el) => el.closest("button"))
        .find((btn): btn is HTMLButtonElement => btn !== null);
      expect(card).toBeTruthy();
      expect(card!.textContent).toContain("—");
      expect(card!.textContent).toContain("Mở khóa chi tiết →");
    }
    fireEvent.click(screen.getByText("Độ trôi chảy & mạch lạc"));
    expect(h.openPaywall).toHaveBeenCalledTimes(1);

    // Weakest question card is visible and unblurred above SoftPaywall.
    const weakestCard = screen.getByTestId("weakest-question-card");
    expect(weakestCard.textContent).toContain("Were you tidy as a child?");
    expect(weakestCard.textContent).toContain("when I was child I keep");
    expect(weakestCard.textContent).toContain("when I was a child, I kept");
    expect(weakestCard.className).not.toContain("pointer-events-none");
    expect(screen.getByText("Xem vì sao bạn được từng band")).toBeTruthy();

    fireEvent.click(screen.getByText("Xem lại từng câu"));
    expect(screen.getByText("Were you tidy as a child?")).toBeTruthy();
    expect(screen.queryByText("Are you a tidy person?")).toBeNull();
    expect(screen.getByText("Xem vì sao bạn được từng band")).toBeTruthy();
  });

  it("links back to the scoring screen while scoring is still in progress", async () => {
    statusSpy.mockResolvedValue(status("processing"));
    getResultSpy.mockResolvedValue(null);
    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId("results-scoring")).toBeTruthy();
    fireEvent.click(screen.getByText("Xem tiến trình chấm"));
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
    expect(h.go).toHaveBeenCalledWith("scoring");
  });

  it("offers Chấm lại for a failed attempt and hands off to the scoring screen", async () => {
    statusSpy.mockResolvedValue(status("failed"));
    getResultSpy.mockResolvedValue(null);
    retrySpy.mockResolvedValue(status("queued"));
    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId("results-failed")).toBeTruthy();
    fireEvent.click(screen.getByText("Chấm lại"));
    await waitFor(() => expect(h.go).toHaveBeenCalledWith("scoring"));
    expect(retrySpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
  });

  it("offers Chấm điểm ngay when a submitted attempt is not_scored yet", async () => {
    statusSpy.mockResolvedValue(status("not_scored", true));
    getResultSpy.mockResolvedValue(null);
    retrySpy.mockResolvedValue(status("queued"));
    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId("results-not-scored")).toBeTruthy();
    fireEvent.click(screen.getByText("Chấm điểm ngay"));
    await waitFor(() => expect(h.go).toHaveBeenCalledWith("scoring"));
    expect(retrySpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(h.state().scoringAttempt).toEqual({ kind: "attempt", attemptId: ATTEMPT, submitted: true });
  });

  it("keeps the saved-attempt fallback when the server marks an attempt non-scorable", async () => {
    statusSpy.mockResolvedValue(status("not_scored", false));
    getResultSpy.mockResolvedValue(null);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByText("Tính năng chấm điểm AI sắp ra mắt")).toBeTruthy();
    expect(screen.queryByText(/Bạn đạt band/)).toBeNull();
  });

  it("keeps the neutral saved-attempt card for an in-progress attempt without a score", async () => {
    statusSpy.mockResolvedValue(status("not_scored", true, "in_progress"));
    getResultSpy.mockResolvedValue(null);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByText("Tính năng chấm điểm AI sắp ra mắt")).toBeTruthy();
    expect(screen.queryByTestId("results-not-scored")).toBeNull();
  });

  it("labels a scored forecast result with the Luyện đề Forecast eyebrow", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(RESULT);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByText(/Kết quả · Luyện đề Forecast ·/)).toBeTruthy();
  });

  it.each([
    ["full", "Thi thử Full Test"],
    ["part2", "Thi thử Part 2"],
  ])("labels a scored mock %s result with the Thi thử eyebrow", async (mode, label) => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue({ ...RESULT, topicId: null, mode });
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByText(new RegExp(`Kết quả · ${label} ·`))).toBeTruthy();
  });

  it("shows a load error with reload instead of a blank page", async () => {
    statusSpy.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(RESULT);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId("results-error")).toBeTruthy();
    fireEvent.click(screen.getByText("Tải lại"));
    expect(await screen.findByText("Bạn đạt band 6.5")).toBeTruthy();
  });

  it.each([
    ["NOT_FOUND", "results-not-found", "Không tìm thấy bài thi"],
    ["FORBIDDEN", "results-forbidden", "Bạn không có quyền xem bài thi này"],
  ])("shows a dedicated state without a useless reload for %s", async (code, testId, title) => {
    statusSpy.mockRejectedValue(Object.assign(new Error(code), { data: { code } }));
    getResultSpy.mockRejectedValue(Object.assign(new Error(code), { data: { code } }));
    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId(testId)).toBeTruthy();
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.queryByText("Tải lại")).toBeNull();
    expect(screen.queryByText(/Kết nối gặp sự cố/)).toBeNull();
    fireEvent.click(screen.getByText("Về trang chủ"));
    expect(h.go).toHaveBeenCalledWith("dashboard");
  });

  it("re-reads the result once when status is done but the parallel read missed it", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(RESULT);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByText("Bạn đạt band 6.5")).toBeTruthy();
    expect(getResultSpy).toHaveBeenCalledTimes(2);
  });

  it("shows an error state, not placeholder data, when a done result stays unreadable", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(null);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId("results-error")).toBeTruthy();
    expect(screen.getByText(/đã chấm xong nhưng chưa đọc được kết quả/)).toBeTruthy();
    expect(screen.queryByText(/Bạn đạt band/)).toBeNull();
    expect(screen.queryByText("Tính năng chấm điểm AI sắp ra mắt")).toBeNull();

    getResultSpy.mockResolvedValue(RESULT);
    fireEvent.click(screen.getByText("Tải lại"));
    expect(await screen.findByText("Bạn đạt band 6.5")).toBeTruthy();
  });

  it("does not query scoring for the prototype latest view", () => {
    renderWithApp(<ResultsScreen attemptId="latest" />);
    expect(statusSpy).not.toHaveBeenCalled();
    expect(getResultSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Tính năng chấm điểm AI sắp ra mắt")).toBeTruthy();
  });

  it("starts a single-question retake on Luyện ngay with server prompt and prestarted attemptId", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(RESULT);
    attemptStartSpy.mockResolvedValue({
      attemptId: "att-retake-1",
      mode: "part1",
      topicId: "p1-tidiness",
      topicTitle: "Tidiness",
      kind: "p1",
      questionKey: "q2",
      part: 1,
      questionText: "Were you tidy as a child?",
      hasLinkedPrompt: false,
      retakeOfAttemptId: ATTEMPT,
    });

    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);
    await screen.findByText("Bạn đạt band 6.5");

    fireEvent.click(screen.getByTestId("retake-weakest-btn"));
    await waitFor(() => expect(h.go).toHaveBeenCalledWith("exam"));
    expect(attemptStartSpy).toHaveBeenCalledWith({ retakeOf: ATTEMPT });
    expect(h.state().practice).toMatchObject({
      topicId: "p1-tidiness",
      title: "Tidiness",
      kind: "p1",
      singleQuestionId: "q2",
      attemptId: "att-retake-1",
      retakeOfAttemptId: ATTEMPT,
      hasLinkedPrompt: false,
      items: [{ id: "q2", part: 1, text: "Were you tidy as a child?", answer: "" }],
    });
  });

  it("shows inline error alert if retake start fails", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(RESULT);
    attemptStartSpy.mockRejectedValue(new Error("network error"));

    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);
    await screen.findByText("Bạn đạt band 6.5");

    fireEvent.click(screen.getByTestId("retake-weakest-btn"));
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("displays before-and-after band comparison on a retake result", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue({
      ...RESULT,
      retakeOfAttemptId: "att-parent-0",
      previousOverall: 5.5,
      overall: 6.5,
    });

    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);
    const comparison = await screen.findByTestId("retake-band-comparison");
    expect(comparison.textContent).toContain("Band trước 5.5");
    expect(comparison.textContent).toContain("Band mới 6.5");
    expect(comparison.textContent).toContain("+1.0");
  });
});
