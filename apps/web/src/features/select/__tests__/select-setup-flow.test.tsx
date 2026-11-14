import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { QuotaStatus } from "@vox-flow/api/quota/quota";
import { act, fireEvent, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MODES } from "@/features/exam/data";
import { TopicDetailModal } from "@/features/forecast/components/topic-detail-modal";
import type { ForecastTopic } from "@/features/forecast/types";
import { ModeGrid } from "@/features/select/components/mode-grid";
import { SelectScreen } from "@/features/select/select-screen";
import { SelectSetupScreen } from "@/features/select/select-setup-screen";
import { GLOBAL_CAP_NEUTRAL_MESSAGE } from "@/features/select/use-quota-status";
import { SELECT_MOBILE_QUERY } from "@/features/select/use-select-mobile-viewport";
import { renderWithApp } from "@/test/harness";
import { trpc } from "@/utils/trpc";

function mockMatchMedia(matchesMobile: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matchesMobile && query === SELECT_MOBILE_QUERY,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

function createStatefulMatchMedia(initialMobile: boolean) {
  let matchesMobile = initialMobile;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const isTarget = query === SELECT_MOBILE_QUERY;
    return {
      get matches() {
        return isTarget ? matchesMobile : false;
      },
      media: query,
      onchange: null,
      addListener: (cb: (event: MediaQueryListEvent) => void) => {
        if (isTarget) listeners.add(cb);
      },
      removeListener: (cb: (event: MediaQueryListEvent) => void) => {
        if (isTarget) listeners.delete(cb);
      },
      addEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
        if (isTarget && type === "change" && typeof cb === "function") {
          listeners.add(cb as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
        if (isTarget && type === "change" && typeof cb === "function") {
          listeners.delete(cb as (event: MediaQueryListEvent) => void);
        }
      },
      dispatchEvent: () => false,
    } as MediaQueryList;
  });

  return {
    listenerCount: () => listeners.size,
    setMobile(next: boolean) {
      matchesMobile = next;
      const event = { matches: next, media: SELECT_MOBILE_QUERY } as MediaQueryListEvent;
      for (const cb of [...listeners]) {
        cb(event);
      }
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Select setup flow", () => {
  it("mobile: SelectScreen hides and unmounts VoicePicker and PreExamCard while preserving all 4 mode cards", () => {
    mockMatchMedia(true);
    renderWithApp(<SelectScreen />, { mode: "p1" });

    for (const m of MODES) {
      expect(screen.getByRole("button", { name: new RegExp(m.title) })).toBeTruthy();
    }
    const part1Btn = screen.getByRole("button", { name: /Part 1/ });
    expect(part1Btn.className).toContain("bg-ink");

    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();
    expect(screen.queryByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ })).toBeNull();
  });

  it("desktop: SelectScreen renders VoicePicker and PreExamCard inside a hidden lg:grid wrapper", () => {
    mockMatchMedia(false);
    renderWithApp(<SelectScreen />);

    const voiceHeading = screen.getByText("Giọng giám khảo");
    const preExamHeading = screen.getByText("Trước khi bắt đầu");
    const wrapper = voiceHeading.closest("div.lg\\:grid");

    expect(wrapper).toBeTruthy();
    expect(wrapper?.className).toContain("hidden");
    expect(wrapper?.className).toContain("lg:grid");
    expect(wrapper?.contains(preExamHeading)).toBe(true);
  });

  it("dynamic viewport resize across 1024px mounts and unmounts VoicePicker and PreExamCard", () => {
    const media = createStatefulMatchMedia(true);
    const { unmount } = renderWithApp(<SelectScreen />);

    expect(media.listenerCount()).toBe(1);
    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();

    act(() => {
      media.setMobile(false);
    });

    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();
    expect(screen.getByText("Trước khi bắt đầu")).toBeTruthy();

    act(() => {
      media.setMobile(true);
    });

    expect(screen.queryByText("Giọng giám khảo")).toBeNull();
    expect(screen.queryByText("Trước khi bắt đầu")).toBeNull();

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it("falls back to legacy addListener/removeListener when addEventListener is unavailable", () => {
    let matchesMobile = true;
    const legacyListeners = new Set<(event: MediaQueryListEvent) => void>();

    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          get matches() {
            return query === SELECT_MOBILE_QUERY ? matchesMobile : false;
          },
          media: query,
          onchange: null,
          addListener: (cb: (event: MediaQueryListEvent) => void) => {
            if (query === SELECT_MOBILE_QUERY) legacyListeners.add(cb);
          },
          removeListener: (cb: (event: MediaQueryListEvent) => void) => {
            if (query === SELECT_MOBILE_QUERY) legacyListeners.delete(cb);
          },
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );

    const { unmount } = renderWithApp(<SelectScreen />);
    expect(legacyListeners.size).toBe(1);
    expect(screen.queryByText("Giọng giám khảo")).toBeNull();

    act(() => {
      matchesMobile = false;
      const event = { matches: false, media: SELECT_MOBILE_QUERY } as MediaQueryListEvent;
      for (const cb of [...legacyListeners]) cb(event);
    });

    expect(screen.getByText("Giọng giám khảo")).toBeTruthy();

    unmount();
    expect(legacyListeners.size).toBe(0);
  });
  it("mobile: tapping any mode card keeps the mode and navigates to the setup screen", () => {
    mockMatchMedia(true);

    for (const m of MODES) {
      const h = renderWithApp(<ModeGrid />);
      fireEvent.click(screen.getByText(m.title));
      expect(h.set).toHaveBeenCalledWith({ mode: m.id });
      expect(h.go).toHaveBeenCalledWith("select-setup");
      h.unmount();
    }
  });

  it("desktop: tapping a mode card keeps the mode without navigating", () => {
    // Default window.matchMedia from src/test/setup.ts resolves matches: false.
    const h = renderWithApp(<ModeGrid />);

    fireEvent.click(screen.getByText("Part 2"));

    expect(h.set).toHaveBeenCalledWith({ mode: "p2" });
    expect(h.go).not.toHaveBeenCalled();
  });

  it("setup screen: shows selected mode header, back link, voice picker and start button", () => {
    const h = renderWithApp(<SelectSetupScreen />, { mode: "p2" });

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Part 2");
    expect(screen.getByText("Cue card · 1 phút chuẩn bị").tagName).toBe("P");

    const back = screen.getByRole("button", { name: "Chọn bài thi" });
    fireEvent.click(back);
    expect(h.go).toHaveBeenCalledWith("select");

    expect(screen.getByText("Giọng giám khảo").tagName).toBe("H2");
    const start = screen.getByRole("button", { name: "Đồng ý ghi âm & bắt đầu" });
    fireEvent.click(start);
    expect(h.go).toHaveBeenCalledWith("exam");
  });

  it("aligns mode cards with h-full flex-col and bottom-pins duration footer with mt-auto", () => {
    renderWithApp(<ModeGrid />);

    for (const m of MODES) {
      const btn = screen.getByRole("button", { name: new RegExp(m.title) });
      expect(btn.className).toContain("h-full");
      expect(btn.className).toContain("flex-col");

      const durationEl = within(btn).getByText(m.time);
      expect(durationEl.className).toContain("mt-auto");
      expect(durationEl.className).toContain("pt-6");
      expect(durationEl.className).not.toContain("mt-6");
    }
  });
});

function makeQuotaStatus(overrides: Partial<QuotaStatus> = {}): QuotaStatus {
  const remainingPoints = overrides.remainingPoints ?? 3;
  const globalCapReached = overrides.globalCapReached ?? false;
  return {
    entitlement: "free",
    dailyLimit: 3,
    usedPoints: 3 - remainingPoints,
    remainingPoints,
    globalCapReached,
    globalRemainingCanAfford: {
      full: !globalCapReached,
      part: !globalCapReached,
      forecastP1: !globalCapReached,
      forecastP23: !globalCapReached,
      singleQuestion: !globalCapReached,
      retake: !globalCapReached,
    },
    resetAtMs: Date.UTC(2026, 10, 14, 17, 0, 0),
    costs: {
      full: 3,
      part: 1,
      forecastP1: 1,
      forecastP23: 2,
      singleQuestion: 1,
      firstRetake: 0,
      extraRetake: 1,
    },
    ...overrides,
  };
}

function renderWithQuota(ui: ReactNode, status: QuotaStatus, mode: "full" | "p1" | "p2" | "p3" = "full") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  qc.setQueryData(trpc.quota.status.queryKey(), status, { updatedAt: Date.now() });
  return renderWithApp(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>, { mode });
}

const P23_TOPIC: ForecastTopic = {
  id: "p23-env",
  title: "Describe an environmental initiative",
  category: "Society",
  kind: "p23",
  reports: 120,
  lastSeen: "Hôm qua",
  items: [
    {
      id: "p23-env-cue",
      part: 2,
      text: "Describe an environmental initiative",
      answer: "",
      cue: { title: "Describe an environmental initiative", points: ["What it is", "How it helps"], ending: "Why it matters" },
    },
    { id: "p23-env-q1", part: 3, text: "How can cities reduce waste?", answer: "" },
  ],
};

describe("Select & Forecast quota transparency and gating", () => {
  it("shows remaining points, reset time, and per-mode point costs for a free user with 3/3 points", () => {
    mockMatchMedia(false);
    renderWithQuota(<SelectScreen />, makeQuotaStatus({ remainingPoints: 3 }));

    expect(screen.getByTestId("quota-banner").textContent).toContain("Còn 3/3 điểm hôm nay");
    expect(screen.getByTestId("quota-banner").textContent).toContain("Đặt lại lúc 00:00 (giờ Việt Nam)");
    expect(within(screen.getByRole("button", { name: /Full Test/ })).getByText("3 điểm")).toBeTruthy();
    expect(screen.getAllByText("1 điểm")).toHaveLength(3);

    const startBtn = screen.getByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(false);
  });

  it("auto-switches full -> p1 when 2/3 points remain, dims Full Test, and blocks insufficient forecast topic", () => {
    mockMatchMedia(false);
    const h = renderWithQuota(<SelectScreen />, makeQuotaStatus({ remainingPoints: 2 }), "full");

    expect(h.set).toHaveBeenCalledWith({ mode: "p1" });
    const fullCard = screen.getByRole("button", { name: /Full Test/ });
    expect(fullCard.className).toContain("opacity-60");
    expect(within(fullCard).getByText("Không đủ điểm")).toBeTruthy();

    // Forecast Part 2&3 topic needs 2 pts -> allowed at 2 pts, blocked at 1 pt.
    h.unmount();
    const modalHarness = renderWithQuota(
      <TopicDetailModal
        topic={P23_TOPIC}
        practicedBand={undefined}
        saved={false}
        onClose={vi.fn()}
        onToggleSave={vi.fn()}
        onStart={vi.fn()}
        onStartQuestion={vi.fn()}
      />,
      makeQuotaStatus({ remainingPoints: 1 }),
    );
    expect(screen.getByText("2 điểm")).toBeTruthy();
    const startTopicBtn = screen.getByRole("button", { name: /Luyện chủ đề này/ }) as HTMLButtonElement;
    expect(startTopicBtn.disabled).toBe(true);
    const singleQBtn = screen.getByRole("button", { name: /Luyện câu này/ }) as HTMLButtonElement;
    expect(singleQBtn.disabled).toBe(false);
    fireEvent.click(within(screen.getByTestId("forecast-modal-quota-alert")).getByRole("button", { name: "Xem gói trả phí" }));
    expect(modalHarness.go).toHaveBeenCalledWith("billing");
  });

  it("shows 0/3 alert with billing CTA on SelectSetupScreen when points are exhausted", () => {
    const h = renderWithQuota(<SelectSetupScreen />, makeQuotaStatus({ remainingPoints: 0 }), "p1");

    const banner = screen.getByTestId("quota-banner");
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.textContent).toContain("Còn 0/3 điểm hôm nay");

    const startBtn = screen.getByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);

    fireEvent.click(within(banner).getByRole("button", { name: "Xem gói trả phí" }));
    expect(h.go).toHaveBeenCalledWith("billing");
  });

  it("shows neutral global cap alert without leaking VND numbers when FREE_DAILY_BUDGET_VND is reached", () => {
    mockMatchMedia(false);
    const h = renderWithQuota(
      <SelectScreen />,
      makeQuotaStatus({ remainingPoints: 3, globalCapReached: true }),
    );

    const banner = screen.getByTestId("quota-banner");
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.textContent).toContain(GLOBAL_CAP_NEUTRAL_MESSAGE);
    expect(banner.textContent?.toLowerCase()).not.toContain("vnd");
    expect(banner.textContent).not.toContain("33000");

    const startBtn = screen.getByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
    fireEvent.click(within(screen.getByTestId("pre-exam-quota-alert")).getByRole("button", { name: "Xem gói trả phí" }));
    expect(h.go).toHaveBeenCalledWith("billing");
  });

  it("renders unlimited badge and keeps all modes unlocked for paid learners", () => {
    mockMatchMedia(false);
    renderWithQuota(
      <SelectScreen />,
      makeQuotaStatus({ entitlement: "paid", remainingPoints: 0, globalCapReached: true }),
    );

    expect(screen.getByTestId("quota-banner").textContent).toContain("Gói trả phí · Luyện không giới hạn");
    expect(screen.getAllByText("Không giới hạn")).toHaveLength(4);
    const startBtn = screen.getByRole("button", { name: /Đồng ý ghi âm & bắt đầu/ }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(false);
  });
});
