import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Lock,
  MessageSquare,
  Play,
  RefreshCw,
  Shield,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { Modal } from "@/components/ds/modal";
import { ENV } from "@/env.public";
import { PageHead } from "@/layouts/page-head";
import { trpcClient } from "@/utils/trpc";

export interface DisputeItem {
  id: string;
  attemptId: string;
  userId: string;
  studentName?: string | null;
  studentEmail?: string | null;
  targetCriterion: string;
  expectedBand: string;
  reason?: string | null;
  shareConsent: boolean;
  status: "open" | "reviewing" | "resolved" | "rejected";
  dueAt: Date | string | number;
  warnedAt?: Date | string | number | null;
  resolvedAt?: Date | string | number | null;
  previousBand?: string | null;
  resolvedBand?: string | null;
  replyText?: string | null;
  createdAt: Date | string | number;
  isNearOverdue?: boolean;
  isOverdue?: boolean;
}

export interface DisputeCaseDetail {
  dispute: DisputeItem;
  attempt: {
    id: string;
    mode: string;
    status: string;
    submittedAt?: Date | string | number | null;
  } | null;
  answers: Array<{
    id: string;
    questionKey: string;
    questionText: string;
    partNumber: number;
    orderIndex: number;
    audioPlayable: boolean;
    audioUrl?: string | null;
  }>;
}

export interface DisputeMetrics {
  totalCount: number;
  openCount: number;
  resolvedCount: number;
  onTimeRate: number;
  weeklyCount: number;
  nearOverdueCount: number;
}

export interface DisputesScreenProps {
  initialQueue?: DisputeItem[];
  initialMetrics?: DisputeMetrics;
  accessDeniedForTest?: boolean;
}

const TEMPLATES = [
  {
    id: "accept",
    label: "Chấp nhận nâng band",
    template: (crit: string, band: string) =>
      `Chào bạn, sau khi rà soát bài thi phần ${crit}, ban chuyên môn xác nhận hệ thống AI đã chấm khắt khe hơn tiêu chí IELTS chuẩn. Điểm của bạn đã được cập nhật thành Band ${band}. Chúc bạn ôn tập tốt!`,
  },
  {
    id: "reject",
    label: "Giữ nguyên điểm số",
    template: (crit: string) =>
      `Chào bạn, sau khi xem xét chi tiết bài thi phần ${crit}, ban chuyên môn nhận thấy kết quả hiện tại đã phản ánh chính xác các tiêu chí chấm. Điểm số của bạn được giữ nguyên. Cảm ơn bạn đã phản hồi!`,
  },
  {
    id: "no_audio",
    label: "Rà soát không có audio (theo transcript)",
    template: (crit: string) =>
      `Chào bạn, do bạn không đồng ý chia sẻ bản ghi âm, chúng tôi chỉ có thể đối chiếu qua bản ghi văn bản transcript. Điểm số đã được xem xét lại theo tiêu chí chuẩn. Cảm ơn bạn!`,
  },
];

export function DisputesScreen({
  initialQueue,
  initialMetrics,
  accessDeniedForTest = false,
}: DisputesScreenProps) {
  const [queue, setQueue] = useState<DisputeItem[]>(initialQueue ?? []);
  const [metrics, setMetrics] = useState<DisputeMetrics | null>(initialMetrics ?? null);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(accessDeniedForTest);

  // Selected case for review modal
  const [selectedCase, setSelectedCase] = useState<DisputeCaseDetail | null>(null);
  const [loadingCase, setLoadingCase] = useState(false);

  // Resolution form state
  const [resolutionStatus, setResolutionStatus] = useState<"resolved" | "rejected">("resolved");
  const [resolutionBand, setResolutionBand] = useState<string>("6.5");
  const [previousBand, setPreviousBand] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");
  const [resolving, setResolving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setActionError(null);
      if (trpcClient?.disputeAdmin?.metrics?.query) {
        const m = await trpcClient.disputeAdmin.metrics.query();
        setMetrics(m as DisputeMetrics);
      }

      if (trpcClient?.disputeAdmin?.queue?.query) {
        const q = await trpcClient.disputeAdmin.queue.query({ status: filter });
        setQueue(q as DisputeItem[]);
      }
      setAccessDenied(false);
    } catch {
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialQueue && !accessDeniedForTest) {
      void loadData();
    }
  }, [filter]);

  const openCaseModal = async (item: DisputeItem) => {
    try {
      setLoadingCase(true);
      setActionError(null);

      // Default template
      const defaultText = TEMPLATES[0]!.template(item.targetCriterion, item.expectedBand);
      setReplyText(defaultText);
      setResolutionBand(item.expectedBand);
      setPreviousBand(item.previousBand ?? "");
      setResolutionStatus("resolved");

      if (trpcClient?.disputeAdmin?.getCase?.query) {
        const detail = await trpcClient.disputeAdmin.getCase.query({ id: item.id });
        if (detail) {
          setSelectedCase(detail as DisputeCaseDetail);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải chi tiết hồ sơ";
      setActionError(msg);
    } finally {
      setLoadingCase(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    if (!selectedCase) return;
    const t = TEMPLATES.find((item) => item.id === templateId);
    if (!t) return;
    const text = t.template(selectedCase.dispute.targetCriterion, resolutionBand);
    setReplyText(text);
    if (templateId === "accept") {
      setResolutionStatus("resolved");
    } else if (templateId === "reject") {
      setResolutionStatus("rejected");
    }
  };


  const handleResolveSubmit = async () => {
    if (!selectedCase) return;
    try {
      setResolving(true);
      setActionError(null);

      if (trpcClient?.disputeAdmin?.resolve?.mutate) {
        await trpcClient.disputeAdmin.resolve.mutate({
          id: selectedCase.dispute.id,
          status: resolutionStatus,
          resolvedBand:
            resolutionStatus === "resolved"
              ? (resolutionBand as "5.0" | "5.5" | "6.0" | "6.5" | "7.0" | "7.5" | "8.0")
              : undefined,
          previousBand: previousBand.trim() || selectedCase.dispute.previousBand || undefined,
          replyText,
        });
      }

      // Close modal and reload queue
      setSelectedCase(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xử lý báo lỗi";
      setActionError(msg);
    } finally {
      setResolving(false);
    }
  };

  const formatDue = (dateVal: Date | string | number) => {
    const d = new Date(dateVal);
    return d.toLocaleString("vi-VN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center" data-testid="access-denied">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-bad-soft text-bad">
          <Lock size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Truy cập bị từ chối</h1>
        <p className="mt-2 text-sm text-subtle">
          Chỉ người sở hữu sản phẩm (admin) mới có quyền truy cập vào hàng đợi xử lý báo lỗi.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHead
        eyebrow="Quản trị Vox Flow"
        title="Hàng đợi xử lý báo lỗi chấm"
        sub="Cam kết giải quyết trong 72 giờ: xem xét bài thi, đối chiếu tiêu chí và cập nhật band điểm."
      />

      {/* Metrics Banner */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="dispute-metrics">
        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider">Tỷ lệ đúng hạn</span>
            <CheckCircle size={16} className="text-good" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink" data-testid="metric-ontime-rate">
            {metrics?.onTimeRate ?? 100}%
          </div>
          <p className="mt-1 text-xs text-subtle">Cam kết dưới 72 giờ</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider">Báo lỗi tuần này</span>
            <MessageSquare size={16} className="text-brand" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink" data-testid="metric-weekly-count">
            {metrics?.weeklyCount ?? 0}
          </div>
          <p className="mt-1 text-xs text-subtle">&gt; 5 cần tìm thêm người</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang chờ xử lý</span>
            <Clock size={16} className="text-warn" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink" data-testid="metric-open-count">
            {metrics?.openCount ?? queue.filter((i) => i.status === "open").length}
          </div>
          <p className="mt-1 text-xs text-subtle">Cần giải quyết sớm</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider">Sắp quá hạn (&lt;12h)</span>
            <AlertTriangle size={16} className="text-bad" />
          </div>
          <div className="mt-2 text-2xl font-bold text-bad" data-testid="metric-near-overdue-count">
            {metrics?.nearOverdueCount ?? 0}
          </div>
          <p className="mt-1 text-xs text-subtle">Ưu tiên xử lý ngay</p>
        </Card>
      </div>

      {actionError && (
        <div className="mt-4 rounded-xl bg-bad-soft p-4 text-sm text-bad" data-testid="action-error">
          {actionError}
        </div>
      )}

      {/* Filter Tabs & Refresh */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-paper-2 pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filter === "open" ? "accent" : "soft"}
            onClick={() => setFilter("open")}
            data-testid="filter-open"
          >
            Chờ xử lý ({metrics?.openCount ?? queue.filter((i) => i.status === "open" || i.status === "reviewing").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "accent" : "soft"}
            onClick={() => setFilter("all")}
            data-testid="filter-all"
          >
            Tất cả
          </Button>
          <Button
            size="sm"
            variant={filter === "resolved" ? "accent" : "soft"}
            onClick={() => setFilter("resolved")}
            data-testid="filter-resolved"
          >
            Đã xử lý
          </Button>
        </div>

        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </Button>
      </div>

      {/* Queue List */}
      <div className="mt-6 space-y-3" data-testid="dispute-queue-list">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-paper-2 p-12 text-center text-subtle">
            Không có báo lỗi nào trong hàng đợi.
          </div>
        ) : (
          queue.map((item) => (
            <Card
              key={item.id}
              className={`p-4 transition hover:border-brand/40 ${
                item.isNearOverdue ? "border-l-4 border-l-warn" : ""
              }`}
              data-testid={`dispute-item-${item.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">
                      {item.studentName || item.studentEmail || "Học viên"}
                    </span>
                    <Badge tone="accent">Tiêu chí: {item.targetCriterion}</Badge>
                    <Badge tone="neutral">Kỳ vọng: Band {item.expectedBand}</Badge>
                    {item.previousBand && (
                      <span className="text-xs text-subtle">(Band cũ: {item.previousBand})</span>
                    )}

                    {item.isNearOverdue && (
                      <span data-testid="badge-near-overdue">
                        <Badge tone="warn">
                          <AlertTriangle size={12} /> Sắp quá hạn (&lt;12h)
                        </Badge>
                      </span>
                    )}

                    {item.status === "resolved" && (
                      <Badge tone="good">
                        <CheckCircle size={12} /> Đã giải quyết (Band {item.resolvedBand})
                      </Badge>
                    )}
                    {item.status === "rejected" && (
                      <Badge tone="bad">
                        <AlertCircle size={12} /> Đã từ chối
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-subtle line-clamp-1">
                    Lý do: {item.reason || "(Không có lý do chi tiết)"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-subtle">
                    <span>Hạn xử lý: {formatDue(item.dueAt)}</span>
                    <span className="flex items-center gap-1">
                      {item.shareConsent ? (
                        <span className="flex items-center gap-1 text-good" data-testid="audio-consented">
                          <Volume2 size={12} /> Có quyền nghe audio
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-subtle" data-testid="audio-no-consent">
                          <VolumeX size={12} /> Không có quyền nghe audio
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => openCaseModal(item)}
                    data-testid={`btn-resolve-${item.id}`}
                  >
                    <Eye size={14} />
                    {item.status === "resolved" || item.status === "rejected"
                      ? "Xem chi tiết"
                      : "Xử lý khiếu nại"}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Case Review & Resolution Modal */}
      {selectedCase && (
        <Modal
          open={Boolean(selectedCase)}
          onClose={() => setSelectedCase(null)}
          width="max-w-2xl"
        >
          <div className="p-6 space-y-6" data-testid="dispute-case-modal">
            <div>
              <h2 className="text-xl font-bold text-ink">Xử lý báo lỗi chấm thi</h2>
              <p className="text-xs text-subtle mt-1">
                Hồ sơ ID: {selectedCase.dispute.id} · Bài làm ID: {selectedCase.dispute.attemptId}
              </p>
            </div>

            {/* Student & Dispute Info */}
            <div className="rounded-xl bg-paper-2/60 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-subtle">Học viên:</span>
                <span className="font-semibold text-ink">
                  {selectedCase.dispute.studentName} ({selectedCase.dispute.studentEmail})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle">Tiêu chí khiếu nại:</span>
                <span className="font-semibold text-brand">
                  {selectedCase.dispute.targetCriterion} (Kỳ vọng: Band{" "}
                  {selectedCase.dispute.expectedBand})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle">Lý do học viên nêu:</span>
                <span className="text-ink max-w-sm text-right">
                  {selectedCase.dispute.reason || "Không ghi"}
                </span>
              </div>
            </div>

            {/* Audio Access & Player Section */}
            <div className="border border-paper-2 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
                  <Volume2 size={16} /> Bản ghi âm phần nói
                </h3>
                {selectedCase.dispute.shareConsent ? (
                  <Badge tone="good">Được phép nghe</Badge>
                ) : (
                  <span data-testid="modal-audio-denied-badge">
                    <Badge tone="warn">Không được phép nghe</Badge>
                  </span>
                )}
              </div>

              {selectedCase.dispute.shareConsent ? (
                <div className="space-y-3" data-testid="audio-playable-section">
                  <p className="text-xs text-subtle">
                    Học viên đã đồng ý chia sẻ bản ghi âm để phục vụ đối chiếu tiêu chí.
                  </p>
                  {selectedCase.answers.map((ans) => (
                    <div
                      key={ans.id}
                      className="rounded-lg bg-paper-2/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="text-xs text-ink font-medium">
                        Part {ans.partNumber}: {ans.questionText}
                      </span>
                      {ans.audioUrl && (
                        <audio
                          controls
                          crossOrigin="use-credentials"
                          src={
                            ans.audioUrl.startsWith("http")
                              ? ans.audioUrl
                              : `${(ENV.VITE_SERVER_URL ?? "").replace(/\/$/, "")}${ans.audioUrl}`
                          }
                          className="h-8 max-w-xs"
                          data-testid={`audio-player-${ans.id}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-lg bg-warn-soft/50 p-4 text-sm text-warn"
                  data-testid="audio-denied-notice"
                >
                  <p className="font-semibold">⚠️ Không xem được audio</p>
                  <p className="text-xs mt-1">
                    Học viên không đồng ý chia sẻ bản ghi âm cho lần báo lỗi này. Theo chính sách
                    quyền riêng tư, âm thanh bị khóa và bạn chỉ xem xét dựa trên dữ liệu văn bản.
                  </p>
                </div>
              )}
            </div>

            {/* Resolution Form */}
            {selectedCase.dispute.status === "open" ||
            selectedCase.dispute.status === "reviewing" ? (
              <div className="space-y-4 border-t border-paper-2 pt-4">
                <h3 className="font-semibold text-sm text-ink">Quyết định xử lý</h3>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="resStatus"
                      value="resolved"
                      checked={resolutionStatus === "resolved"}
                      onChange={() => setResolutionStatus("resolved")}
                    />
                    Nâng band điểm (Chấp nhận)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="resStatus"
                      value="rejected"
                      checked={resolutionStatus === "rejected"}
                      onChange={() => setResolutionStatus("rejected")}
                    />
                    Giữ nguyên điểm (Từ chối)
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-ink">Band cũ:</label>
                    <input
                      type="text"
                      value={previousBand}
                      onChange={(e) => setPreviousBand(e.target.value)}
                      placeholder="6.0"
                      className="w-20 rounded-lg border border-paper-2 bg-paper px-3 py-1.5 text-sm"
                      data-testid="input-previous-band"
                    />
                  </div>

                  {resolutionStatus === "resolved" && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-ink">Band mới cập nhật:</label>
                      <select
                        value={resolutionBand}
                        onChange={(e) => setResolutionBand(e.target.value)}
                        className="rounded-lg border border-paper-2 bg-paper px-3 py-1.5 text-sm"
                        data-testid="select-resolved-band"
                      >
                        {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"].map((b) => (
                          <option key={b} value={b}>
                            Band {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Templates Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-subtle">Chọn mẫu trả lời nhanh:</label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((tmpl) => (
                      <Button
                        key={tmpl.id}
                        type="button"
                        size="sm"
                        variant="soft"
                        onClick={() => handleApplyTemplate(tmpl.id)}
                      >
                        {tmpl.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Reply Textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-subtle">Nội dung phản hồi học viên:</label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full rounded-xl border border-paper-2 p-3 text-sm focus:border-brand focus:outline-none"
                    placeholder="Nhập nội dung giải thích phản hồi..."
                    data-testid="textarea-reply-text"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setSelectedCase(null)}>
                    Hủy
                  </Button>
                  <Button
                    variant="accent"
                    onClick={handleResolveSubmit}
                    disabled={resolving || !replyText.trim()}
                    data-testid="btn-submit-resolution"
                  >
                    {resolving ? "Đang gửi..." : "Xác nhận & Hoàn tất"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-paper-2/40 p-4 space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  Kết quả đã xử lý
                </span>
                <p className="text-ink">
                  Trạng thái: <strong>{selectedCase.dispute.status}</strong> · Band cập nhật:{" "}
                  <strong>{selectedCase.dispute.resolvedBand || "Không đổi"}</strong>
                </p>
                <p className="text-xs text-subtle">
                  Phản hồi đã gửi: "{selectedCase.dispute.replyText}"
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
