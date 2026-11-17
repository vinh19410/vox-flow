import { Badge, type BadgeTone } from "@vox-flow/ui/ds/badge";
import { Button } from "@vox-flow/ui/ds/button";
import { Card } from "@vox-flow/ui/ds/card";
import { Modal } from "@vox-flow/ui/ds/modal";
import { PageHead } from "@vox-flow/ui/ds/page-head";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatDateTime, vnd } from "@/lib/format";
import { trpcClient } from "@/utils/trpc";

export type PaymentClassification =
  | "matched"
  | "underpaid"
  | "overpaid"
  | "unknown_code"
  | "expired_order"
  | "outbound"
  | "account_mismatch"
  | "already_paid"
  | "order_not_pending";

export type PaymentResolutionStatus =
  | "resolved"
  | "pending_review"
  | "activated"
  | "refunded"
  | "ignored";

export type PaymentSource = "webhook" | "cron_sweep";

export interface PaymentActionRecord {
  id: string;
  eventId: string;
  orderId: string | null;
  action: "activate" | "mark_refunded";
  note: string;
  actorEmail: string;
  createdAt: Date | string | number;
}

export interface PaymentOrderSummary {
  id: string;
  userId: string;
  planId: "pack" | "week" | "month" | "exam";
  planName: string;
  amountVnd: number;
  transferCode: string;
  status: "pending" | "paid" | "expired" | "refunded";
  sepayId?: number | null;
  expiresAt: Date | string | number;
  paidAt?: Date | string | number | null;
  createdAt: Date | string | number;
}

export interface PaymentSearchOrderItem {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  planId: "pack" | "week" | "month" | "exam";
  planName: string;
  amountVnd: number;
  transferCode: string;
  status: "pending" | "paid" | "expired" | "refunded";
  expiresAt: Date | string | number;
  paidAt: Date | string | number | null;
  createdAt: Date | string | number;
}

export interface PaymentQueueItem {
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
  classification: PaymentClassification;
  resolutionStatus: PaymentResolutionStatus;
  source: PaymentSource;
  createdAt: Date | string | number;
  userEmail: string | null;
  userName: string | null;
  order: PaymentOrderSummary | null;
  actions: PaymentActionRecord[];
  slaDueAt: Date | string | number;
  isNearOverdue: boolean;
  isOverdue: boolean;
}

export interface PaymentMetrics {
  pendingCount: number;
  overdueCount: number;
  nearOverdueCount: number;
  resolvedCount: number;
}

export interface PaymentsScreenProps {
  initialQueue?: PaymentQueueItem[];
  initialMetrics?: PaymentMetrics;
  accessDeniedForTest?: boolean;
}

type QueueFilter = "pending_review" | "resolved" | "all";
type ModalActionType = "activate" | "mark_refunded";

interface SweepFeedback {
  tone: "good" | "warn";
  message: string;
}

const CLASSIFICATION_META: Record<
  PaymentClassification,
  { label: string; tone: BadgeTone }
> = {
  underpaid: { label: "Thiếu tiền", tone: "bad" },
  overpaid: { label: "Thừa tiền", tone: "warn" },
  unknown_code: { label: "Sai/thiếu mã", tone: "warn" },
  expired_order: { label: "Đơn hết hạn", tone: "warn" },
  account_mismatch: { label: "Sai tài khoản", tone: "bad" },
  already_paid: { label: "Đã thanh toán trước đó", tone: "info" },
  order_not_pending: { label: "Đơn không ở trạng thái chờ", tone: "warn" },
  matched: { label: "Khớp chuẩn", tone: "good" },
  outbound: { label: "Chi ra", tone: "neutral" },
};

const RESOLUTION_META: Record<
  PaymentResolutionStatus,
  { label: string; tone: BadgeTone }
> = {
  pending_review: { label: "Chờ xử lý", tone: "warn" },
  activated: { label: "Đã kích hoạt", tone: "good" },
  refunded: { label: "Đã hoàn tiền", tone: "neutral" },
  resolved: { label: "Đã khớp", tone: "good" },
  ignored: { label: "Đã bỏ qua", tone: "neutral" },
};

const SOURCE_META: Record<PaymentSource, { label: string; tone: BadgeTone }> = {
  webhook: { label: "Webhook", tone: "info" },
  cron_sweep: { label: "Quét định kỳ", tone: "neutral" },
};

const ORDER_STATUS_LABEL: Record<PaymentOrderSummary["status"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Admin access required") ||
    msg.includes("Authentication required") ||
    msg.includes("FORBIDDEN") ||
    msg.includes("UNAUTHORIZED")
  );
}

export function PaymentsScreen({
  initialQueue,
  initialMetrics,
  accessDeniedForTest = false,
}: PaymentsScreenProps) {
  const [queue, setQueue] = useState<PaymentQueueItem[]>(initialQueue ?? []);
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(initialMetrics ?? null);
  const [filter, setFilter] = useState<QueueFilter>("pending_review");
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sweepFeedback, setSweepFeedback] = useState<SweepFeedback | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(accessDeniedForTest);

  // Action modal state
  const [modalEvent, setModalEvent] = useState<PaymentQueueItem | null>(null);
  const [modalAction, setModalAction] = useState<ModalActionType>("activate");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Order search state when event.orderId is null
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderResults, setOrderResults] = useState<PaymentSearchOrderItem[]>([]);
  const [searchingOrders, setSearchingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const skipInitialLoadRef = useRef(Boolean(initialQueue));
  const searchSeqRef = useRef(0);

  const loadData = async (targetFilter: QueueFilter = filter) => {
    try {
      setLoading(true);
      setActionError(null);
      if (trpcClient?.adminBilling?.queue?.query) {
        const res = await trpcClient.adminBilling.queue.query({ filter: targetFilter });
        setQueue(res.items as PaymentQueueItem[]);
        setMetrics(res.metrics as PaymentMetrics);
      }
      setAccessDenied(false);
    } catch (err: unknown) {
      if (isAuthError(err)) {
        setAccessDenied(true);
      } else {
        const msg = err instanceof Error ? err.message : "Không thể tải danh sách đối soát";
        setActionError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessDeniedForTest) return;
    if (skipInitialLoadRef.current) {
      skipInitialLoadRef.current = false;
      return;
    }
    void loadData(filter);
  }, [filter, accessDeniedForTest]);

  const runOrderSearch = async (query: string) => {
    const reqId = ++searchSeqRef.current;
    try {
      setSearchingOrders(true);
      setModalError(null);
      if (trpcClient?.adminBilling?.searchOrders?.query) {
        const rows = await trpcClient.adminBilling.searchOrders.query({ query });
        if (reqId === searchSeqRef.current) {
          setOrderResults(rows as PaymentSearchOrderItem[]);
        }
      }
    } catch (err: unknown) {
      if (reqId === searchSeqRef.current) {
        const msg = err instanceof Error ? err.message : "Không thể tìm kiếm đơn hàng";
        setModalError(msg);
      }
    } finally {
      if (reqId === searchSeqRef.current) {
        setSearchingOrders(false);
      }
    }
  };

  const openActionModal = (item: PaymentQueueItem, action: ModalActionType) => {
    setModalEvent(item);
    setModalAction(action);
    setNote("");
    setNoteError(null);
    setModalError(null);
    setOrderSearchQuery("");
    setOrderResults([]);
    setSelectedOrderId(item.orderId ?? null);

    if (action === "activate" && !item.orderId) {
      void runOrderSearch("");
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setModalEvent(null);
    setNote("");
    setNoteError(null);
    setModalError(null);
    setSelectedOrderId(null);
    setOrderResults([]);
  };

  const handleOrderQueryChange = (value: string) => {
    setOrderSearchQuery(value);
    void runOrderSearch(value);
  };

  const handleTriggerSweep = async () => {
    try {
      setSweeping(true);
      setActionError(null);
      setSweepFeedback(null);

      if (trpcClient?.adminBilling?.triggerSweep?.mutate) {
        const res = await trpcClient.adminBilling.triggerSweep.mutate();
        if (res.skippedReason === "missing_config") {
          setSweepFeedback({
            tone: "warn",
            message:
              "Chưa cấu hình đầy đủ thông tin kết nối SePay (SEPAY_API_TOKEN hoặc SEPAY_BANK_ACCOUNT), bỏ qua quét tự động.",
          });
        } else {
          setSweepFeedback({
            tone: "good",
            message: `Đã quét SePay: tải ${res.fetched} giao dịch, thêm mới ${res.inserted}, bỏ qua ${res.skipped}.`,
          });
        }
      }

      await loadData(filter);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể quét giao dịch SePay";
      setActionError(msg);
    } finally {
      setSweeping(false);
    }
  };

  const handleActionSubmit = async () => {
    if (!modalEvent) return;

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setNoteError("Vui lòng nhập ghi chú xử lý trước khi xác nhận.");
      return;
    }

    const targetOrderId = modalEvent.orderId ?? selectedOrderId;
    if (modalAction === "activate" && !targetOrderId) {
      setModalError("Vui lòng chọn đơn hàng để kích hoạt.");
      return;
    }

    try {
      setSubmitting(true);
      setNoteError(null);
      setModalError(null);

      if (modalAction === "activate") {
        if (trpcClient?.adminBilling?.activate?.mutate) {
          await trpcClient.adminBilling.activate.mutate({
            eventId: modalEvent.id,
            orderId: targetOrderId ?? undefined,
            note: trimmedNote,
          });
        }
      } else if (trpcClient?.adminBilling?.markRefunded?.mutate) {
        await trpcClient.adminBilling.markRefunded.mutate({
          eventId: modalEvent.id,
          note: trimmedNote,
        });
      }

      setModalEvent(null);
      setNote("");
      setSelectedOrderId(null);
      await loadData(filter);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xử lý giao dịch";
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center" data-testid="access-denied">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-bad-soft text-bad">
          <Lock size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Truy cập bị từ chối</h1>
        <p className="mt-2 text-sm text-subtle">
          Chỉ quản trị viên mới có quyền truy cập vào trang đối soát thanh toán SePay.
        </p>
      </div>
    );
  }

  const pendingDisplayCount =
    metrics?.pendingCount ?? queue.filter((item) => item.resolutionStatus === "pending_review").length;
  const overdueDisplayCount =
    metrics?.overdueCount ?? queue.filter((item) => item.isOverdue).length;
  const nearOverdueDisplayCount =
    metrics?.nearOverdueCount ??
    queue.filter((item) => !item.isOverdue && item.isNearOverdue).length;
  const resolvedDisplayCount =
    metrics?.resolvedCount ??
    queue.filter((item) =>
      ["resolved", "activated", "refunded"].includes(item.resolutionStatus),
    ).length;

  const isOrderSelectionRequired =
    modalAction === "activate" && modalEvent !== null && !modalEvent.orderId;
  const isSubmitDisabled = submitting || (isOrderSelectionRequired && !selectedOrderId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHead
        eyebrow="Quản trị Vox Flow"
        title="Đối soát thanh toán SePay"
        sub="Cam kết xử lý ngoại lệ trong 24 giờ: rà soát giao dịch thiếu tiền, thừa tiền, sai mã, đơn hết hạn và đối chiếu hoàn tiền thủ công."
      />

      {/* Metrics Banner */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="payment-metrics">
        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold tracking-wider uppercase">Chờ xử lý</span>
            <Clock size={16} className="text-warn" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink" data-testid="metric-pending-count">
            {pendingDisplayCount}
          </div>
          <p className="mt-1 text-xs text-subtle">Cần rà soát thủ công</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold tracking-wider uppercase">Quá hạn SLA 24h</span>
            <AlertCircle size={16} className="text-bad" />
          </div>
          <div className="mt-2 text-2xl font-bold text-bad" data-testid="metric-overdue-count">
            {overdueDisplayCount}
          </div>
          <p className="mt-1 text-xs text-subtle">Ưu tiên xử lý ngay</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Sắp quá hạn 18–24h
            </span>
            <AlertTriangle size={16} className="text-warn" />
          </div>
          <div
            className="mt-2 text-2xl font-bold text-warn"
            data-testid="metric-near-overdue-count"
          >
            {nearOverdueDisplayCount}
          </div>
          <p className="mt-1 text-xs text-subtle">Sắp chạm mốc 24h</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold tracking-wider uppercase">Đã xử lý</span>
            <CheckCircle2 size={16} className="text-good" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink" data-testid="metric-resolved-count">
            {resolvedDisplayCount}
          </div>
          <p className="mt-1 text-xs text-subtle">Đã khớp hoặc hoàn tất</p>
        </Card>
      </div>

      {actionError && (
        <div className="mt-4 rounded-xl bg-bad-soft p-4 text-sm text-bad" data-testid="action-error">
          {actionError}
        </div>
      )}

      {sweepFeedback && (
        <div
          className={`mt-4 rounded-xl p-4 text-sm ${
            sweepFeedback.tone === "warn"
              ? "bg-warn-soft text-warn"
              : "bg-good-soft text-good"
          }`}
          data-testid="sweep-feedback"
        >
          {sweepFeedback.message}
        </div>
      )}

      {/* Filter Tabs & Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-paper-2 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={filter === "pending_review" ? "accent" : "soft"}
            onClick={() => setFilter("pending_review")}
            data-testid="filter-pending"
          >
            Chờ xử lý ({pendingDisplayCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "resolved" ? "accent" : "soft"}
            onClick={() => setFilter("resolved")}
            data-testid="filter-resolved"
          >
            Đã xử lý ({resolvedDisplayCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "accent" : "soft"}
            onClick={() => setFilter("all")}
            data-testid="filter-all"
          >
            Tất cả
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadData(filter)}
            disabled={loading || sweeping}
            data-testid="btn-refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleTriggerSweep}
            disabled={sweeping || loading}
            data-testid="btn-trigger-sweep"
          >
            <Sparkles size={14} className={sweeping ? "animate-pulse" : ""} />
            {sweeping ? "Đang quét SePay..." : "Quét SePay ngay"}
          </Button>
        </div>
      </div>

      {/* Queue List */}
      <div className="mt-6 space-y-4" data-testid="payment-queue-list">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-paper-2 p-12 text-center text-subtle">
            Không có giao dịch nào trong danh sách này.
          </div>
        ) : (
          queue.map((item) => {
            const classificationMeta = CLASSIFICATION_META[item.classification];
            const resolutionMeta = RESOLUTION_META[item.resolutionStatus];
            const sourceMeta = SOURCE_META[item.source];

            const canActivate =
              item.resolutionStatus === "pending_review" &&
              item.classification !== "underpaid" &&
              item.order?.status !== "paid" &&
              item.order?.status !== "refunded";

            const canMarkRefunded =
              item.resolutionStatus === "pending_review" ||
              item.resolutionStatus === "activated" ||
              item.resolutionStatus === "resolved";

            const cardHighlight = item.isOverdue
              ? "border-l-4 border-l-bad"
              : item.isNearOverdue
                ? "border-l-4 border-l-warn"
                : "";

            return (
              <Card
                key={item.id}
                className={`p-5 transition hover:border-brand/40 ${cardHighlight}`}
                data-testid={`payment-item-${item.id}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span data-testid={`badge-classification-${item.id}`}>
                        <Badge tone={classificationMeta.tone}>{classificationMeta.label}</Badge>
                      </span>
                      <span data-testid={`badge-resolution-${item.id}`}>
                        <Badge tone={resolutionMeta.tone}>{resolutionMeta.label}</Badge>
                      </span>
                      <Badge tone={sourceMeta.tone}>{sourceMeta.label}</Badge>

                      {item.isOverdue && (
                        <span data-testid={`badge-sla-overdue-${item.id}`}>
                          <Badge tone="bad">
                            <AlertCircle size={12} /> Quá hạn SLA 24h
                          </Badge>
                        </span>
                      )}

                      {!item.isOverdue && item.isNearOverdue && (
                        <span data-testid={`badge-sla-near-overdue-${item.id}`}>
                          <Badge tone="warn">
                            <AlertTriangle size={12} /> Sắp quá hạn
                          </Badge>
                        </span>
                      )}
                    </div>

                    {/* Transfer & Order Summary */}
                    <div className="grid gap-3 rounded-2xl bg-paper-2/50 p-3.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <div className="text-xs text-subtle">Số tiền chuyển</div>
                        <div className="mt-0.5 font-bold text-ink">
                          {vnd(item.transferAmount)}
                        </div>
                        {item.order && (
                          <div className="text-xs text-subtle">
                            Đơn yêu cầu: <span className="font-medium text-ink">{vnd(item.order.amountVnd)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs text-subtle">Mã CK / Tham chiếu</div>
                        <div className="mt-0.5 font-mono text-xs font-semibold text-ink">
                          {item.extractedCode || "(Không trích xuất được mã)"}
                        </div>
                        <div className="text-xs text-subtle">
                          Ref: {item.referenceCode || "—"} · {item.gateway}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-subtle">Học viên & Gói</div>
                        {item.userEmail || item.userName ? (
                          <div className="mt-0.5 font-medium text-ink">
                            {item.userName ? `${item.userName} (${item.userEmail ?? "—"})` : item.userEmail}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-subtle">Chưa gắn với đơn hàng</div>
                        )}
                        {item.order ? (
                          <div className="text-xs text-subtle">
                            {item.order.planName} · {item.order.transferCode} (
                            {ORDER_STATUS_LABEL[item.order.status]})
                          </div>
                        ) : (
                          <div className="text-xs text-subtle">
                            TK nhận: {item.accountNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata timestamps */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
                      <span>Ngày giao dịch: {item.transactionDate}</span>
                      <span>Ghi nhận: {formatDateTime(item.createdAt)}</span>
                      {item.resolutionStatus === "pending_review" && (
                        <span>Hạn SLA 24h: {formatDateTime(item.slaDueAt)}</span>
                      )}
                    </div>

                    {/* Policy Hint for Underpaid */}
                    {item.classification === "underpaid" && (
                      <div
                        className="rounded-xl bg-bad-soft/70 px-3.5 py-2.5 text-xs font-medium text-bad"
                        data-testid={`policy-underpaid-${item.id}`}
                      >
                        Chính sách: chỉ hoàn tiền thủ công ngoài ngân hàng, không nhận chuyển bù
                      </div>
                    )}

                    {/* Action History */}
                    {item.actions.length > 0 && (
                      <div
                        className="space-y-1.5 border-t border-paper-2 pt-3"
                        data-testid={`action-history-${item.id}`}
                      >
                        <div className="text-xs font-semibold tracking-wider text-subtle uppercase">
                          Lịch sử xử lý ({item.actions.length})
                        </div>
                        {item.actions.map((act) => (
                          <div
                            key={act.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-paper-2/40 px-3 py-2 text-xs"
                          >
                            <div className="space-x-2">
                              <span className="font-semibold text-ink">
                                {act.action === "activate" ? "Kích hoạt tay" : "Đánh dấu hoàn tiền"}
                              </span>
                              <span className="text-ink-2">— {act.note}</span>
                            </div>
                            <div className="text-subtle">
                              {act.actorEmail} · {formatDateTime(act.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {(canActivate || canMarkRefunded) && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
                      {canActivate && (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => openActionModal(item, "activate")}
                          data-testid={`btn-activate-${item.id}`}
                        >
                          <ShieldCheck size={14} />
                          Kích hoạt tay
                        </Button>
                      )}
                      {canMarkRefunded && (
                        <Button
                          size="sm"
                          variant={item.classification === "underpaid" ? "primary" : "outline"}
                          onClick={() => openActionModal(item, "mark_refunded")}
                          data-testid={`btn-refund-${item.id}`}
                        >
                          <RotateCcw size={14} />
                          Đánh dấu hoàn tiền
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Action Modal */}
      {modalEvent && (
        <Modal open={Boolean(modalEvent)} onClose={closeModal} width="max-w-2xl">
          <div className="space-y-5 p-6" data-testid="payment-action-modal">
            <div>
              <h2 className="text-xl font-bold text-ink">
                {modalAction === "activate"
                  ? "Kích hoạt đơn hàng thủ công"
                  : "Đánh dấu hoàn tiền thủ công"}
              </h2>
              <p className="mt-1 text-xs text-subtle">
                Giao dịch ID: {modalEvent.id} · Số tiền chuyển: {vnd(modalEvent.transferAmount)}
              </p>
            </div>

            {/* Event & Order Summary */}
            <div className="space-y-2 rounded-2xl bg-paper-2/60 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-subtle">Phân loại:</span>
                <Badge tone={CLASSIFICATION_META[modalEvent.classification].tone}>
                  {CLASSIFICATION_META[modalEvent.classification].label}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-subtle">Mã chuyển khoản:</span>
                <span className="font-mono font-semibold text-ink">
                  {modalEvent.extractedCode || "(Không có mã)"}
                </span>
              </div>
              {modalEvent.order && (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-subtle">Đơn hàng liên kết:</span>
                    <span className="font-semibold text-ink">
                      {modalEvent.order.transferCode} · {modalEvent.order.planName} (
                      {vnd(modalEvent.order.amountVnd)})
                    </span>
                  </div>
                  {(modalEvent.userEmail || modalEvent.userName) && (
                    <div className="flex justify-between gap-4">
                      <span className="text-subtle">Học viên:</span>
                      <span className="text-ink">
                        {modalEvent.userName
                          ? `${modalEvent.userName} (${modalEvent.userEmail ?? "—"})`
                          : modalEvent.userEmail}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Refund Policy Reminder */}
            {modalAction === "mark_refunded" && (
              <div
                className="rounded-xl bg-warn-soft/70 p-4 text-xs text-warn"
                data-testid="refund-policy-reminder"
              >
                <div className="flex items-start gap-2">
                  <Banknote size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Hoàn tiền được thực hiện thủ công ngoài ngân hàng; hệ thống chỉ ghi nhận trạng
                    thái và thu hồi lượt chưa dùng (giữ nguyên bài đã mở của gói Theo lượt).
                  </p>
                </div>
              </div>
            )}

            {/* Order Picker when activating unknown_code / unlinked event */}
            {isOrderSelectionRequired && (
              <div className="space-y-3 rounded-2xl border border-paper-2 p-4">
                <div>
                  <label
                    htmlFor="order-search-input"
                    className="block text-sm font-semibold text-ink"
                  >
                    Tìm và chọn đơn hàng cần kích hoạt
                  </label>
                  <p className="mt-0.5 text-xs text-subtle">
                    Giao dịch chưa khớp tự động với đơn nào. Hãy tìm theo mã chuyển khoản hoặc email
                    học viên.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle"
                    />
                    <input
                      id="order-search-input"
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => handleOrderQueryChange(e.target.value)}
                      placeholder="Nhập mã chuyển khoản (VD: VF...) hoặc email..."
                      className="w-full rounded-xl border border-paper-2 bg-paper py-2 pr-3 pl-9 text-sm focus:border-brand focus:outline-none"
                      data-testid="input-search-orders"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void runOrderSearch(orderSearchQuery)}
                    disabled={searchingOrders}
                    data-testid="btn-search-orders"
                  >
                    Tìm
                  </Button>
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto" data-testid="order-search-results">
                  {searchingOrders ? (
                    <div className="py-4 text-center text-xs text-subtle">
                      Đang tìm đơn hàng...
                    </div>
                  ) : orderResults.length === 0 ? (
                    <div className="py-4 text-center text-xs text-subtle">
                      Không tìm thấy đơn hàng phù hợp.
                    </div>
                  ) : (
                    orderResults.map((ord) => {
                      const unavailable = ord.status === "paid" || ord.status === "refunded";
                      const isSelected = selectedOrderId === ord.id;
                      return (
                        <button
                          key={ord.id}
                          type="button"
                          disabled={unavailable}
                          onClick={() => setSelectedOrderId(ord.id)}
                          data-testid={`order-option-${ord.id}`}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-xs transition ${
                            isSelected
                              ? "border-brand bg-brand-soft/40"
                              : "border-paper-2 bg-white hover:border-brand/40"
                          } ${unavailable ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-semibold text-ink">
                              {ord.transferCode} · {ord.planName}
                            </div>
                            <div className="mt-0.5 truncate text-subtle">
                              {ord.userEmail || ord.userName || ord.userId}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-semibold text-ink">{vnd(ord.amountVnd)}</div>
                            <div className="text-subtle">{ORDER_STATUS_LABEL[ord.status]}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Mandatory Note */}
            <div className="space-y-1.5">
              <label htmlFor="payment-action-note" className="block text-xs font-semibold text-ink">
                Ghi chú xử lý <span className="text-bad">*</span>
              </label>
              <textarea
                id="payment-action-note"
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (noteError && e.target.value.trim()) {
                    setNoteError(null);
                  }
                }}
                placeholder={
                  modalAction === "activate"
                    ? "Ví dụ: Đã đối chiếu sao kê, học viên chuyển thừa 20.000đ, kích hoạt gói Tháng..."
                    : "Ví dụ: Đã hoàn tiền thủ công qua chuyển khoản ngân hàng lúc 14:30..."
                }
                className="w-full rounded-xl border border-paper-2 p-3 text-sm focus:border-brand focus:outline-none"
                data-testid="textarea-payment-note"
              />
              {noteError && (
                <p className="text-xs font-medium text-bad" data-testid="note-validation-error">
                  {noteError}
                </p>
              )}
            </div>

            {modalError && (
              <div
                className="rounded-xl bg-bad-soft p-3 text-xs text-bad"
                data-testid="modal-action-error"
              >
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                Hủy
              </Button>
              <Button
                variant={modalAction === "activate" ? "accent" : "primary"}
                onClick={handleActionSubmit}
                disabled={isSubmitDisabled}
                data-testid="btn-submit-payment-action"
              >
                {submitting
                  ? "Đang xử lý..."
                  : modalAction === "activate"
                    ? "Xác nhận kích hoạt"
                    : "Xác nhận đã hoàn tiền"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
