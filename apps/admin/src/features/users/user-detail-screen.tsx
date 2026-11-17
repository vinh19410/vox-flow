import { Link } from "@tanstack/react-router";
import { Badge, type BadgeTone } from "@vox-flow/ui/ds/badge";
import { Button } from "@vox-flow/ui/ds/button";
import { Card } from "@vox-flow/ui/ds/card";
import { Modal } from "@vox-flow/ui/ds/modal";
import { PageHead } from "@vox-flow/ui/ds/page-head";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Gift,
  History,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { fmtBand, formatDateOnly, formatDateTime, vnd } from "@/lib/format";
import { trpcClient } from "@/utils/trpc";

export type AdminGrantPlanId = "pack" | "week" | "month" | "exam";
export type AdminAdjustTarget = "points" | "detail_credit" | "expiry";

export interface AdminUserDetailResult {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date | string | number;
    updatedAt: Date | string | number;
  };
  profile: {
    userId: string;
    targetBand: number;
    examDate: string | null;
    onboardedAt: Date | string | number | null;
    createdAt: Date | string | number;
    updatedAt: Date | string | number;
  } | null;
  subscription: {
    userId: string;
    planId: "week" | "month" | "exam";
    planName: string;
    pointsRemaining: number;
    planPointsTotal: number;
    expiresAt: Date | string | number;
    isActive: boolean;
    lastOrderId: string | null;
    createdAt: Date | string | number;
    updatedAt: Date | string | number;
  } | null;
  detailCredits: number;
  orders: Array<{
    id: string;
    userId: string;
    planId: AdminGrantPlanId;
    planName: string;
    amountVnd: number;
    transferCode: string;
    examDateSnapshot: string | null;
    status: "pending" | "paid" | "expired" | "refunded";
    sepayId: number | null;
    expiresAt: Date | string | number;
    paidAt: Date | string | number | null;
    createdAt: Date | string | number;
  }>;
  events: Array<{
    id: string;
    sepayId: number | null;
    sepayUuid: string | null;
    transferType: "in" | "out";
    gateway: string;
    accountNumber: string;
    subAccount: string;
    transferAmount: number;
    extractedCode: string | null;
    referenceCode: string;
    transactionDate: string;
    orderId: string | null;
    matchStatus: string;
    classification: string;
    resolutionStatus: string;
    source: string;
    createdAt: Date | string | number;
  }>;
  actions: Array<{
    id: string;
    userId: string;
    action: "grant_plan" | "adjust_points" | "adjust_detail_credit" | "adjust_expiry";
    planId: AdminGrantPlanId | null;
    pointsDelta: number | null;
    detailCreditsDelta: number | null;
    previousExpiresAt: Date | string | number | null;
    newExpiresAt: Date | string | number | null;
    note: string;
    actorEmail: string;
    createdAt: Date | string | number;
  }>;
  attemptsCount: number;
}

export interface UserDetailScreenProps {
  userId: string;
  initialDetail?: AdminUserDetailResult;
}

const PLAN_OPTIONS: Array<{ value: AdminGrantPlanId; label: string }> = [
  { value: "pack", label: "Theo lượt (+3 credit chi tiết)" },
  { value: "week", label: "7 ngày (+48 điểm)" },
  { value: "month", label: "30 ngày (+120 điểm)" },
  { value: "exam", label: "Đến ngày thi (+180 điểm)" },
];

const ORDER_STATUS_META: Record<
  "pending" | "paid" | "expired" | "refunded",
  { label: string; tone: BadgeTone }
> = {
  pending: { label: "Chờ thanh toán", tone: "warn" },
  paid: { label: "Đã thanh toán", tone: "good" },
  expired: { label: "Hết hạn", tone: "neutral" },
  refunded: { label: "Đã hoàn tiền", tone: "bad" },
};

const ACTION_LABEL: Record<
  "grant_plan" | "adjust_points" | "adjust_detail_credit" | "adjust_expiry",
  string
> = {
  grant_plan: "Gán gói",
  adjust_points: "Điều chỉnh điểm",
  adjust_detail_credit: "Điều chỉnh credit",
  adjust_expiry: "Điều chỉnh hạn",
};

function toDateTimeLocalValue(value: Date | string | number | null | undefined): string {
  const date = value ? new Date(value) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function UserDetailScreen({ userId, initialDetail }: UserDetailScreenProps) {
  const [detail, setDetail] = useState<AdminUserDetailResult | null>(initialDetail ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grant plan modal state
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantPlanId, setGrantPlanId] = useState<AdminGrantPlanId>("week");
  const [grantExamDate, setGrantExamDate] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantPending, setGrantPending] = useState(false);

  // Adjust quota modal state
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<AdminAdjustTarget>("points");
  const [adjustNumberInput, setAdjustNumberInput] = useState("0");
  const [adjustExpiryInput, setAdjustExpiryInput] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustPending, setAdjustPending] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!trpcClient?.adminUsers?.detail?.query) return;
    try {
      setLoading(true);
      setError(null);
      const result = await trpcClient.adminUsers.detail.query({ userId });
      setDetail(result as AdminUserDetailResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải chi tiết người dùng.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!initialDetail) {
      void loadDetail();
    }
  }, [initialDetail, loadDetail]);

  const openGrantModal = () => {
    setGrantPlanId("week");
    setGrantExamDate(detail?.profile?.examDate ?? "");
    setGrantNote("");
    setGrantError(null);
    setGrantOpen(true);
  };

  const openAdjustModal = () => {
    const defaultTarget: AdminAdjustTarget = detail?.subscription ? "points" : "detail_credit";
    setAdjustTarget(defaultTarget);
    setAdjustNumberInput(
      defaultTarget === "points"
        ? String(detail?.subscription?.pointsRemaining ?? 0)
        : String(detail?.detailCredits ?? 0),
    );
    setAdjustExpiryInput(toDateTimeLocalValue(detail?.subscription?.expiresAt));
    setAdjustNote("");
    setAdjustError(null);
    setAdjustOpen(true);
  };

  const handleAdjustTargetChange = (nextTarget: AdminAdjustTarget) => {
    setAdjustTarget(nextTarget);
    setAdjustError(null);
    if (nextTarget === "points") {
      setAdjustNumberInput(String(detail?.subscription?.pointsRemaining ?? 0));
    } else if (nextTarget === "detail_credit") {
      setAdjustNumberInput(String(detail?.detailCredits ?? 0));
    } else {
      setAdjustExpiryInput(toDateTimeLocalValue(detail?.subscription?.expiresAt));
    }
  };

  const handleGrantSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (grantPending) return;

    const trimmedNote = grantNote.trim();
    if (!trimmedNote) {
      setGrantError("Vui lòng nhập ghi chú thao tác.");
      return;
    }

    try {
      setGrantPending(true);
      setGrantError(null);
      await trpcClient.adminUsers.grantPlan.mutate({
        userId,
        planId: grantPlanId,
        examDate:
          grantPlanId === "exam" ? (grantExamDate.trim() ? grantExamDate.trim() : null) : undefined,
        note: trimmedNote,
      });
      toast.success("Đã gán gói thành công");
      setGrantOpen(false);
      await loadDetail();
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "";
      const message =
        rawMessage === "EXAM_DATE_PASSED"
          ? "Ngày thi đã qua. Vui lòng chọn ngày thi mới hoặc xóa trống để áp dụng tối đa 60 ngày."
          : rawMessage === "EXAM_DATE_INVALID"
            ? "Ngày thi không hợp lệ (định dạng YYYY-MM-DD)."
            : rawMessage || "Gán gói thất bại.";
      setGrantError(message);
    } finally {
      setGrantPending(false);
    }
  };

  const handleAdjustSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adjustPending) return;

    const trimmedNote = adjustNote.trim();
    if (!trimmedNote) {
      setAdjustError("Vui lòng nhập ghi chú thao tác.");
      return;
    }

    if (adjustTarget === "points" || adjustTarget === "detail_credit") {
      const trimmedVal = adjustNumberInput.trim();
      const parsed = Number(trimmedVal);
      if (trimmedVal === "" || !Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
        setAdjustError("Giá trị phải là số nguyên không âm (>= 0).");
        return;
      }

      try {
        setAdjustPending(true);
        setAdjustError(null);
        if (adjustTarget === "points") {
          await trpcClient.adminUsers.adjustQuota.mutate({
            userId,
            target: "points",
            pointsRemaining: parsed,
            note: trimmedNote,
          });
        } else {
          await trpcClient.adminUsers.adjustQuota.mutate({
            userId,
            target: "detail_credit",
            detailCredits: parsed,
            note: trimmedNote,
          });
        }
        toast.success("Đã điều chỉnh hạn mức thành công");
        setAdjustOpen(false);
        await loadDetail();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Điều chỉnh thất bại.";
        setAdjustError(message);
      } finally {
        setAdjustPending(false);
      }
      return;
    }

    const parsedMs = new Date(adjustExpiryInput).getTime();
    if (!adjustExpiryInput.trim() || !Number.isFinite(parsedMs) || parsedMs <= 0) {
      setAdjustError("Ngày hết hạn không hợp lệ.");
      return;
    }

    try {
      setAdjustPending(true);
      setAdjustError(null);
      await trpcClient.adminUsers.adjustQuota.mutate({
        userId,
        target: "expiry",
        expiresAtMs: Math.floor(parsedMs),
        note: trimmedNote,
      });
      toast.success("Đã cập nhật hạn sử dụng gói");
      setAdjustOpen(false);
      await loadDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Điều chỉnh hạn thất bại.";
      setAdjustError(message);
    } finally {
      setAdjustPending(false);
    }
  };

  if (error && !detail) {
    return (
      <div>
        <div className="mb-4">
          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle size={28} className="mx-auto text-bad" />
          <p className="mt-3 text-sm font-semibold text-ink">{error}</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadDetail()}>
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  if (!detail) {
    return (
      <Card className="p-10 text-center text-sm text-subtle">
        {loading ? "Đang tải thông tin người dùng..." : "Không có dữ liệu người dùng."}
      </Card>
    );
  }

  const { user, profile, subscription, detailCredits, orders, events, actions, attemptsCount } =
    detail;

  const eventsByOrderId = new Map<string, typeof events>();
  for (const evt of events) {
    if (!evt.orderId) continue;
    const list = eventsByOrderId.get(evt.orderId) ?? [];
    list.push(evt);
    eventsByOrderId.set(evt.orderId, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/users"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        <PageHead
          eyebrow="Hồ sơ học viên"
          title={user.name || "Chưa đặt tên"}
          sub={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
              <span>{user.email}</span>
              <span className="font-mono text-xs text-subtle">{user.id}</span>
            </span>
          }
          right={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadDetail()}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
              Làm mới
            </Button>
          }
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Summary */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <UserCheck size={17} className="text-brand" />
          Thông tin học tập
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-paper p-3.5">
            <div className="text-xs text-subtle">Band mục tiêu</div>
            <div className="mt-1 text-lg font-bold text-ink">
              {profile ? fmtBand(profile.targetBand) : "Chưa đặt"}
            </div>
          </div>
          <div className="rounded-2xl bg-paper p-3.5">
            <div className="text-xs text-subtle">Ngày thi</div>
            <div className="mt-1 text-lg font-bold text-ink">
              {profile?.examDate ? formatDateOnly(profile.examDate) : "Chưa đặt"}
            </div>
          </div>
          <div className="rounded-2xl bg-paper p-3.5">
            <div className="text-xs text-subtle">Tổng số lượt thi</div>
            <div className="mt-1 text-lg font-bold text-ink">{attemptsCount}</div>
          </div>
          <div className="rounded-2xl bg-paper p-3.5">
            <div className="text-xs text-subtle">Ngày tham gia</div>
            <div className="mt-1 text-sm font-semibold text-ink">
              {formatDateTime(user.createdAt)}
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription & Quota */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-brand" />
            <h2 className="text-base font-bold text-ink">Gói đăng ký & Hạn mức</h2>
            {subscription ? (
              subscription.isActive ? (
                <Badge tone="good">{subscription.planName} · Đang hoạt động</Badge>
              ) : (
                <Badge tone="warn">{subscription.planName} · Hết hạn</Badge>
              )
            ) : (
              <Badge tone="neutral">Miễn phí</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="accent" size="sm" onClick={openGrantModal}>
              <Gift size={15} />
              Gán gói (D-13)
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={openAdjustModal}>
              <SlidersHorizontal size={15} />
              Điều chỉnh điểm / Credit
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-line p-4">
            <div className="text-xs text-subtle">Gói hiện tại</div>
            <div className="mt-1 text-base font-bold text-ink">
              {subscription ? subscription.planName : "Chưa có gói"}
            </div>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <div className="text-xs text-subtle">Điểm còn lại</div>
            <div className="mt-1 text-base font-bold text-ink">
              {subscription
                ? `${subscription.pointsRemaining} / ${subscription.planPointsTotal}`
                : "0 / 0"}
            </div>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <div className="text-xs text-subtle">Hạn sử dụng</div>
            <div className="mt-1 text-sm font-semibold text-ink">
              {subscription ? formatDateTime(subscription.expiresAt) : "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <div className="text-xs text-subtle">Credit xem chi tiết</div>
            <div className="mt-1 text-base font-bold text-ink">{detailCredits}</div>
          </div>
        </div>
      </Card>

      {/* Payment Orders */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-base font-bold text-ink">
          <CreditCard size={18} className="text-brand" />
          Lịch sử Payment Orders ({orders.length})
        </div>

        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-subtle">Chưa có đơn thanh toán nào.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => {
              const statusMeta = ORDER_STATUS_META[order.status];
              const linkedEvents = eventsByOrderId.get(order.id) ?? [];
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-line bg-paper/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ink">
                        {order.transferCode}
                      </span>
                      <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                      <span className="text-xs font-medium text-ink-2">{order.planName}</span>
                    </div>
                    <div className="text-sm font-bold text-ink">{vnd(order.amountVnd)}</div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-subtle">
                    <span>Tạo lúc: {formatDateTime(order.createdAt)}</span>
                    <span>Thanh toán: {order.paidAt ? formatDateTime(order.paidAt) : "—"}</span>
                    {order.examDateSnapshot && (
                      <span>Ngày thi snapshot: {formatDateOnly(order.examDateSnapshot)}</span>
                    )}
                  </div>

                  {linkedEvents.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-line pt-2.5">
                      {linkedEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2"
                        >
                          <span>
                            Sự kiện SePay:{" "}
                            <strong className="font-mono">{evt.classification}</strong>
                            {evt.referenceCode ? ` · Ref: ${evt.referenceCode}` : ""}
                          </span>
                          <span>
                            {vnd(evt.transferAmount)} · {evt.gateway}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Admin Actions Audit Log */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-base font-bold text-ink">
          <History size={18} className="text-brand" />
          Nhật ký thao tác Admin ({actions.length})
        </div>

        {actions.length === 0 ? (
          <p className="mt-4 text-sm text-subtle">Chưa có thao tác thủ công nào từ Admin.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {actions.map((act) => (
              <div
                key={act.id}
                className="rounded-2xl border border-line bg-paper/60 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{ACTION_LABEL[act.action]}</Badge>
                    {act.planId && (
                      <span className="text-xs font-semibold text-ink">
                        Gói: {act.planId}
                      </span>
                    )}
                    {act.pointsDelta !== null && (
                      <span className="text-xs font-semibold text-ink">
                        Điểm: {act.pointsDelta >= 0 ? `+${act.pointsDelta}` : act.pointsDelta}
                      </span>
                    )}
                    {act.detailCreditsDelta !== null && (
                      <span className="text-xs font-semibold text-ink">
                        Credit:{" "}
                        {act.detailCreditsDelta >= 0
                          ? `+${act.detailCreditsDelta}`
                          : act.detailCreditsDelta}
                      </span>
                    )}
                    {act.newExpiresAt && (
                      <span className="text-xs text-ink-2">
                        Hạn: {act.previousExpiresAt ? formatDateTime(act.previousExpiresAt) : "—"} →{" "}
                        {formatDateTime(act.newExpiresAt)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-subtle">{formatDateTime(act.createdAt)}</span>
                </div>
                <p className="mt-2 text-xs text-ink">Ghi chú: {act.note}</p>
                <p className="mt-1 text-[11px] text-subtle">Thực hiện bởi: {act.actorEmail}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Grant Plan Modal (D-13) */}
      <Modal
        open={grantOpen}
        onClose={() => {
          if (!grantPending) setGrantOpen(false);
        }}
      >
        <form noValidate onSubmit={(e) => void handleGrantSubmit(e)} className="p-6 sm:p-7">
          <h3 className="text-lg font-bold text-ink">Gán gói (D-13)</h3>
          <p className="mt-1 text-xs text-subtle">
            Cộng dồn điểm/hạn nếu gói còn hiệu lực, hoặc kích hoạt gói mới cho {user.email}.
          </p>

          {grantError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
            >
              {grantError}
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="grant-plan-id" className="block text-xs font-semibold text-ink-2">
                Chọn gói
              </label>
              <select
                id="grant-plan-id"
                value={grantPlanId}
                onChange={(e) => setGrantPlanId(e.target.value as AdminGrantPlanId)}
                disabled={grantPending}
                className="mt-1.5 h-11 w-full rounded-2xl border border-line bg-white px-3.5 text-sm outline-none focus:border-ink"
              >
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {grantPlanId === "exam" && (
              <div>
                <label htmlFor="grant-exam-date" className="block text-xs font-semibold text-ink-2">
                  Ngày thi (tùy chọn, YYYY-MM-DD)
                </label>
                <input
                  id="grant-exam-date"
                  type="date"
                  value={grantExamDate}
                  onChange={(e) => setGrantExamDate(e.target.value)}
                  disabled={grantPending}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-line bg-white px-3.5 text-sm outline-none focus:border-ink"
                />
              </div>
            )}

            <div>
              <label htmlFor="grant-note" className="block text-xs font-semibold text-ink-2">
                Ghi chú (bắt buộc)
              </label>
              <textarea
                id="grant-note"
                rows={3}
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="Ví dụ: Bù lỗi thanh toán / hỗ trợ học viên..."
                disabled={grantPending}
                className="mt-1.5 w-full rounded-2xl border border-line bg-white p-3.5 text-sm outline-none focus:border-ink"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setGrantOpen(false)}
              disabled={grantPending}
            >
              Hủy
            </Button>
            <Button type="submit" variant="accent" size="sm" disabled={grantPending}>
              {grantPending ? "Đang xử lý..." : "Xác nhận gán gói"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Quota Modal */}
      <Modal
        open={adjustOpen}
        onClose={() => {
          if (!adjustPending) setAdjustOpen(false);
        }}
      >
        <form noValidate onSubmit={(e) => void handleAdjustSubmit(e)} className="p-6 sm:p-7">
          <h3 className="text-lg font-bold text-ink">Điều chỉnh điểm / Credit / Hạn</h3>
          <p className="mt-1 text-xs text-subtle">
            Cập nhật trực tiếp điểm còn lại, credit xem chi tiết hoặc hạn sử dụng của gói.
          </p>

          {adjustError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
            >
              {adjustError}
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="adjust-target" className="block text-xs font-semibold text-ink-2">
                Hạng mục điều chỉnh
              </label>
              <select
                id="adjust-target"
                value={adjustTarget}
                onChange={(e) => handleAdjustTargetChange(e.target.value as AdminAdjustTarget)}
                disabled={adjustPending}
                className="mt-1.5 h-11 w-full rounded-2xl border border-line bg-white px-3.5 text-sm outline-none focus:border-ink"
              >
                <option value="points">Điểm còn lại (points)</option>
                <option value="detail_credit">Credit xem chi tiết (detail_credit)</option>
                <option value="expiry">Ngày hết hạn gói (expiry)</option>
              </select>
            </div>

            {(adjustTarget === "points" || adjustTarget === "expiry") && !subscription && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                Người dùng chưa có gói đăng ký. Cần gán gói trước khi điều chỉnh điểm hoặc hạn.
              </div>
            )}

            {adjustTarget === "expiry" ? (
              <div>
                <label htmlFor="adjust-expiry" className="block text-xs font-semibold text-ink-2">
                  Ngày giờ hết hạn mới
                </label>
                <input
                  id="adjust-expiry"
                  type="datetime-local"
                  value={adjustExpiryInput}
                  onChange={(e) => setAdjustExpiryInput(e.target.value)}
                  disabled={adjustPending}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-line bg-white px-3.5 text-sm outline-none focus:border-ink"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="adjust-value" className="block text-xs font-semibold text-ink-2">
                  {adjustTarget === "points" ? "Số điểm mới (>= 0)" : "Số credit mới (>= 0)"}
                </label>
                <input
                  id="adjust-value"
                  type="number"
                  min={0}
                  step={1}
                  value={adjustNumberInput}
                  onChange={(e) => setAdjustNumberInput(e.target.value)}
                  disabled={adjustPending}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-line bg-white px-3.5 text-sm outline-none focus:border-ink"
                />
              </div>
            )}

            <div>
              <label htmlFor="adjust-note" className="block text-xs font-semibold text-ink-2">
                Ghi chú (bắt buộc)
              </label>
              <textarea
                id="adjust-note"
                rows={3}
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Lý do điều chỉnh hạn mức..."
                disabled={adjustPending}
                className="mt-1.5 w-full rounded-2xl border border-line bg-white p-3.5 text-sm outline-none focus:border-ink"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdjustOpen(false)}
              disabled={adjustPending}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={adjustPending}>
              {adjustPending ? "Đang lưu..." : "Lưu điều chỉnh"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
