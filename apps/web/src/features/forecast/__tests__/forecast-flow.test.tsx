import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import type * as TanstackQuery from "@tanstack/react-query";
import { ExamScreen } from "@/features/exam/exam-screen";

import { createInitialState } from "@/features/app-state/initial-state";
import { AppCtx, type AppCtxValue, type AppState } from "@/features/app-state/types";
import { ForecastScreen } from "../forecast-screen";

const mockApiForecast = [
  {
    id: "p1-tidiness",
    title: "Tidiness",
    quarter: "2026-Q3",
    part: 1,
    questions: [
      "Were you a tidy person when you were a child?",
      "Do you think it is possible for people to be tidy all the time?",
    ],
    status: "published",
    realReportCount: 350,
  },
  {
    id: "p23-environment",
    title: "Describe a person who helps to protect the environment",
    quarter: "2026-Q3",
    part: 2,
    questions: {
      cueCards: [
        "Who the person is",
        "How this person encourages people",
        "And explain how you feel about this person",
      ],
      part3: [
        "What things can people do to help to protect nature?",
        "Do you think there is a need for new laws?",
      ],
    },
    status: "published",
    realReportCount: 420,
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

function renderWithApp(ui: ReactNode, seed?: Partial<AppState>) {
  const go = vi.fn();
  const goResult = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();
  const setPendingSubmission = vi.fn();

  function Provider({ children }: { children: ReactNode }) {
    const [s, setS] = useState<AppState>(() => ({ ...createInitialState(), ...seed }));
    const value: AppCtxValue = {
      s,
      set: (u) => {
        set(u);
        setS((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
      },
      paywallOpen: false,
      openPaywall: vi.fn(),
      closePaywall: vi.fn(),
      toastMsg: null,
      toast,
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt: vi.fn(),
      pendingSubmission: false,
      setPendingSubmission,
      go,
      goResult,
    };
    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
  }

  const utils = render(<Provider>{ui}</Provider>);
  return { ...utils, go, set, toast };
}

describe("Forecast practice flow", () => {
  it("starts practice session from a Part 1 topic and navigates to /exam", () => {
    const { set, go } = renderWithApp(<ForecastScreen />);

    // Click topic card to open modal
    fireEvent.click(screen.getByRole("heading", { name: "Tidiness" }));

    // Modal opens, click "Luyện chủ đề này"
    const startBtn = screen.getByRole("button", { name: /Luyện chủ đề này/ });
    fireEvent.click(startBtn);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        practice: expect.objectContaining({
          topicId: "p1-tidiness",
          title: "Tidiness",
          kind: "p1",
          items: expect.arrayContaining([
            expect.objectContaining({
              part: 1,
              text: "Were you a tidy person when you were a child?",
            }),
          ]),
        }),
      }),
    );
    expect(go).toHaveBeenCalledWith("exam");
  });

  it("starts practice session from a Part 2 & 3 topic and navigates to /exam", () => {
    const { set, go } = renderWithApp(<ForecastScreen />);

    // Switch to Part 2 & 3 tab
    fireEvent.click(screen.getByRole("button", { name: /^Part 2 & 3/ }));

    // Click Part 2 & 3 topic card
    fireEvent.click(screen.getByRole("heading", { name: "Describe a person who helps to protect the environment" }));

    // Modal opens, click "Luyện chủ đề này"
    const startBtn = screen.getByRole("button", { name: /Luyện chủ đề này/ });
    expect(startBtn).toBeTruthy();
    fireEvent.click(startBtn);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        practice: expect.objectContaining({
          topicId: "p23-environment",
          title: "Describe a person who helps to protect the environment",
          kind: "p23",
          items: expect.arrayContaining([
            expect.objectContaining({
              part: 2,
              cue: expect.objectContaining({
                title: "Describe a person who helps to protect the environment",
                points: ["Who the person is", "How this person encourages people"],
                ending: "And explain how you feel about this person",
              }),
            }),
            expect.objectContaining({
              part: 3,
              text: "What things can people do to help to protect nature?",
            }),
          ]),
        }),
      }),
    );
    expect(go).toHaveBeenCalledWith("exam");
  });

  it("runs an actual exam session with a seeded forecast topic without answers and records words", () => {
    vi.useFakeTimers();
    try {
      const { set } = renderWithApp(<ForecastScreen />);
      fireEvent.click(screen.getByRole("heading", { name: "Tidiness" }));
      fireEvent.click(screen.getByRole("button", { name: /Luyện chủ đề này/ }));

      const capturedPractice = set.mock.calls[0]?.[0]?.practice;
      expect(capturedPractice).toBeDefined();
      expect(capturedPractice.items[0]?.answer).toBeUndefined();

      cleanup();
      // Render ExamScreen with that practice session
      renderWithApp(<ExamScreen />, { practice: capturedPractice });
      expect(screen.getByText("Part 1")).toBeTruthy();
      expect(screen.getByText("Bắt đầu Part 1")).toBeTruthy();

      // Step through first question: intro -> asking -> recording -> answered
      const begin = screen.queryByText(/^Bắt đầu Part \d$/);
      if (begin) fireEvent.click(begin);
      act(() => {
        vi.advanceTimersByTime(3200);
      });
      const mic = screen.queryByLabelText("Bắt đầu ghi");
      if (mic) fireEvent.click(mic);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      const stop = screen.getByLabelText("Dừng ghi");
      fireEvent.click(stop);

      // Verify no runtime throw occurred and recorded successfully
      expect(screen.getByText("Câu tiếp theo")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
