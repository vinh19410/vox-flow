import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { ProtoToast } from "@/features/app-state/toast";
import { AppCtx, type AppCtxValue, type AppState } from "@/features/app-state/types";
import { HISTORY } from "@/features/history/data";
import { ResultsScreen } from "@/features/results/results-screen";
const mutateSpy = vi.fn();
const querySpy = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    dispute: {
      submit: {
        mutate: (...args: unknown[]) => mutateSpy(...args),
      },
      get: {
        query: (...args: unknown[]) => querySpy(...args),
      },
    },
  },
}));

import { ReportModal } from "../components/report-modal";

function createHarness(seed?: Partial<AppState>) {
  const go = vi.fn();
  const goResult = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();
  const setPendingSubmission = vi.fn();
  const setLastUnpersistedAttempt = vi.fn();
  const openPaywall = vi.fn();
  const closePaywall = vi.fn();

  function Provider({ children }: { children: ReactNode }) {
    const [s, setS] = useState<AppState>(() => ({
      ...createInitialState(),
      ...seed,
    }));
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const value: AppCtxValue = {
      s,
      set: (u) => {
        set(u);
        setS((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
      },
      paywallOpen: false,
      openPaywall,
      closePaywall,
      toastMsg,
      toast: (m) => {
        toast(m);
        setToastMsg(m);
      },
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt,
      pendingSubmission: false,
      setPendingSubmission,
      go,
      goResult,
    };

    return (
      <AppCtx.Provider value={value}>
        {children}
        <ProtoToast message={toastMsg} />
      </AppCtx.Provider>
    );
  }

  return {
    Provider,
    toast,
  };
}

function renderWithApp(ui: ReactNode, seed?: Partial<AppState>) {
  const harness = createHarness(seed);
  const utils = render(<harness.Provider>{ui}</harness.Provider>);
  return { ...utils, ...harness };
}

describe("ReportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateSpy.mockReset();
    querySpy.mockReset();
  });

  it("renders modal form with 72h SLA copy and default unchecked consent", () => {
    const onClose = vi.fn();
    renderWithApp(<ReportModal open={true} onClose={onClose} attemptId="att-1" />);

    expect(screen.getByText("Báo lỗi chấm")).toBeTruthy();
    expect(screen.getByText(/cam kết phản hồi trong vòng 72 giờ/i)).toBeTruthy();
    expect(screen.queryByText(/hiệu chuẩn hệ thống/i)).toBeNull();

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(false);
  });

  it("submits dispute data to trpcClient.dispute.submit and triggers 72h toast", async () => {
    const onClose = vi.fn();
    const onSubmitted = vi.fn();
    mutateSpy.mockResolvedValue({ id: "disp-1" });

    const { toast } = renderWithApp(
      <ReportModal open={true} onClose={onClose} attemptId="att-1" onSubmitted={onSubmitted} />,
    );

    // Pick criterion "Phát âm" (PRON)
    fireEvent.click(screen.getByText("Phát âm"));

    // Select expected band 7.5
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "7.5" } });

    // Fill reason
    fireEvent.change(screen.getByPlaceholderText(/Mình có dùng nhiều câu phức/i), {
      target: { value: "Phát âm đuôi ed chuẩn xác nhưng bị trừ điểm" },
    });

    // Check shareConsent checkbox
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(true);

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Gửi báo lỗi/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith({
        attemptId: "att-1",
        targetCriterion: "PRON",
        expectedBand: "7.5",
        reason: "Phát âm đuôi ed chuẩn xác nhưng bị trừ điểm",
        shareConsent: true,
      });
      expect(toast).toHaveBeenCalledWith(
        "Đã gửi báo lỗi. Chúng tôi cam kết phản hồi trong vòng 72 giờ.",
      );
      expect(onSubmitted).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("displays error banner when dispute submission fails", async () => {
    const onClose = vi.fn();
    mutateSpy.mockRejectedValue(new Error("Bài thi này đã có báo lỗi đang được xử lý"));

    renderWithApp(<ReportModal open={true} onClose={onClose} attemptId="att-1" />);

    fireEvent.click(screen.getByRole("button", { name: /Gửi báo lỗi/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Bài thi này đã có báo lỗi đang được xử lý").length).toBeGreaterThanOrEqual(1);
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});

describe("ResultsScreen dispute integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateSpy.mockReset();
    querySpy.mockReset();
  });

  it("hides dispute button when attemptId is latest (prototype preview)", () => {
    renderWithApp(<ResultsScreen attemptId="latest" />);
    expect(screen.queryByText(/Báo lỗi chấm/)).toBeNull();
  });

  it("renders dispute button when dispute feature is enabled and no dispute exists", async () => {
    querySpy.mockResolvedValue({ enabled: true, dispute: null });

    renderWithApp(<ResultsScreen attemptId="a3" />, { attempts: [...HISTORY] });

    await waitFor(() => {
      expect(querySpy).toHaveBeenCalledWith({ attemptId: "a3" });
      expect(screen.getByText("Báo lỗi chấm")).toBeTruthy();
    });
  });

  it("renders dispute status badge when dispute already exists for attempt", async () => {
    const futureDue = new Date(Date.now() + 70 * 3600 * 1000);
    querySpy.mockResolvedValue({
      enabled: true,
      dispute: {
        id: "disp-exist",
        status: "open",
        dueAt: futureDue,
        targetCriterion: "GRA",
      },
    });

    renderWithApp(<ResultsScreen attemptId="a3" />, { attempts: [...HISTORY] });

    await waitFor(() => {
      expect(screen.getByText(/Báo lỗi đang xử lý/)).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Báo lỗi chấm/ })).toBeNull();
    });
  });

  it("renders resolved dispute badge when dispute is resolved", async () => {
    querySpy.mockResolvedValue({
      enabled: true,
      dispute: {
        id: "disp-resolved",
        status: "resolved",
        dueAt: new Date(),
        targetCriterion: "GRA",
      },
    });

    renderWithApp(<ResultsScreen attemptId="a3" />, { attempts: [...HISTORY] });

    await waitFor(() => {
      expect(screen.getByText("Báo lỗi đã xử lý")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Báo lỗi chấm/ })).toBeNull();
    });
  });
});
