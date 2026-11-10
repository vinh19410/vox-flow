import { act, render, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLANS } from "../../billing/data";
import { planUntil } from "../../billing/plan-utils";
import { ITEMS, MIN_WORDS, MODES, PART_INFO, VOICES, modeLabel } from "../../exam/data";
import { mapApiTopicToForecastTopic, p1, p23 } from "../../forecast/builders";
import { QUARTER } from "../../forecast/data";
import { HISTORY, resolveAttemptView } from "../../history/data";
import type { Attempt } from "../../history/types";
import { RESULT } from "@/test/fixtures/results-data";
import { MARK } from "../../results/review-data";
import { REVIEW } from "@/test/fixtures/review-data";
import { SCORING_STEPS } from "@/test/fixtures/scoring-data";
import { INITIAL_STATE, createInitialState } from "../initial-state";
import { PROTO_STORAGE_KEY, useAppStateStore } from "../store";
import { ProtoToast } from "../toast";

afterEach(() => {
  vi.useRealTimers();
});

describe("exam data & types", () => {
  it("exposes 6 exam items, 4 modes, 3 examiner voices, min words, and part info", () => {
    expect(ITEMS).toHaveLength(6);
    expect(ITEMS.map((i) => i.id)).toEqual(["p1-1", "p1-2", "p1-3", "p2-1", "p3-1", "p3-2"]);
    expect(ITEMS[3]?.cue?.points).toHaveLength(3);
    expect(ITEMS[0]?.followUp?.trigger).toBe("quite noisy at night");

    expect(MODES).toHaveLength(4);
    expect(modeLabel("full")).toBe("Full Test");
    expect(modeLabel("p2")).toBe("Part 2");

    expect(VOICES).toHaveLength(3);
    expect(VOICES[0]).toMatchObject({ id: "uk-f", name: "Emma", accent: "Anh · Nữ" });

    expect(MIN_WORDS).toEqual({ 1: 12, 2: 90, 3: 22 });
    expect(PART_INFO[1].title).toContain("Part 1");
    expect(PART_INFO[2].title).toContain("Part 2");
    expect(PART_INFO[3].title).toContain("Part 3");
  });
});

describe("forecast data & builders", () => {
  it("exposes Quarter 3/2026 metadata", () => {
    expect(QUARTER).toEqual({
      id: "2026-Q3",
      label: "Quý 3/2026",
      range: "Tháng 9 – Tháng 12",
      updated: "26/10/2026",
    });
  });

  it("maps api topics correctly to ForecastTopic for part 1 and part 2&3", () => {
    const p1Topic = mapApiTopicToForecastTopic({
      id: "api-p1",
      title: "Hometown",
      quarter: "2026-Q3",
      part: 1,
      questions: ["Where is your hometown?", "What do you like about it?"],
      status: "published",
      realReportCount: 42,
    });
    expect(p1Topic.kind).toBe("p1");
    expect(p1Topic.reports).toBe(42);
    expect(p1Topic.items).toHaveLength(2);
    expect(p1Topic.items[0]?.text).toBe("Where is your hometown?");

    const p23Topic = mapApiTopicToForecastTopic({
      id: "api-p23",
      title: "Describe a creative person",
      quarter: "2026-Q3",
      part: 2,
      questions: {
        cueCards: ["Who this person is", "How you met them", "And explain why creative"],
        part3: ["Is creativity important?", "Can it be taught?"],
      },
      status: "published",
      realReportCount: 88,
    });
    expect(p23Topic.kind).toBe("p23");
    expect(p23Topic.reports).toBe(88);
    expect(p23Topic.items).toHaveLength(3); // 1 cue card + 2 part 3
    expect(p23Topic.items[0]?.part).toBe(2);
    expect(p23Topic.items[0]?.cue?.points).toEqual(["Who this person is", "How you met them"]);
    expect(p23Topic.items[0]?.cue?.ending).toBe("And explain why creative");
    expect(p23Topic.items[1]?.part).toBe(3);
    expect(p23Topic.items[1]?.text).toBe("Is creativity important?");
  });
  it("builds p1 and p23 topics with targeted follow-up questions", () => {
    const builtP1 = p1(
      "t-p1",
      "Music",
      "Sở thích",
      100,
      "Hôm qua",
      [
        ["Q1?", "A1"],
        ["Q2?", "A2"],
      ],
      "hot",
      { at: 1, text: "Follow?", trigger: "A2", answer: "FA2" },
    );
    expect(builtP1.items[0]?.followUp).toBeUndefined();
    expect(builtP1.items[1]?.followUp?.text).toBe("Follow?");

    const builtP23 = p23(
      "t-p23",
      "A book",
      "Sở thích",
      80,
      "2 ngày trước",
      { title: "Describe a book.", points: ["what", "why"], ending: "explain.", answer: "Book ans" },
      [["P3 Q1?", "P3 A1"]],
      "new",
      { at: 0, text: "P3 Follow?", trigger: "P3 A1", answer: "P3 FA1" },
    );
    expect(builtP23.items).toHaveLength(2);
    expect(builtP23.items[0]?.part).toBe(2);
    expect(builtP23.items[1]?.part).toBe(3);
    expect(builtP23.items[1]?.followUp?.text).toBe("P3 Follow?");
  });
});

describe("results, review, scoring, and billing data", () => {
  it("exposes 4 band criteria, 5 review segments, mark styles, and 6 scoring steps", () => {
    expect(RESULT.overall).toBe(6.5);
    expect(RESULT.range).toEqual([6.0, 7.0]);
    expect(RESULT.criteria.map((c) => c.key)).toEqual(["FC", "LR", "GRA", "P"]);

    expect(REVIEW).toHaveLength(5);
    expect(REVIEW.map((r) => r.id)).toEqual(["r1", "r2", "r3", "r4", "r5"]);
    expect(Object.keys(MARK)).toEqual(["grammar", "vocab", "pron"]);

    expect(SCORING_STEPS).toHaveLength(6);
  });

  it("computes planUntil across pack, exam date, and day-offset plans", () => {
    expect(PLANS).toHaveLength(4);
    const packPlan = PLANS.find((p) => p.id === "pack")!;
    const examPlan = PLANS.find((p) => p.id === "exam")!;
    const weekPlan = PLANS.find((p) => p.id === "week")!;
    const monthPlan = PLANS.find((p) => p.id === "month")!;

    expect(planUntil(packPlan, "2026-12-01")).toBe("Không hết hạn · 3 lượt");
    expect(planUntil(examPlan, "2026-12-15")).toBe(
      new Date("2026-12-15").toLocaleDateString("vi-VN"),
    );

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T08:00:00Z"));

    const expectedPlusDays = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString("vi-VN");
    };

    expect(planUntil(weekPlan, null)).toBe(expectedPlusDays(7));
    expect(planUntil(monthPlan, null)).toBe(expectedPlusDays(30));
    expect(planUntil(examPlan, null)).toBe(expectedPlusDays(60));
  });
});

describe("history & resolveAttemptView", () => {
  const transient: Attempt = {
    id: "new-transient",
    date: "2026-11-04",
    mode: "full",
    band: 6.5,
    range: [6.0, 7.0],
    topic: "Forecast · Hometown",
  };

  it("contains 6 historical attempts a1..a6", () => {
    expect(HISTORY).toHaveLength(6);
    expect(HISTORY.map((a) => a.id)).toEqual(["a1", "a2", "a3", "a4", "a5", "a6"]);
  });

  it("resolves 'latest', concrete IDs, transient attempt, missing IDs, and empty history", () => {
    expect(resolveAttemptView(HISTORY, "latest", transient)).toEqual({
      isDefaultLatest: true,
      attempt: null,
    });

    const a3 = resolveAttemptView(HISTORY, "a3", null);
    expect(a3.isDefaultLatest).toBe(false);
    expect(a3.attempt?.band).toBe(5.5);
    expect(a3.attempt?.mode).toBe("p2");

    expect(resolveAttemptView(HISTORY, "new-transient", transient)).toEqual({
      isDefaultLatest: false,
      attempt: transient,
    });

    expect(resolveAttemptView(HISTORY, "missing", null)).toEqual({
      isDefaultLatest: true,
      attempt: null,
    });

    expect(() => resolveAttemptView([], "missing", null)).not.toThrow();
    expect(resolveAttemptView([], "missing")).toEqual({
      isDefaultLatest: true,
      attempt: null,
    });
  });
});

describe("useAppStateStore & ProtoToast", () => {
  it("hydrates initial state, persists updates to sessionStorage, and rehydrates on remount", () => {
    const initial = createInitialState();
    expect(INITIAL_STATE.name).toBe("");
    expect(initial.attempts).toHaveLength(0);

    const { result, unmount } = renderHook(() => useAppStateStore());
    expect(result.current.s.name).toBe("");
    expect(result.current.s.target).toBe(7.0);

    act(() => {
      result.current.set({ name: "Bảo Châu", voice: "au-f", mode: "p2" });
      result.current.set((prev) => ({ target: prev.target + 0.5 }));
    });

    expect(result.current.s.name).toBe("Bảo Châu");
    expect(result.current.s.target).toBe(7.5);
    expect(result.current.s.voice).toBe("au-f");
    expect(result.current.s.mode).toBe("p2");

    const raw = sessionStorage.getItem(PROTO_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({
      mode: "p2",
      voice: "au-f",
      practice: null,
      scoringAttempt: null,
    });
    expect(parsed.name).toBeUndefined();
    expect(parsed.target).toBeUndefined();

    unmount();

    const remounted = renderHook(() => useAppStateStore());
    // Name and target are not restored from sessionStorage
    expect(remounted.result.current.s.name).toBe("");
    expect(remounted.result.current.s.target).toBe(7.0);
    // UI preferences are restored
    expect(remounted.result.current.s.voice).toBe("au-f");
    expect(remounted.result.current.s.mode).toBe("p2");
  });
  it("persists practice session and rehydrates correctly while ignoring server-owned attempts", () => {
    const practiceSample = {
      topicId: "p1-tidiness",
      title: "Tidiness",
      kind: "p1" as const,
      items: [{ id: "p1-tidiness-0", part: 1 as const, text: "Do you keep things tidy?", answer: "" }],
    };
    const { result, unmount } = renderHook(() => useAppStateStore());
    act(() => {
      result.current.set({
        practice: practiceSample,
        attempts: [{ id: "att-1", date: "2026-11-09", mode: "full", band: 7.0, range: [6.5, 7.5], topic: "Topic" }],
      });
    });
    expect(result.current.s.practice?.topicId).toBe("p1-tidiness");
    expect(result.current.s.attempts).toHaveLength(1);
    unmount();

    const remounted = renderHook(() => useAppStateStore());
    expect(remounted.result.current.s.practice?.topicId).toBe("p1-tidiness");
    // Server-owned attempts are not restored across remount
    expect(remounted.result.current.s.attempts).toHaveLength(0);
  });
  it("persists the pending scoring attempt so a refresh on the scoring screen keeps polling it", () => {
    const { result, unmount } = renderHook(() => useAppStateStore());
    act(() => {
      result.current.set({ scoringAttempt: { attemptId: "att-forecast", submitted: true } });
    });
    unmount();

    const remounted = renderHook(() => useAppStateStore());
    expect(remounted.result.current.s.scoringAttempt).toEqual({ attemptId: "att-forecast", submitted: true });
  });
  it("falls back safely to initial state when sessionStorage has malformed JSON", () => {
    sessionStorage.setItem(PROTO_STORAGE_KEY, "{corrupt-json");
    const { result } = renderHook(() => useAppStateStore());
    expect(result.current.s.name).toBe("");
    expect(result.current.s.target).toBe(7.0);
  });

  it("manages paywallOpen, lastUnpersistedAttempt, pendingSubmission, and 3200ms toast auto-clear", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useAppStateStore());

    const unpersisted: Attempt = {
      id: "temp-1",
      date: "2026-11-04",
      mode: "p1",
      band: 6.5,
      range: [6.0, 7.0],
      topic: "Part 1",
    };

    act(() => {
      result.current.openPaywall();
      result.current.setLastUnpersistedAttempt(unpersisted);
      result.current.setPendingSubmission(true);
      result.current.toast("Đã lưu thay đổi");
    });

    expect(result.current.paywallOpen).toBe(true);
    expect(result.current.lastUnpersistedAttempt).toEqual(unpersisted);
    expect(result.current.pendingSubmission).toBe(true);
    expect(result.current.toastMsg).toBe("Đã lưu thay đổi");

    act(() => {
      vi.advanceTimersByTime(3199);
    });
    expect(result.current.toastMsg).toBe("Đã lưu thay đổi");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toastMsg).toBeNull();

    act(() => {
      result.current.closePaywall();
    });
    expect(result.current.paywallOpen).toBe(false);

    unmount();
  });

  it("renders ProtoToast only when message is non-null", () => {
    const empty = render(createElement(ProtoToast, { message: null }));
    expect(empty.container.firstChild).toBeNull();
    empty.unmount();

    const shown = render(createElement(ProtoToast, { message: "Đã xóa dữ liệu bài làm" }));
    expect(shown.getByText("Đã xóa dữ liệu bài làm")).toBeTruthy();
  });
});
