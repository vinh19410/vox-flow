import { fireEvent, render, screen, within } from "@testing-library/react";
import { act, useEffect, useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, beforeEach, vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { ProtoToast } from "@/features/app-state/toast";
import { useApp, AppCtx, type AppCtxValue, type AppState, type PracticeSession } from "@/features/app-state/types";
import { BillingScreen } from "@/features/billing/billing-screen";
import { PaywallModal } from "@/features/billing/components/paywall-modal";
import { ExamScreen } from "@/features/exam/exam-screen";
import type { ExamItem } from "@/features/exam/types";
import { HISTORY } from "@/features/history/data";
import type { Attempt } from "@/features/history/types";
import { ResultsScreen } from "@/features/results/results-screen";
import { ScoringScreen } from "@/features/scoring/scoring-screen";

/**
 * Test harness mirroring AppStateProvider: real AppState transitions through
 * `set`, spyable `go`/`goResult`/`toast`, plus a probe capturing the latest
 * committed state so tests can assert store contents directly.
 */
function createHarness(seed?: Partial<AppState>, opts?: { pendingSubmission?: boolean }) {
  const go = vi.fn();
  const goResult = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();
  const setPendingSubmission = vi.fn();
  const setLastUnpersistedAttempt = vi.fn();
  const openPaywall = vi.fn();
  const closePaywall = vi.fn();
  let latest: AppState | null = null;

  function Probe() {
    const { s } = useApp();
    useEffect(() => {
      latest = s;
    });
    return null;
  }

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
      pendingSubmission: opts?.pendingSubmission ?? false,
      setPendingSubmission,
      go,
      goResult,
    };
    return (
      <AppCtx.Provider value={value}>
        {children}
        <Probe />
        <ProtoToast message={toastMsg} />
      </AppCtx.Provider>
    );
  }

  return {
    Provider,
    go,
    goResult,
    toast,
    set,
    setPendingSubmission,
    setLastUnpersistedAttempt,
    openPaywall,
    closePaywall,
    state: () => {
      if (!latest) throw new Error("Probe has not rendered yet");
      return latest;
    },
  };
}

function renderWithApp(ui: ReactNode, seed?: Partial<AppState>, opts?: { pendingSubmission?: boolean }) {
  const harness = createHarness(seed, opts);
  const utils = render(<harness.Provider>{ui}</harness.Provider>);
  return { ...utils, ...harness };
}

/** Practice session with two Part 1 items, one carrying an AI follow-up. */
const PRACTICE_ITEMS: ExamItem[] = [
  {
    id: "fp1",
    part: 1,
    text: "Do you often help other people?",
    answer:
      "Yes I try to help my friends with their homework every week and I also volunteer at a local charity on some weekends when I have free time.",
    followUp: {
      text: "Who taught you to be helpful?",
      trigger: "help my friends",
      answer: "My parents did, mostly by setting an example at home when I was small.",
    },
  },
  {
    id: "fp2",
    part: 1,
    text: "How do people usually help each other in your country?",
    answer:
      "Mostly through family support. People take care of elderly relatives and neighbours cook for each other during festivals or difficult times.",
  },
];

const PRACTICE: PracticeSession = {
  topicId: "f-helped",
  title: "Describe a time when you helped someone",
  kind: "p23",
  items: PRACTICE_ITEMS,
};

function beginIfNeeded() {
  const begin = screen.queryByText(/^Bắt đầu Part \d$/);
  if (begin) fireEvent.click(begin);
}

/** Drives the current step: typing reveal, record, stop, then next. */
function answerCurrent() {
  beginIfNeeded();
  act(() => {
    vi.advanceTimersByTime(3200);
  });
  const mic = screen.queryByLabelText("Bắt đầu ghi");
  if (mic) fireEvent.click(mic);
  else fireEvent.click(screen.getByText("Sẵn sàng, bắt đầu nói"));
  act(() => {
    vi.advanceTimersByTime(1200);
  });
  fireEvent.click(screen.getByLabelText("Dừng ghi"));
  fireEvent.click(screen.getByText(/Câu tiếp theo|Hoàn thành/));
}

describe("ExamScreen (mock test)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the examiner header and Part 1 intro", () => {
    renderWithApp(<ExamScreen />);
    expect(screen.getByText("Thoát")).toBeTruthy();
    expect(screen.getByText("Part 1")).toBeTruthy();
    expect(screen.getByText("Part 2")).toBeTruthy();
    expect(screen.getByText("Part 3")).toBeTruthy();
    expect(screen.getByLabelText("Bật/tắt giọng giám khảo")).toBeTruthy();
    expect(screen.getByText("PART 1")).toBeTruthy();
    expect(screen.getByText("Bắt đầu Part 1")).toBeTruthy();
  });

  it("walks all 8 steps including follow-ups and lists them in the pre-submit modal", () => {
    renderWithApp(<ExamScreen />);

    answerCurrent(); // p1-1
    expect(screen.getByText(/Hỏi nối tiếp · dựa trên “quite noisy at night”/)).toBeTruthy();
    answerCurrent(); // p1-1-f
    answerCurrent(); // p1-2
    answerCurrent(); // p1-3
    expect(screen.getByText("Bắt đầu Part 2")).toBeTruthy();
    answerCurrent(); // p2-1 (prep)
    expect(screen.getByText("Bắt đầu Part 3")).toBeTruthy();
    answerCurrent(); // p3-1
    answerCurrent(); // p3-1-f
    answerCurrent(); // p3-2 → review

    expect(screen.getByText("Kiểm tra trước khi nộp")).toBeTruthy();
    expect(screen.getByText("8 câu có thể làm giảm điểm. Bạn có thể nói lại trước khi chấm.")).toBeTruthy();
    const panel = screen.getByText("Kiểm tra trước khi nộp").parentElement as HTMLElement;
    expect(within(panel).getAllByText(/^Part \d · /)).toHaveLength(8);
    expect(within(panel).getAllByText(/^\d+ từ$/)).toHaveLength(8);
  });

  it("shows the Part 2 prep phase with a mm:ss countdown before recording", () => {
    renderWithApp(<ExamScreen />, { mode: "p2" });
    expect(screen.getByText("Bắt đầu Part 2")).toBeTruthy();
    fireEvent.click(screen.getByText("Bắt đầu Part 2"));
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(screen.getByText("CUE CARD")).toBeTruthy();
    expect(screen.getByText("1:00")).toBeTruthy();
    expect(screen.getByText("Sẵn sàng, bắt đầu nói")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("0:58")).toBeTruthy();
    fireEvent.click(screen.getByText("Sẵn sàng, bắt đầu nói"));
    expect(screen.getByLabelText("Dừng ghi")).toBeTruthy();
  });

  it("flags answers below MIN_WORDS", () => {
    renderWithApp(<ExamScreen />);
    fireEvent.click(screen.getByText("Bắt đầu Part 1"));
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    fireEvent.click(screen.getByLabelText("Bắt đầu ghi"));
    act(() => {
      vi.advanceTimersByTime(1000); // ~2 words < MIN_WORDS[1] = 12
    });
    fireEvent.click(screen.getByLabelText("Dừng ghi"));
    expect(screen.getByText("Câu trả lời khá ngắn (2 từ).")).toBeTruthy();
    expect(screen.getByText(/Part 1 vẫn hợp lệ nếu đủ ý/)).toBeTruthy();
  });

  it("submits via the pre-submit modal with pendingSubmission then routes to scoring", () => {
    const h = renderWithApp(<ExamScreen />);
    for (let k = 0; k < 8; k += 1) answerCurrent();
    fireEvent.click(screen.getByText("Vẫn nộp & chấm"));
    expect(h.setPendingSubmission).toHaveBeenCalledWith(true);
    expect(h.go).toHaveBeenCalledWith("scoring");
  });

  it("exits through the modal to select for a regular mock test", () => {
    const h = renderWithApp(<ExamScreen />);
    fireEvent.click(screen.getByText("Thoát"));
    expect(screen.getByText("Thoát phòng thi?")).toBeTruthy();
    expect(screen.getByText("Các câu đã trả lời sẽ không được chấm.")).toBeTruthy();
    const exits = screen.getAllByText("Thoát");
    fireEvent.click(exits[exits.length - 1]);
    expect(h.set).toHaveBeenCalledWith({ practice: null });
    expect(h.go).toHaveBeenCalledWith("select");
  });

  it("supports Space to record/stop and Enter to advance, ignoring keys while modals are open", () => {
    renderWithApp(<ExamScreen />);
    fireEvent.click(screen.getByText("Bắt đầu Part 1"));
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(screen.getByText("Bấm micro hoặc nhấn Space để trả lời")).toBeTruthy();
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByLabelText("Dừng ghi")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByText("Câu trả lời khá ngắn (2 từ).")).toBeTruthy();
    fireEvent.keyDown(window, { code: "Enter" });
    expect(screen.getByText(/Hỏi nối tiếp · dựa trên “quite noisy at night”/)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(3200); // follow-up fully asked → ready
    });
    expect(screen.getByLabelText("Bắt đầu ghi")).toBeTruthy();
    fireEvent.click(screen.getByText("Thoát")); // exit modal pauses all timers
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.queryByLabelText("Dừng ghi")).toBeNull();
  });
});

describe("ExamScreen (practice mode)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds steps from the practice session and exits to the forecast screen", () => {
    const h = renderWithApp(<ExamScreen />, { practice: PRACTICE, mode: "full" });
    expect(screen.getByText("Bắt đầu Part 1")).toBeTruthy();

    fireEvent.click(screen.getByText("Bắt đầu Part 1"));
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    // Practice bank replaces the default ITEMS bank.
    expect(screen.getByText(/Do you often help other people\?/)).toBeTruthy();
    expect(screen.queryByText(/Let's talk about where you live/)).toBeNull();

    fireEvent.click(screen.getByText("Thoát"));
    const exits = screen.getAllByText("Thoát");
    fireEvent.click(exits[exits.length - 1]);
    expect(h.set).toHaveBeenCalledWith({ practice: null });
    expect(h.go).toHaveBeenCalledWith("forecast");
  });
});

describe("ScoringScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Each act flush lets the effect chain schedule its next timeout. */
  function runScoringAnimation() {
    for (let k = 0; k < 7; k += 1) {
      act(() => {
        vi.advanceTimersByTime(700);
      });
    }
  }

  it("appends the attempt and replaces /scoring in history", () => {
    const h = renderWithApp(<ScoringScreen />, { practice: PRACTICE }, { pendingSubmission: true });
    const baseline = createInitialState().attempts.length;

    runScoringAnimation();

    const final = h.state();
    expect(final.attempts).toHaveLength(baseline + 1);
    const added = final.attempts[final.attempts.length - 1];
    expect(added.band).toBe(6.5);
    expect(added.mode).toBe("p2"); // practice kind p23 maps to p2
    expect(added.topic).toBe(`Forecast · ${PRACTICE.title}`);
    expect(final.practice).toBeNull();
    expect(h.setPendingSubmission).toHaveBeenCalledWith(false);
    expect(h.goResult).toHaveBeenCalledTimes(1);
    const [id, navOpts] = h.goResult.mock.calls[0] as [string, { replace?: boolean }];
    expect(navOpts).toEqual({ replace: true });
    expect(added.id).toBe(id);
  });


  it("tolerates a direct /scoring visit without committing an attempt", () => {
    const h = renderWithApp(<ScoringScreen />);
    const baseline = createInitialState().attempts.length;

    runScoringAnimation();

    expect(h.state().attempts).toHaveLength(baseline);
    expect(h.setLastUnpersistedAttempt).not.toHaveBeenCalled();
    expect(h.setPendingSubmission).not.toHaveBeenCalled();
    expect(h.goResult).toHaveBeenCalledWith("latest", { replace: true });
  });
});

describe("ResultsScreen", () => {
  it("renders the default latest result with the soft paywall while plan is null", () => {
    const h = renderWithApp(<ResultsScreen attemptId="latest" />);
    expect(screen.getByText(/Bạn đạt band 6\.5/)).toBeTruthy();
    expect(screen.getByText("6.0 – 7.0")).toBeTruthy();
    expect(screen.getByText("Xem vì sao bạn được từng band")).toBeTruthy();
    fireEvent.click(screen.getByText("Vốn từ vựng"));
    expect(h.openPaywall).toHaveBeenCalledTimes(1);
  });

  it("renders a concrete attempt's band, range and topic", () => {
    renderWithApp(<ResultsScreen attemptId="a3" />, { attempts: [...HISTORY] });
    expect(screen.getByText("Bạn đạt band 5.5")).toBeTruthy();
    expect(screen.getByText("5.5 – 6.0")).toBeTruthy();
    expect(screen.getByText(/A useful skill/)).toBeTruthy();
  });

  it("falls back to the default result for unknown ids without throwing", () => {
    renderWithApp(<ResultsScreen attemptId="missing-id" />, { attempts: [...HISTORY] });
    expect(screen.getByText(/Bạn đạt band 6\.5/)).toBeTruthy();
    expect(screen.getByText("6.0 – 7.0")).toBeTruthy();
  });

  it("reveals criteria detail and review mark popovers once the plan is unlocked", () => {
    const h = renderWithApp(<ResultsScreen attemptId="latest" />, {
      plan: { id: "pack", name: "Theo lượt", until: "Không hết hạn · 3 lượt" },
    });
    expect(screen.queryByText("Xem vì sao bạn được từng band")).toBeNull();
    expect(screen.queryByText("Mở khóa chi tiết →")).toBeNull();
    expect(screen.getByText("Bằng chứng từ câu bạn nói")).toBeTruthy();

    fireEvent.click(screen.getByText("Xem lại từng câu"));
    expect(screen.queryByText("Mở khóa đánh dấu lỗi")).toBeNull();
    fireEvent.click(screen.getByText("quite small"));
    expect(screen.getByText("on the cramped side")).toBeTruthy();
    fireEvent.click(screen.getByText("Vốn từ vựng"));
    expect(h.openPaywall).not.toHaveBeenCalled();
  });
});

describe("Billing & PaywallModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("activates a plan from the billing screen checkout (waiting → received → active)", () => {
    const h = renderWithApp(<BillingScreen />);
    fireEvent.click(screen.getByRole("button", { name: /7 ngày/ }));
    expect(screen.getByText("Quét mã để thanh toán")).toBeTruthy();
    expect(screen.getByText("Đang chờ thanh toán · hết hạn sau 10:00")).toBeTruthy();

    fireEvent.click(screen.getByText("Đã chuyển khoản"));
    expect(screen.getByText("Đã nhận tiền, đang kích hoạt…")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.getByRole("heading", { name: "Đã kích hoạt gói 7 ngày" })).toBeTruthy();
    expect(h.state().plan?.name).toBe("7 ngày");
    expect(h.toast).toHaveBeenCalledWith("Đã kích hoạt gói 7 ngày");

    fireEvent.click(screen.getByText("Xem chi tiết 4 tiêu chí"));
    expect(screen.queryByText("Quét mã để thanh toán")).toBeNull();
  });

  it("activates a plan through the paywall modal opened from results", () => {
    const h = renderWithApp(<ResultsScreen attemptId="latest" />);
    fireEvent.click(screen.getByText("Mở khóa từ 49.000đ"));
    expect(h.openPaywall).toHaveBeenCalledTimes(1);
    h.unmount();

    const paywall = createHarness();
    const onClose = vi.fn();
    render(
      <paywall.Provider>
        <PaywallModal open onClose={onClose} />
      </paywall.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Theo lượt/ }));
    fireEvent.click(screen.getByText("Đã chuyển khoản"));
    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.getByRole("heading", { name: "Đã kích hoạt gói Theo lượt" })).toBeTruthy();
    expect(paywall.state().plan?.name).toBe("Theo lượt");
    fireEvent.click(screen.getByText("Xem chi tiết 4 tiêu chí"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
