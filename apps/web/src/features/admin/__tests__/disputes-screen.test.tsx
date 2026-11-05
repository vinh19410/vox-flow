import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DisputeCaseResponse } from "@vox-flow/api/routers/dispute-admin";

const getCaseSpy = vi.fn();
const resolveSpy = vi.fn();
const queueSpy = vi.fn();
const metricsSpy = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    disputeAdmin: {
      getCase: {
        query: (...args: unknown[]) => getCaseSpy(...args),
      },
      resolve: {
        mutate: (...args: unknown[]) => resolveSpy(...args),
      },
      queue: {
        query: (...args: unknown[]) => queueSpy(...args),
      },
      metrics: {
        query: (...args: unknown[]) => metricsSpy(...args),
      },
      checkAdmin: {
        query: () => Promise.resolve({ isAdmin: true }),
      },
    },
  },
}));

import {
  DisputesScreen,
  type DisputeItem,
  type DisputeMetrics,
} from "../disputes-screen";

describe("DisputesScreen", () => {
  const mockMetrics: DisputeMetrics = {
    totalCount: 5,
    openCount: 2,
    resolvedCount: 3,
    onTimeRate: 96.5,
    weeklyCount: 4,
    nearOverdueCount: 1,
  };

  const mockQueue: DisputeItem[] = [
    {
      id: "disp_test_consent",
      attemptId: "att_test_1",
      userId: "usr_student_1",
      studentName: "Nguyễn Văn A",
      studentEmail: "vana@example.com",
      targetCriterion: "FC",
      expectedBand: "6.5",
      reason: "Nói lưu loát, ít ngập ngừng nhưng chỉ được 6.0",
      shareConsent: true,
      status: "open",
      dueAt: new Date(Date.now() + 48 * 3600 * 1000),
      createdAt: new Date(),
      previousBand: "6.0",
      isNearOverdue: false,
    },
    {
      id: "disp_test_no_consent",
      attemptId: "att_test_2",
      userId: "usr_student_2",
      studentName: "Trần Thị B",
      studentEmail: "thib@example.com",
      targetCriterion: "PRON",
      expectedBand: "7.0",
      reason: "Phát âm rõ ràng các âm đuôi",
      shareConsent: false,
      status: "open",
      dueAt: new Date(Date.now() + 8 * 3600 * 1000),
      createdAt: new Date(),
      previousBand: "6.5",
      isNearOverdue: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getCaseSpy.mockImplementation(async (args: { id: string }) => {
      const item = mockQueue.find((q) => q.id === args.id);
      if (!item) return null;
      const detail: DisputeCaseResponse = {
        dispute: {
          id: item.id,
          attemptId: item.attemptId,
          userId: item.userId,
          studentName: item.studentName,
          studentEmail: item.studentEmail,
          targetCriterion: item.targetCriterion,
          expectedBand: item.expectedBand,
          reason: item.reason,
          shareConsent: item.shareConsent,
          status: item.status,
          dueAt: new Date(item.dueAt),
          warnedAt: item.warnedAt ? new Date(item.warnedAt) : null,
          resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : null,
          previousBand: item.previousBand ?? null,
          resolvedBand: item.resolvedBand ?? null,
          replyText: item.replyText ?? null,
          createdAt: new Date(item.createdAt),
        },
        attempt: {
          id: item.attemptId,
          mode: "full",
          status: "submitted",
          startedAt: new Date(),
          submittedAt: new Date(),
        },
        answers: [
          {
            id: `ans_${item.attemptId}`,
            questionKey: "p1_q1",
            questionText: "Sample question",
            partNumber: 1,
            orderIndex: 0,
            durationMs: 15000,
            mimeType: "audio/webm",
            createdAt: new Date(),
            audioPlayable: item.shareConsent,
            audioUrl: item.shareConsent ? `/api/attempts/${item.attemptId}/answers/ans_1/audio` : null,
          },
        ],
      };
      return detail;
    });
  });

  it("renders dispute queue list and operational metrics correctly", () => {
    render(<DisputesScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    // Metrics banner
    expect(screen.getByTestId("metric-ontime-rate").textContent).toContain("96.5%");
    expect(screen.getByTestId("metric-weekly-count").textContent).toContain("4");
    expect(screen.getByTestId("metric-near-overdue-count").textContent).toContain("1");

    // Queue items
    expect(screen.getByText("Nguyễn Văn A")).toBeTruthy();
    expect(screen.getByText("Trần Thị B")).toBeTruthy();
    expect(screen.getByTestId("badge-near-overdue").textContent).toContain("Sắp quá hạn (<12h)");
  });

  it("indicates audio permission: shows audio allowed badge for consented dispute", () => {
    render(<DisputesScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    expect(screen.getByTestId("audio-consented").textContent).toContain("Có quyền nghe audio");
    expect(screen.getByTestId("audio-no-consent").textContent).toContain("Không có quyền nghe audio");
  });

  it("shows audio access denied notice in modal when student did not consent", async () => {
    render(<DisputesScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    // Open non-consented case modal
    const openBtn = screen.getByTestId("btn-resolve-disp_test_no_consent");
    fireEvent.click(openBtn);

    // Modal should render denied notice
    expect(await screen.findByTestId("audio-denied-notice")).toBeTruthy();
    expect(screen.getByTestId("audio-denied-notice").textContent).toContain("Không xem được audio");
    expect(screen.getByTestId("modal-audio-denied-badge").textContent).toContain("Không được phép nghe");

    // Audio player should NOT be rendered
    expect(screen.queryByTestId("audio-playable-section")).toBeNull();
  });

  it("allows audio playback in modal when student consented", async () => {
    render(<DisputesScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    // Open consented case modal
    const openBtn = screen.getByTestId("btn-resolve-disp_test_consent");
    fireEvent.click(openBtn);

    expect(await screen.findByTestId("audio-playable-section")).toBeTruthy();
    expect(screen.queryByTestId("audio-denied-notice")).toBeNull();
  });

  it("switches reply text when choosing response templates", async () => {
    render(<DisputesScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    fireEvent.click(screen.getByTestId("btn-resolve-disp_test_consent"));

    // Default template is accept
    const textarea = (await screen.findByTestId("textarea-reply-text")) as HTMLTextAreaElement;
    expect(textarea.value).toContain("hệ thống AI đã chấm khắt khe hơn");

    // Click reject template
    const rejectTmplBtn = screen.getByText("Giữ nguyên điểm số");
    fireEvent.click(rejectTmplBtn);

    expect(textarea.value).toContain("kết quả hiện tại đã phản ánh chính xác");
  });

  it("renders access denied view when user is not authorized", () => {
    render(<DisputesScreen accessDeniedForTest={true} />);

    expect(screen.getByTestId("access-denied")).toBeTruthy();
    expect(screen.getByText("Truy cập bị từ chối")).toBeTruthy();
  });
});
