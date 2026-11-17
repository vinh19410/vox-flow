import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queueSpy = vi.fn();
const searchOrdersSpy = vi.fn();
const activateSpy = vi.fn();
const markRefundedSpy = vi.fn();
const triggerSweepSpy = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    adminBilling: {
      checkAdmin: {
        query: () => Promise.resolve({ isAdmin: true }),
      },
      queue: {
        query: (...args: unknown[]) => queueSpy(...args),
      },
      searchOrders: {
        query: (...args: unknown[]) => searchOrdersSpy(...args),
      },
      activate: {
        mutate: (...args: unknown[]) => activateSpy(...args),
      },
      markRefunded: {
        mutate: (...args: unknown[]) => markRefundedSpy(...args),
      },
      triggerSweep: {
        mutate: (...args: unknown[]) => triggerSweepSpy(...args),
      },
    },
  },
}));

import {
  PaymentsScreen,
  type PaymentMetrics,
  type PaymentQueueItem,
  type PaymentSearchOrderItem,
} from "../payments-screen";

describe("PaymentsScreen", () => {
  const now = Date.now();

  const mockMetrics: PaymentMetrics = {
    pendingCount: 4,
    overdueCount: 1,
    nearOverdueCount: 1,
    resolvedCount: 7,
  };

  const mockQueue: PaymentQueueItem[] = [
    {
      id: "evt_underpaid_1",
      sepayId: 1001,
      sepayUuid: "uuid-1001",
      transferType: "in",
      gateway: "MBBank",
      accountNumber: "0123456789",
      subAccount: "",
      transferAmount: 100000,
      extractedCode: "VFMONTH01",
      referenceCode: "FT26001",
      transactionDate: "2026-11-15 10:00:00",
      orderId: "ord_underpaid_1",
      matchStatus: "amount_mismatch",
      classification: "underpaid",
      resolutionStatus: "pending_review",
      source: "webhook",
      createdAt: new Date(now - 26 * 3600 * 1000),
      userEmail: "thieu@example.com",
      userName: "Nguyễn Thiếu",
      order: {
        id: "ord_underpaid_1",
        userId: "usr_1",
        planId: "month",
        planName: "Gói Tháng",
        amountVnd: 199000,
        transferCode: "VFMONTH01",
        status: "pending",
        expiresAt: new Date(now + 1800 * 1000),
        createdAt: new Date(now - 26 * 3600 * 1000),
      },
      actions: [],
      slaDueAt: new Date(now - 2 * 3600 * 1000),
      isNearOverdue: true,
      isOverdue: true,
    },
    {
      id: "evt_overpaid_2",
      sepayId: 1002,
      sepayUuid: "uuid-1002",
      transferType: "in",
      gateway: "Vietcombank",
      accountNumber: "0123456789",
      subAccount: "",
      transferAmount: 220000,
      extractedCode: "VFMONTH02",
      referenceCode: "FT26002",
      transactionDate: "2026-11-16 02:00:00",
      orderId: "ord_overpaid_2",
      matchStatus: "amount_mismatch",
      classification: "overpaid",
      resolutionStatus: "pending_review",
      source: "cron_sweep",
      createdAt: new Date(now - 20 * 3600 * 1000),
      userEmail: "thua@example.com",
      userName: "Trần Thừa",
      order: {
        id: "ord_overpaid_2",
        userId: "usr_2",
        planId: "month",
        planName: "Gói Tháng",
        amountVnd: 199000,
        transferCode: "VFMONTH02",
        status: "pending",
        expiresAt: new Date(now + 1800 * 1000),
        createdAt: new Date(now - 20 * 3600 * 1000),
      },
      actions: [],
      slaDueAt: new Date(now + 4 * 3600 * 1000),
      isNearOverdue: true,
      isOverdue: false,
    },
    {
      id: "evt_unknown_3",
      sepayId: 1003,
      sepayUuid: "uuid-1003",
      transferType: "in",
      gateway: "Techcombank",
      accountNumber: "0123456789",
      subAccount: "",
      transferAmount: 79000,
      extractedCode: null,
      referenceCode: "FT26003",
      transactionDate: "2026-11-16 20:00:00",
      orderId: null,
      matchStatus: "unknown_code",
      classification: "unknown_code",
      resolutionStatus: "pending_review",
      source: "webhook",
      createdAt: new Date(now - 2 * 3600 * 1000),
      userEmail: null,
      userName: null,
      order: null,
      actions: [],
      slaDueAt: new Date(now + 22 * 3600 * 1000),
      isNearOverdue: false,
      isOverdue: false,
    },
    {
      id: "evt_expired_4",
      sepayId: 1004,
      sepayUuid: "uuid-1004",
      transferType: "in",
      gateway: "ACB",
      accountNumber: "0123456789",
      subAccount: "",
      transferAmount: 99000,
      extractedCode: "VFWEEK04",
      referenceCode: "FT26004",
      transactionDate: "2026-11-16 21:00:00",
      orderId: "ord_expired_4",
      matchStatus: "order_not_pending",
      classification: "expired_order",
      resolutionStatus: "pending_review",
      source: "webhook",
      createdAt: new Date(now - 1 * 3600 * 1000),
      userEmail: "hethan@example.com",
      userName: "Lê Hết Hạn",
      order: {
        id: "ord_expired_4",
        userId: "usr_4",
        planId: "week",
        planName: "Gói Tuần",
        amountVnd: 99000,
        transferCode: "VFWEEK04",
        status: "expired",
        expiresAt: new Date(now - 3600 * 1000),
        createdAt: new Date(now - 5 * 3600 * 1000),
      },
      actions: [
        {
          id: "act_prev_1",
          eventId: "evt_expired_4",
          orderId: "ord_expired_4",
          action: "activate",
          note: "Đã kiểm tra trước đó",
          actorEmail: "admin@voxflow.vn",
          createdAt: new Date(now - 1800 * 1000),
        },
      ],
      slaDueAt: new Date(now + 23 * 3600 * 1000),
      isNearOverdue: false,
      isOverdue: false,
    },
  ];

  const mockSearchOrders: PaymentSearchOrderItem[] = [
    {
      id: "ord_match_target",
      userId: "usr_target",
      userEmail: "hocvien@example.com",
      userName: "Phạm Học Viên",
      planId: "pack",
      planName: "Gói Theo lượt",
      amountVnd: 79000,
      transferCode: "VFPACK99",
      status: "pending",
      expiresAt: new Date(now + 3600 * 1000),
      paidAt: null,
      createdAt: new Date(now - 3600 * 1000),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queueSpy.mockResolvedValue({
      items: mockQueue,
      metrics: mockMetrics,
    });
    searchOrdersSpy.mockResolvedValue(mockSearchOrders);
    activateSpy.mockResolvedValue({
      success: true,
      eventId: "evt_unknown_3",
      orderId: "ord_match_target",
      actionId: "act_1",
    });
    markRefundedSpy.mockResolvedValue({
      success: true,
      eventId: "evt_underpaid_1",
      orderId: "ord_underpaid_1",
      actionId: "act_2",
    });
    triggerSweepSpy.mockResolvedValue({
      fetched: 12,
      inserted: 2,
      skipped: 10,
    });
  });

  it("renders metrics, queue classifications, SLA 24h badges, and underpaid policy", () => {
    render(<PaymentsScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    // Metrics
    expect(screen.getByTestId("metric-pending-count").textContent).toBe("4");
    expect(screen.getByTestId("metric-overdue-count").textContent).toBe("1");
    expect(screen.getByTestId("metric-near-overdue-count").textContent).toBe("1");
    expect(screen.getByTestId("metric-resolved-count").textContent).toBe("7");

    // Classifications
    expect(screen.getByTestId("badge-classification-evt_underpaid_1").textContent).toBe(
      "Thiếu tiền",
    );
    expect(screen.getByTestId("badge-classification-evt_overpaid_2").textContent).toBe(
      "Thừa tiền",
    );
    expect(screen.getByTestId("badge-classification-evt_unknown_3").textContent).toBe(
      "Sai/thiếu mã",
    );
    expect(screen.getByTestId("badge-classification-evt_expired_4").textContent).toBe(
      "Đơn hết hạn",
    );

    // 24h SLA badges
    expect(screen.getByTestId("badge-sla-overdue-evt_underpaid_1").textContent).toContain(
      "Quá hạn SLA 24h",
    );
    expect(screen.getByTestId("badge-sla-near-overdue-evt_overpaid_2").textContent).toContain(
      "Sắp quá hạn",
    );

    // Underpaid policy: no activate button, shows policy notice
    expect(screen.getByTestId("policy-underpaid-evt_underpaid_1").textContent).toContain(
      "chỉ hoàn tiền thủ công ngoài ngân hàng, không nhận chuyển bù",
    );
    expect(screen.queryByTestId("btn-activate-evt_underpaid_1")).toBeNull();
    expect(screen.getByTestId("btn-refund-evt_underpaid_1")).toBeTruthy();

    // Action history rendered
    expect(screen.getByTestId("action-history-evt_expired_4").textContent).toContain(
      "Đã kiểm tra trước đó",
    );
  });

  it("renders access denied state when accessDeniedForTest is true", () => {
    render(<PaymentsScreen accessDeniedForTest={true} />);

    expect(screen.getByTestId("access-denied")).toBeTruthy();
    expect(screen.getByText("Truy cập bị từ chối")).toBeTruthy();
  });

  it("requires non-empty note before submitting activate or markRefunded", async () => {
    render(<PaymentsScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    // Test activate note validation on overpaid item (has orderId)
    fireEvent.click(screen.getByTestId("btn-activate-evt_overpaid_2"));
    expect(screen.getByTestId("payment-action-modal")).toBeTruthy();

    // Submit with whitespace-only note
    fireEvent.change(screen.getByTestId("textarea-payment-note"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByTestId("btn-submit-payment-action"));

    expect(screen.getByTestId("note-validation-error").textContent).toContain(
      "Vui lòng nhập ghi chú xử lý",
    );
    expect(activateSpy).not.toHaveBeenCalled();

    // Now provide valid note
    fireEvent.change(screen.getByTestId("textarea-payment-note"), {
      target: { value: "Đã xác nhận thừa tiền, kích hoạt gói" },
    });
    fireEvent.click(screen.getByTestId("btn-submit-payment-action"));

    await waitFor(() => {
      expect(activateSpy).toHaveBeenCalledWith({
        eventId: "evt_overpaid_2",
        orderId: "ord_overpaid_2",
        note: "Đã xác nhận thừa tiền, kích hoạt gói",
      });
    });

    // Test markRefunded note validation on underpaid item
    fireEvent.click(screen.getByTestId("btn-refund-evt_underpaid_1"));
    expect(screen.getByTestId("refund-policy-reminder").textContent).toContain(
      "Hoàn tiền được thực hiện thủ công ngoài ngân hàng",
    );
    fireEvent.click(screen.getByTestId("btn-submit-payment-action"));

    expect(screen.getByTestId("note-validation-error")).toBeTruthy();
    expect(markRefundedSpy).not.toHaveBeenCalled();
  });

  it("searches orders for unknown_code event and passes selected orderId to activate", async () => {
    render(<PaymentsScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    fireEvent.click(screen.getByTestId("btn-activate-evt_unknown_3"));

    // Submit disabled until an orderId is selected
    const submitBtn = screen.getByTestId("btn-submit-payment-action") as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    // Search orders by query
    const searchInput = screen.getByTestId("input-search-orders");
    fireEvent.change(searchInput, { target: { value: "VFPACK99" } });

    await waitFor(() => {
      expect(searchOrdersSpy).toHaveBeenCalledWith({ query: "VFPACK99" });
    });

    const orderOption = await screen.findByTestId("order-option-ord_match_target");
    fireEvent.click(orderOption);

    expect(submitBtn.disabled).toBe(false);

    fireEvent.change(screen.getByTestId("textarea-payment-note"), {
      target: { value: "Khớp thủ công theo sao kê ngân hàng" },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(activateSpy).toHaveBeenCalledWith({
        eventId: "evt_unknown_3",
        orderId: "ord_match_target",
        note: "Khớp thủ công theo sao kê ngân hàng",
      });
    });
    await waitFor(() => {
      expect(queueSpy).toHaveBeenCalled();
    });
  });

  it("calls markRefunded on underpaid event and triggerSweep on Quét SePay ngay", async () => {
    render(<PaymentsScreen initialQueue={mockQueue} initialMetrics={mockMetrics} />);

    // Mark refunded on underpaid
    fireEvent.click(screen.getByTestId("btn-refund-evt_underpaid_1"));
    fireEvent.change(screen.getByTestId("textarea-payment-note"), {
      target: { value: "Đã chuyển hoàn 100.000đ qua VCB" },
    });
    fireEvent.click(screen.getByTestId("btn-submit-payment-action"));

    await waitFor(() => {
      expect(markRefundedSpy).toHaveBeenCalledWith({
        eventId: "evt_underpaid_1",
        note: "Đã chuyển hoàn 100.000đ qua VCB",
      });
    });

    // Trigger SePay sweep
    fireEvent.click(screen.getByTestId("btn-trigger-sweep"));

    await waitFor(() => {
      expect(triggerSweepSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByTestId("sweep-feedback")).toBeTruthy();
    expect(screen.getByTestId("sweep-feedback").textContent).toContain(
      "tải 12 giao dịch, thêm mới 2, bỏ qua 10",
    );
  });
});
