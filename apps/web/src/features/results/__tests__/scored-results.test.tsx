import type { ScoringResult } from "@vox-flow/api/scoring/types";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const statusSpy = vi.fn();
const getResultSpy = vi.fn();
const retrySpy = vi.fn();
const disputeGetSpy = vi.fn();

// FEATURES.scoring stays at its beta default (off): real results must render regardless.
vi.mock("@/utils/trpc", () => ({
  trpcClient: {
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

const status = (s: string, scorable = true) => ({ attemptId: ATTEMPT, status: s, scorable });

describe("ResultsScreen with real scoring data", () => {
  beforeEach(() => {
    statusSpy.mockReset();
    getResultSpy.mockReset();
    retrySpy.mockReset();
    disputeGetSpy.mockReset().mockResolvedValue({ enabled: false, dispute: null });
  });

  it("keeps the beta flag off in this suite", () => {
    expect(FEATURES.scoring).toBe(false);
  });

  it("renders real bands, criteria evidence and transcripts with no paywall, range or runs", async () => {
    statusSpy.mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(RESULT);
    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(screen.getByTestId("results-loading")).toBeTruthy();
    expect(await screen.findByText("Bạn đạt band 6.5")).toBeTruthy();
    expect(getResultSpy).toHaveBeenCalledWith({ attemptId: ATTEMPT });
    expect(screen.getByText(RESULT.oneLiner)).toBeTruthy();

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

    // Default selection (GRA) shows real summary, verbatim evidence with its location, and improvements.
    expect(screen.getByText("Chủ yếu dùng câu đơn, còn lỗi chia thì.")).toBeTruthy();
    expect(screen.getByText("“when I was child I keep”")).toBeTruthy();
    expect(screen.getAllByText("Part 1 · Câu 2").length).toBeGreaterThan(0);
    expect(screen.getByText("when I was a child, I kept")).toBeTruthy();

    fireEvent.click(screen.getByText("Độ trôi chảy & mạch lạc"));
    expect(screen.getByText("“I always keep my desk tidy”")).toBeTruthy();
    expect(h.openPaywall).not.toHaveBeenCalled();

    // No confidence range, run count or per-run values anywhere.
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Khoảng tin cậy|lần chấm|Chấm 3 lần|trung vị|lượt chấm/i);
    expect(text).not.toMatch(/\d\.\d\s?[–-]\s?\d\.\d/);

    fireEvent.click(screen.getByText("Xem lại từng câu"));
    expect(screen.getByText("Were you tidy as a child?")).toBeTruthy();
    expect(screen.getByText("Not really, when I was child I keep my room very very messy.")).toBeTruthy();
    expect(screen.getAllByText(/^Part 1 · Câu [12]$/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Mở khóa đánh dấu lỗi")).toBeNull();
    expect(screen.queryByLabelText("Phát lại")).toBeNull();
  });

  it("links back to the scoring screen while scoring is still in progress", async () => {
    statusSpy.mockResolvedValue(status("processing"));
    getResultSpy.mockResolvedValue(null);
    const h = renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId("results-scoring")).toBeTruthy();
    fireEvent.click(screen.getByText("Xem tiến trình chấm"));
    expect(h.state().scoringAttempt).toEqual({ attemptId: ATTEMPT, submitted: true });
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
    expect(h.state().scoringAttempt).toEqual({ attemptId: ATTEMPT, submitted: true });
  });

  it("keeps the saved-attempt state for attempts that are not scored", async () => {
    statusSpy.mockResolvedValue(status("not_scored", false));
    getResultSpy.mockResolvedValue(null);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByText("Tính năng chấm điểm AI sắp ra mắt")).toBeTruthy();
    expect(screen.queryByText(/Bạn đạt band/)).toBeNull();
  });

  it("shows a load error with reload instead of a blank page", async () => {
    statusSpy.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(status("done"));
    getResultSpy.mockResolvedValue(RESULT);
    renderWithApp(<ResultsScreen attemptId={ATTEMPT} />);

    expect(await screen.findByTestId("results-error")).toBeTruthy();
    fireEvent.click(screen.getByText("Tải lại"));
    expect(await screen.findByText("Bạn đạt band 6.5")).toBeTruthy();
  });

  it("does not query scoring for the prototype latest view", () => {
    renderWithApp(<ResultsScreen attemptId="latest" />);
    expect(statusSpy).not.toHaveBeenCalled();
    expect(getResultSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Tính năng chấm điểm AI sắp ra mắt")).toBeTruthy();
  });
});
