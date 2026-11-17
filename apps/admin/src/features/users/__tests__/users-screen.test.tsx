import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listSpy = vi.fn();
const detailSpy = vi.fn();
const grantPlanSpy = vi.fn();
const adjustQuotaSpy = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    className,
  }: {
    to: string;
    params?: Record<string, string>;
    children: ReactNode;
    className?: string;
  }) => {
    const href = params?.userId ? to.replace("$userId", params.userId) : to;
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    adminUsers: {
      list: {
        query: (...args: unknown[]) => listSpy(...args),
      },
      detail: {
        query: (...args: unknown[]) => detailSpy(...args),
      },
      grantPlan: {
        mutate: (...args: unknown[]) => grantPlanSpy(...args),
      },
      adjustQuota: {
        mutate: (...args: unknown[]) => adjustQuotaSpy(...args),
      },
    },
  },
}));

const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessSpy(...args),
    error: (...args: unknown[]) => toastErrorSpy(...args),
  },
}));

import { UserDetailScreen, type AdminUserDetailResult } from "../user-detail-screen";
import { UsersScreen, type AdminUsersListResult } from "../users-screen";

const now = Date.now();

const mockListResult: AdminUsersListResult = {
  items: [
    {
      id: "usr_paid_1",
      name: "Nguyễn Văn An",
      email: "an@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(now - 5 * 86400_000),
      planStatus: "active_paid",
      profile: {
        targetBand: 7.5,
        examDate: "2026-12-20",
        onboardedAt: new Date(now - 5 * 86400_000),
      },
      subscription: {
        planId: "month",
        planName: "30 ngày",
        pointsRemaining: 95,
        planPointsTotal: 120,
        expiresAt: new Date(now + 20 * 86400_000),
        isActive: true,
      },
      detailCredits: 2,
      paidOrderCount: 1,
      totalPaidVnd: 249_000,
      lastOrderAt: new Date(now - 2 * 86400_000),
    },
    {
      id: "usr_free_2",
      name: "Trần Thị Bình",
      email: "binh@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(now - 2 * 86400_000),
      planStatus: "free",
      profile: null,
      subscription: null,
      detailCredits: 0,
      paidOrderCount: 0,
      totalPaidVnd: 0,
      lastOrderAt: null,
    },
  ],
  total: 2,
};

const mockDetailResult: AdminUserDetailResult = {
  user: {
    id: "usr_paid_1",
    name: "Nguyễn Văn An",
    email: "an@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(now - 5 * 86400_000),
    updatedAt: new Date(now - 86400_000),
  },
  profile: {
    userId: "usr_paid_1",
    targetBand: 7.5,
    examDate: "2026-12-20",
    onboardedAt: new Date(now - 5 * 86400_000),
    createdAt: new Date(now - 5 * 86400_000),
    updatedAt: new Date(now - 5 * 86400_000),
  },
  subscription: {
    userId: "usr_paid_1",
    planId: "month",
    planName: "30 ngày",
    pointsRemaining: 95,
    planPointsTotal: 120,
    expiresAt: new Date(now + 20 * 86400_000),
    isActive: true,
    lastOrderId: "ord_1",
    createdAt: new Date(now - 2 * 86400_000),
    updatedAt: new Date(now - 2 * 86400_000),
  },
  detailCredits: 2,
  orders: [
    {
      id: "ord_1",
      userId: "usr_paid_1",
      planId: "month",
      planName: "30 ngày",
      amountVnd: 249_000,
      transferCode: "VFMONTH12345",
      examDateSnapshot: null,
      status: "paid",
      sepayId: 9001,
      expiresAt: new Date(now - 2 * 86400_000 + 900_000),
      paidAt: new Date(now - 2 * 86400_000),
      createdAt: new Date(now - 2 * 86400_000),
    },
  ],
  events: [
    {
      id: "evt_1",
      sepayId: 9001,
      sepayUuid: "uuid-9001",
      transferType: "in",
      gateway: "MBBank",
      accountNumber: "0123456789",
      subAccount: "",
      transferAmount: 249_000,
      extractedCode: "VFMONTH12345",
      referenceCode: "FT269001",
      transactionDate: "2026-11-15 10:00:00",
      orderId: "ord_1",
      matchStatus: "matched",
      classification: "matched",
      resolutionStatus: "resolved",
      source: "webhook",
      createdAt: new Date(now - 2 * 86400_000),
    },
  ],
  actions: [
    {
      id: "act_1",
      userId: "usr_paid_1",
      action: "grant_plan",
      planId: "week",
      pointsDelta: 48,
      detailCreditsDelta: null,
      previousExpiresAt: null,
      newExpiresAt: new Date(now + 7 * 86400_000),
      note: "Tặng gói dùng thử",
      actorEmail: "admin@voxflow.vn",
      createdAt: new Date(now - 3 * 86400_000),
    },
  ],
  attemptsCount: 6,
};

describe("UsersScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user list with profile, subscription, and order summaries", () => {
    render(<UsersScreen initialData={mockListResult} />);

    expect(screen.getByText("Nguyễn Văn An")).toBeTruthy();
    expect(screen.getByText("an@example.com")).toBeTruthy();
    expect(screen.getByText("30 ngày")).toBeTruthy();
    expect(screen.getByText("7.5")).toBeTruthy();
    expect(screen.getByText(/95 \/ 120 điểm/)).toBeTruthy();
    expect(screen.getByText(/1 đơn · 249\.000đ/)).toBeTruthy();

    expect(screen.getByText("Trần Thị Bình")).toBeTruthy();
    expect(screen.getAllByText("Miễn phí").length).toBeGreaterThanOrEqual(2);

    const detailLinks = screen.getAllByRole("link", { name: /Chi tiết/i });
    expect(detailLinks[0]?.getAttribute("href")).toBe("/users/usr_paid_1");
  });

  it("calls list query when searching and changing plan filters", async () => {
    listSpy.mockResolvedValue({
      items: [mockListResult.items[0]],
      total: 1,
    });

    render(<UsersScreen initialData={mockListResult} />);

    const searchInput = screen.getByLabelText("Tìm kiếm người dùng");
    fireEvent.change(searchInput, { target: { value: "an@example.com" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        query: "an@example.com",
        planFilter: "all",
        limit: 30,
        offset: 0,
      });
    });

    listSpy.mockResolvedValueOnce({
      items: [mockListResult.items[1]],
      total: 1,
    });
    fireEvent.click(screen.getByRole("button", { name: "Miễn phí" }));

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        query: "an@example.com",
        planFilter: "free",
        limit: 30,
        offset: 0,
      });
      expect(screen.queryByText("Nguyễn Văn An")).toBeNull();
      expect(screen.getByText("Trần Thị Bình")).toBeTruthy();
    });
  });

  it("supports pagination with Trang sau and Trang trước", async () => {
    listSpy.mockResolvedValueOnce({
      items: [mockListResult.items[1]],
      total: 2,
    });

    render(
      <UsersScreen
        initialData={{ items: [mockListResult.items[0]!], total: 2 }}
        pageSize={1}
      />,
    );

    const nextBtn = screen.getByRole("button", { name: /Trang sau/i });
    const prevBtn = screen.getByRole("button", { name: /Trang trước/i });
    expect((prevBtn as HTMLButtonElement).disabled).toBe(true);
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        query: undefined,
        planFilter: "all",
        limit: 1,
        offset: 1,
      });
    });
  });
});

describe("UserDetailScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile, subscription, payment orders, linked events, and audit actions", () => {
    render(<UserDetailScreen userId="usr_paid_1" initialDetail={mockDetailResult} />);

    expect(screen.getByText("Nguyễn Văn An")).toBeTruthy();
    expect(screen.getByText("an@example.com")).toBeTruthy();
    expect(screen.getByText("7.5")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.getByText("95 / 120")).toBeTruthy();
    expect(screen.getByText("VFMONTH12345")).toBeTruthy();
    expect(screen.getByText(/FT269001/)).toBeTruthy();
    expect(screen.getByText(/Tặng gói dùng thử/)).toBeTruthy();
    expect(screen.getByText(/admin@voxflow\.vn/)).toBeTruthy();
  });

  it("validates note and submits grantPlan modal for exam plan", async () => {
    grantPlanSpy.mockResolvedValueOnce({ success: true });
    detailSpy.mockResolvedValueOnce({
      ...mockDetailResult,
      subscription: {
        ...mockDetailResult.subscription!,
        planId: "exam",
        planName: "Đến ngày thi",
        pointsRemaining: 275,
        planPointsTotal: 300,
      },
    });

    render(<UserDetailScreen userId="usr_paid_1" initialDetail={mockDetailResult} />);

    fireEvent.click(screen.getByRole("button", { name: /Gán gói \(D-13\)/i }));

    // Mandatory note validation
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận gán gói" }));
    expect(screen.getByText("Vui lòng nhập ghi chú thao tác.")).toBeTruthy();
    expect(grantPlanSpy).not.toHaveBeenCalled();

    // Select exam plan -> shows examDate input
    fireEvent.change(screen.getByLabelText("Chọn gói"), {
      target: { value: "exam" },
    });
    const examDateInput = screen.getByLabelText(/Ngày thi/i) as HTMLInputElement;
    expect(examDateInput.value).toBe("2026-12-20");

    fireEvent.change(screen.getByLabelText(/Ghi chú/i), {
      target: { value: "Bù gói luyện thi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận gán gói" }));

    await waitFor(() => {
      expect(grantPlanSpy).toHaveBeenCalledWith({
        userId: "usr_paid_1",
        planId: "exam",
        examDate: "2026-12-20",
        note: "Bù gói luyện thi",
      });
      expect(detailSpy).toHaveBeenCalledWith({ userId: "usr_paid_1" });
      expect(toastSuccessSpy).toHaveBeenCalledWith("Đã gán gói thành công");
    });
  });

  it("validates numeric input and submits adjustQuota for points, detail_credit, and expiry", async () => {
    adjustQuotaSpy.mockResolvedValue({ success: true });
    detailSpy.mockResolvedValue(mockDetailResult);

    render(<UserDetailScreen userId="usr_paid_1" initialDetail={mockDetailResult} />);

    fireEvent.click(screen.getByRole("button", { name: /Điều chỉnh điểm \/ Credit/i }));

    // Invalid negative number
    fireEvent.change(screen.getByLabelText(/Số điểm mới/i), {
      target: { value: "-5" },
    });
    fireEvent.change(screen.getByLabelText(/Ghi chú/i), {
      target: { value: "Kiểm tra số âm" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điều chỉnh" }));

    expect(screen.getByText("Giá trị phải là số nguyên không âm (>= 0).")).toBeTruthy();
    expect(adjustQuotaSpy).not.toHaveBeenCalled();

    // Valid points update
    fireEvent.change(screen.getByLabelText(/Số điểm mới/i), {
      target: { value: "110" },
    });
    fireEvent.change(screen.getByLabelText(/Ghi chú/i), {
      target: { value: "Hoàn điểm chấm lỗi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điều chỉnh" }));

    await waitFor(() => {
      expect(adjustQuotaSpy).toHaveBeenCalledWith({
        userId: "usr_paid_1",
        target: "points",
        pointsRemaining: 110,
        note: "Hoàn điểm chấm lỗi",
      });
      expect(detailSpy).toHaveBeenCalledWith({ userId: "usr_paid_1" });
    });

    // Re-open and test detail_credit
    fireEvent.click(screen.getByRole("button", { name: /Điều chỉnh điểm \/ Credit/i }));
    fireEvent.change(screen.getByLabelText("Hạng mục điều chỉnh"), {
      target: { value: "detail_credit" },
    });
    fireEvent.change(screen.getByLabelText(/Số credit mới/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/Ghi chú/i), {
      target: { value: "Tặng credit chi tiết" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điều chỉnh" }));

    await waitFor(() => {
      expect(adjustQuotaSpy).toHaveBeenCalledWith({
        userId: "usr_paid_1",
        target: "detail_credit",
        detailCredits: 5,
        note: "Tặng credit chi tiết",
      });
    });

    // Re-open and test expiry
    fireEvent.click(screen.getByRole("button", { name: /Điều chỉnh điểm \/ Credit/i }));
    fireEvent.change(screen.getByLabelText("Hạng mục điều chỉnh"), {
      target: { value: "expiry" },
    });
    const expiryValue = "2026-12-31T23:59";
    fireEvent.change(screen.getByLabelText(/Ngày giờ hết hạn mới/i), {
      target: { value: expiryValue },
    });
    fireEvent.change(screen.getByLabelText(/Ghi chú/i), {
      target: { value: "Gia hạn thêm gói" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điều chỉnh" }));

    await waitFor(() => {
      expect(adjustQuotaSpy).toHaveBeenCalledWith({
        userId: "usr_paid_1",
        target: "expiry",
        expiresAtMs: Math.floor(new Date(expiryValue).getTime()),
        note: "Gia hạn thêm gói",
      });
    });
  });
});
