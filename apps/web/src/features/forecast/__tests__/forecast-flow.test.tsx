import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import type * as TanstackQuery from "@tanstack/react-query";
import { ExamScreen } from "@/features/exam/exam-screen";
import { ResultsScreen } from "@/features/results/results-screen";
import { ScoringScreen } from "@/features/scoring/scoring-screen";

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

function renderWithApp(ui: ReactNode, seed?: Partial<AppState>, initialPendingSubmission = false) {
  const go = vi.fn();
  const goResult = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();
  const setPendingSubmission = vi.fn();
  let latestState: AppState = { ...createInitialState(), ...seed };

  function Provider({ children }: { children: ReactNode }) {
    const [s, setS] = useState<AppState>(() => latestState);
    const [pending, setPending] = useState(initialPendingSubmission);
    latestState = s;
    const value: AppCtxValue = {
      s,
      set: (u) => {
        set(u);
        setS((prev) => {
          const next = { ...prev, ...(typeof u === "function" ? u(prev) : u) };
          latestState = next;
          return next;
        });
      },
      paywallOpen: false,
      openPaywall: vi.fn(),
      closePaywall: vi.fn(),
      toastMsg: null,
      toast,
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt: vi.fn(),
      pendingSubmission: pending,
      setPendingSubmission: (v) => {
        setPendingSubmission(v);
        setPending(v);
      },
      go,
      goResult,
    };
    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
  }

  const utils = render(<Provider>{ui}</Provider>);
  return { ...utils, go, goResult, set, toast, state: () => latestState };
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

      // Verify no runtime throw occurred and recorded successfully with valid transcript
      expect(screen.queryByText("(Không nhận được giọng nói)")).toBeNull();
      expect(screen.getByText("Câu tiếp theo")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("displays question history badge and allows starting single-question practice in Part 1", () => {
    const { set, go } = renderWithApp(<ForecastScreen />, {
      practicedQuestions: {
        "p1-tidiness-0": { band: 6.5, count: 2, lastPracticedAt: "2026-11-09" },
      },
    });

    fireEvent.click(screen.getByRole("heading", { name: "Tidiness" }));

    // History badge and count are rendered
    expect(screen.getByText("Band 6.5")).toBeTruthy();
    expect(screen.getByText("2 lần luyện")).toBeTruthy();

    // First question has 'Luyện lại', second question has 'Luyện câu này'
    const repeatBtn = screen.getByRole("button", {
      name: /Luyện lại: Were you a tidy person when you were a child\?/,
    });
    expect(repeatBtn).toBeTruthy();

    const startSingleBtn = screen.getByRole("button", {
      name: /Luyện câu này: Do you think it is possible for people to be tidy all the time\?/,
    });
    expect(startSingleBtn).toBeTruthy();

    fireEvent.click(repeatBtn);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        practice: expect.objectContaining({
          topicId: "p1-tidiness",
          singleQuestionId: "p1-tidiness-0",
          items: [
            expect.objectContaining({
              text: "Were you a tidy person when you were a child?",
            }),
          ],
        }),
      }),
    );
    expect(go).toHaveBeenCalledWith("exam");
  });

  it("starts single Part 3 question practice omitting Part 2 cue card", () => {
    const { set, go } = renderWithApp(<ForecastScreen />);
    fireEvent.click(screen.getByRole("button", { name: /^Part 2 & 3/ }));
    fireEvent.click(screen.getByRole("heading", { name: "Describe a person who helps to protect the environment" }));

    const startP3Btn = screen.getByRole("button", {
      name: /Luyện câu này: What things can people do to help to protect nature\?/,
    });
    expect(startP3Btn).toBeTruthy();

    fireEvent.click(startP3Btn);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        practice: expect.objectContaining({
          topicId: "p23-environment",
          singleQuestionId: "p23-environment-p3-0",
          items: [
            expect.objectContaining({
              part: 3,
              text: "What things can people do to help to protect nature?",
              cue: undefined,
            }),
          ],
        }),
      }),
    );
    expect(go).toHaveBeenCalledWith("exam");
  });

  it("updates practicedQuestions and assigns mode p1 or p3 when single question scoring finishes", () => {
    vi.useFakeTimers();
    try {
      const h = renderWithApp(
        <ScoringScreen />,
        {
          practice: {
            topicId: "p1-tidiness",
            title: "Tidiness",
            kind: "p1",
            items: [{ id: "p1-tidiness-0", part: 1, text: "Were you tidy?" }],
            singleQuestionId: "p1-tidiness-0",
            topicItems: [{ id: "p1-tidiness-0", part: 1, text: "Were you tidy?" }],
          },
        },
        true,
      );

      for (let k = 0; k < 7; k += 1) {
        act(() => {
          vi.advanceTimersByTime(700);
        });
      }

      const final = h.state();
      expect(final.practicedQuestions["p1-tidiness-0"]).toEqual({
        band: 6.5,
        count: 1,
        lastPracticedAt: expect.any(String),
      });
      const lastAttempt = final.attempts[final.attempts.length - 1];
      expect(lastAttempt.mode).toBe("p1");
      expect(final.lastPracticeSession?.singleQuestionId).toBe("p1-tidiness-0");
      expect(final.practiced["p1-tidiness"]).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("allows navigating to next question from ResultsScreen when practicing single question", () => {
    const { set, go } = renderWithApp(<ResultsScreen attemptId="latest" />, {
      attempts: [
        {
          id: "attempt-cur",
          date: "2026-11-09",
          mode: "p1",
          band: 6.5,
          range: [6.0, 7.0],
          topic: "Forecast · Tidiness",
        },
      ],
      lastPracticeSession: {
        topicId: "p1-tidiness",
        title: "Tidiness",
        kind: "p1",
        items: [{ id: "p1-tidiness-0", part: 1, text: "Question 1" }],
        singleQuestionId: "p1-tidiness-0",
        attemptId: "attempt-cur",
        topicItems: [
          { id: "p1-tidiness-0", part: 1, text: "Question 1" },
          { id: "p1-tidiness-1", part: 1, text: "Question 2" },
        ],
      },
    });

    const nextBtn = screen.getByTestId("next-question-btn");
    expect(nextBtn).toBeTruthy();
    expect(nextBtn.textContent).toContain("Luyện câu kế tiếp");

    fireEvent.click(nextBtn);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        practice: expect.objectContaining({
          topicId: "p1-tidiness",
          singleQuestionId: "p1-tidiness-1",
          items: [expect.objectContaining({ text: "Question 2" })],
        }),
      }),
    );
    expect(go).toHaveBeenCalledWith("exam");
  });

  it("does not show single-question practice CTA when viewing an arbitrary historical attempt", () => {
    renderWithApp(<ResultsScreen attemptId="h1" />, {
      attempts: [
        {
          id: "h1",
          date: "2026-11-01",
          mode: "p1",
          band: 6.0,
          range: [5.5, 6.5],
          topic: "Old attempt",
        },
      ],
      lastPracticeSession: {
        topicId: "p1-tidiness",
        title: "Tidiness",
        kind: "p1",
        items: [{ id: "p1-tidiness-0", part: 1, text: "Question 1" }],
        singleQuestionId: "p1-tidiness-0",
        attemptId: "attempt-different",
        topicItems: [
          { id: "p1-tidiness-0", part: 1, text: "Question 1" },
          { id: "p1-tidiness-1", part: 1, text: "Question 2" },
        ],
      },
    });

    expect(screen.queryByTestId("next-question-btn")).toBeNull();
  });
});
