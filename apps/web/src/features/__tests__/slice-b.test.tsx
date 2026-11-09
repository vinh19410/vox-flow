import { fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { ProtoToast } from "@/features/app-state/toast";
import { AppCtx, type AppCtxValue, type AppState } from "@/features/app-state/types";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { ForecastScreen } from "@/features/forecast/forecast-screen";
import { useQuery } from "@tanstack/react-query";
import type * as TanstackQuery from "@tanstack/react-query";
import { HistoryScreen } from "@/features/history/history-screen";
import { SelectScreen } from "@/features/select/select-screen";
import { MODES } from "@/features/exam/data";
import { daysUntil } from "@/lib/format";

const mockApiForecast = [
  {
    id: "f-hometown",
    title: "Hometown",
    quarter: "2026-Q3",
    part: 1,
    questions: [
      "Where is your hometown?",
      "What do you like most about it?",
      "Has your hometown changed much in recent years?",
    ],
    status: "published",
    realReportCount: 412,
  },
  {
    id: "f-weather",
    title: "Weather",
    quarter: "2026-Q3",
    part: 1,
    questions: [
      "What kind of weather do you like?",
      "Does the weather affect your mood?",
    ],
    status: "published",
    realReportCount: 180,
  },
  {
    id: "f-ai",
    title: "Artificial intelligence",
    quarter: "2026-Q3",
    part: 1,
    questions: [
      "Have you ever used artificial intelligence apps?",
    ],
    status: "published",
    realReportCount: 198,
  },
  {
    id: "f-place",
    title: "A quiet place you like",
    quarter: "2026-Q3",
    part: 2,
    questions: {
      cueCards: ["Where it is", "How often you go there", "What you do there", "and explain why you like it"],
      part3: ["Is it easy to find quiet places in cities?", "Why do people need quietness?"],
    },
    isNew: true,
    status: "published",
    realReportCount: 175,
  },
];

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQuery>();
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: mockApiForecast,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })),
  };
});

// DashboardScreen reads the auth session for its greeting; keep the suite
// hermetic by returning no session so it falls back to the seed name.
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false, error: null })),
  },
}));

function createHarness(seed?: Partial<AppState>) {
  const go = vi.fn();
  const goResult = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();
  const setPendingSubmission = vi.fn();

  function Provider({ children }: { children: ReactNode }) {
    const [s, setS] = useState<AppState>(() => ({ ...createInitialState(), ...seed }));
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const value: AppCtxValue = {
      s,
      set: (u) => {
        set(u);
        setS((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
      },
      paywallOpen: false,
      openPaywall: vi.fn(),
      closePaywall: vi.fn(),
      toastMsg,
      toast: (m) => {
        toast(m);
        setToastMsg(m);
      },
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt: vi.fn(),
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

  return { Provider, go, goResult, toast, set, setPendingSubmission };
}

function renderWithApp(ui: ReactNode, seed?: Partial<AppState>) {
  const harness = createHarness(seed);
  const utils = render(<harness.Provider>{ui}</harness.Provider>);
  return { ...utils, ...harness };
}

describe("ForecastScreen", () => {
  it("renders the quarter label, kind tabs, and p1 topic cards", () => {
    renderWithApp(<ForecastScreen />);
    expect(screen.getByText(/Quý 3\/2026/)).toBeTruthy();

    expect(screen.getByRole("button", { name: /^Part 1 3/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Part 2 & 3 1/ })).toBeTruthy();

    expect(screen.getAllByText("Hometown").length).toBeGreaterThan(0);
  });

  it("switches topics by kind tab (p1 vs p23)", () => {
    renderWithApp(<ForecastScreen />);
    fireEvent.click(screen.getByRole("button", { name: /^Part 2 & 3/ }));
    expect(screen.getByText("A quiet place you like")).toBeTruthy();
    expect(screen.queryByText("Weather")).toBeNull();
  });

  it("filters by hot and saved chips", () => {
    renderWithApp(<ForecastScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Hay gặp" }));
    expect(screen.getAllByText("Hometown").length).toBeGreaterThan(0);
    expect(screen.queryByText("Weather")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Đã lưu" }));
    expect(screen.getByText("Artificial intelligence")).toBeTruthy();
    expect(screen.queryByText("Weather")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Part 2 & 3/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mới trong quý" }));
    expect(screen.getByText("A quiet place you like")).toBeTruthy();
  });

  it("renders skeleton loading state when query is loading", () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithApp(<ForecastScreen />);
    expect(screen.getByTestId("forecast-loading")).toBeTruthy();
  });

  it("renders error state and triggers refetch on retry", () => {
    const refetchSpy = vi.fn();
    vi.mocked(useQuery).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Mất kết nối mạng"),
      refetch: refetchSpy,
    } as never);

    renderWithApp(<ForecastScreen />);
    expect(screen.getByText("Không thể tải danh sách đề forecast")).toBeTruthy();
    expect(screen.getByText("Mất kết nối mạng")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchSpy).toHaveBeenCalledTimes(1);
  });

  it("starts practice session from a forecast topic into /exam without error", () => {
    const { set, go } = renderWithApp(<ForecastScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Luyện ngay" }));
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        practice: expect.objectContaining({
          title: "Hometown",
          kind: "p1",
        }),
      }),
    );
    expect(go).toHaveBeenCalledWith("exam");
  });
  it("filters by search query and shows the empty state", () => {
    renderWithApp(<ForecastScreen />);
    const search = screen.getByPlaceholderText("Tìm chủ đề hoặc câu hỏi…");
    fireEvent.change(search, { target: { value: "hometown" } });
    expect(screen.getAllByText("Hometown").length).toBeGreaterThan(0);
    expect(screen.queryByText("Weather")).toBeNull();

    fireEvent.change(search, { target: { value: "zzz-no-match" } });
    expect(screen.getByText("Không có chủ đề nào khớp bộ lọc.")).toBeTruthy();
  });

  it("toggles save on a topic and shows the save toast", () => {
    const { set, toast } = renderWithApp(<ForecastScreen />);
    fireEvent.click(screen.getAllByRole("button", { name: "Lưu chủ đề" })[0]);
    expect(set).toHaveBeenCalledWith({ saved: ["f-ai", "f-hometown"] });
    expect(toast).toHaveBeenCalledWith("Đã lưu vào danh sách ôn");
    expect(screen.getByText("Đã lưu vào danh sách ôn")).toBeTruthy();
  });
});

describe("HistoryScreen", () => {
  it("filters attempts by mode chip and opens a result", () => {
    const { goResult } = renderWithApp(<HistoryScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Part 2" }));
    expect(screen.getByText("A useful skill")).toBeTruthy();
    expect(screen.queryByText("Work · A place you visited")).toBeNull();

    fireEvent.click(screen.getByText("A useful skill"));
    expect(goResult).toHaveBeenCalledWith("a3");
  });

  it("renders the empty state when the mode filter yields nothing", () => {
    renderWithApp(<HistoryScreen />, {
      attempts: [
        { id: "h1", date: "2025-04-01", mode: "p1", band: 6.0, range: [5.5, 6.5], topic: "Hometown · Music" },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: "Part 3" }));
    expect(screen.getByText("Chưa có bài nào cho bộ lọc này.")).toBeTruthy();
  });
});

describe("SelectScreen", () => {
  it("renders 4 modes with the recommended badge and consent state, then starts a mock test", () => {
    const { go, set, setPendingSubmission } = renderWithApp(<SelectScreen />);
    for (const mode of MODES) {
      expect(screen.getByRole("button", { name: new RegExp(mode.title) })).toBeTruthy();
    }
    expect(screen.getByText("Khuyên dùng")).toBeTruthy();
    expect(screen.getByText(/Ghi âm được xử lý bảo mật để chấm bài và tự động lưu/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Đồng ý ghi âm & bắt đầu" }));
    expect(set).toHaveBeenCalledWith({ practice: null });
    expect(setPendingSubmission).toHaveBeenCalledWith(false);
    expect(go).toHaveBeenCalledWith("exam");
  });


  it("previews voices through speech synthesis and cancels on unmount", () => {
    const speakSpy = vi.spyOn(globalThis.speechSynthesis, "speak");
    const cancelSpy = vi.spyOn(globalThis.speechSynthesis, "cancel");
    const { unmount } = renderWithApp(<SelectScreen />);

    expect(screen.getAllByRole("button", { name: /Nghe thử/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Nghe thử Emma" }));
    expect(speakSpy).toHaveBeenCalledTimes(1);
    const utterance = speakSpy.mock.calls[0]?.[0] as { text: string } | undefined;
    expect(utterance?.text).toContain("Hello, my name is Emma");

    cancelSpy.mockClear();
    unmount();
    expect(cancelSpy).toHaveBeenCalledTimes(1);

    speakSpy.mockRestore();
    cancelSpy.mockRestore();
  });
});

describe("DashboardScreen", () => {
  it("renders the empty state with a first-attempt CTA", () => {
    const { go } = renderWithApp(<DashboardScreen />, { attempts: [] });
    expect(screen.getByText(/Chưa có bài làm nào/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Thi thử bài đầu tiên/ }));
    expect(go).toHaveBeenCalledWith("select");
  });

  it("renders readiness, countdown, today tasks, and the recent attempt card", () => {
    const seed = createInitialState();
    const { goResult } = renderWithApp(<DashboardScreen />);
    expect(screen.getByText("Band ước lượng hiện tại")).toBeTruthy();
    expect(screen.getByText("còn thiếu 1.0")).toBeTruthy();
    expect(screen.getByText(String(daysUntil(seed.examDate)))).toBeTruthy();
    expect(screen.getByText("ngày nữa")).toBeTruthy();
    expect(screen.getByText("Việc hôm nay")).toBeTruthy();
    expect(screen.getByText("Luyện lại câu yếu nhất")).toBeTruthy();
    expect(screen.getByText("Bài gần nhất")).toBeTruthy();

    fireEvent.click(screen.getByText("Weather · Sports"));
    expect(goResult).toHaveBeenCalledWith("a6");
  });
});
