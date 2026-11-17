import { Link } from "@tanstack/react-router";
import { Badge } from "@vox-flow/ui/ds/badge";
import { Button } from "@vox-flow/ui/ds/button";
import { Card } from "@vox-flow/ui/ds/card";
import { PageHead } from "@vox-flow/ui/ds/page-head";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { fmtBand, formatDateOnly, formatDateTime, vnd } from "@/lib/format";
import { trpcClient } from "@/utils/trpc";

export type AdminUserPlanFilter = "all" | "active_paid" | "expired" | "free";

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date | string | number;
  planStatus: "active_paid" | "expired" | "free";
  profile: {
    targetBand: number;
    examDate: string | null;
    onboardedAt: Date | string | number | null;
  } | null;
  subscription: {
    planId: "week" | "month" | "exam";
    planName: string;
    pointsRemaining: number;
    planPointsTotal: number;
    expiresAt: Date | string | number;
    isActive: boolean;
  } | null;
  detailCredits: number;
  paidOrderCount: number;
  totalPaidVnd: number;
  lastOrderAt: Date | string | number | null;
}

export interface AdminUsersListResult {
  items: AdminUserListItem[];
  total: number;
}

export interface UsersScreenProps {
  initialData?: AdminUsersListResult;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 30;

const PLAN_FILTERS: Array<{ value: AdminUserPlanFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "active_paid", label: "Đang có gói" },
  { value: "expired", label: "Hết hạn" },
  { value: "free", label: "Miễn phí" },
];

export function UsersScreen({
  initialData,
  pageSize = DEFAULT_PAGE_SIZE,
}: UsersScreenProps = {}) {
  const [data, setData] = useState<AdminUsersListResult>(
    initialData ?? { items: [], total: 0 },
  );
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<AdminUserPlanFilter>("all");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqSeqRef = useRef(0);

  const loadUsers = useCallback(
    async (params: {
      query: string;
      planFilter: AdminUserPlanFilter;
      offset: number;
    }) => {
      if (!trpcClient?.adminUsers?.list?.query) return;
      const seq = ++reqSeqRef.current;
      try {
        setLoading(true);
        setError(null);
        const result = await trpcClient.adminUsers.list.query({
          query: params.query || undefined,
          planFilter: params.planFilter,
          limit: pageSize,
          offset: params.offset,
        });
        if (seq !== reqSeqRef.current) return;
        setData(result as AdminUsersListResult);
      } catch (err: unknown) {
        if (seq !== reqSeqRef.current) return;
        const message = err instanceof Error ? err.message : "Không thể tải danh sách người dùng.";
        setError(message);
      } finally {
        if (seq === reqSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [pageSize],
  );

  useEffect(() => {
    if (!initialData) {
      void loadUsers({ query: "", planFilter: "all", offset: 0 });
    }
  }, [initialData, loadUsers]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    setSubmittedQuery(trimmed);
    setOffset(0);
    void loadUsers({ query: trimmed, planFilter, offset: 0 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSubmittedQuery("");
    setOffset(0);
    void loadUsers({ query: "", planFilter, offset: 0 });
  };

  const handleFilterChange = (nextFilter: AdminUserPlanFilter) => {
    setPlanFilter(nextFilter);
    setOffset(0);
    void loadUsers({ query: submittedQuery, planFilter: nextFilter, offset: 0 });
  };

  const handleRefresh = () => {
    void loadUsers({ query: submittedQuery, planFilter, offset });
  };

  const handlePrevPage = () => {
    if (offset <= 0 || loading) return;
    const nextOffset = Math.max(0, offset - pageSize);
    setOffset(nextOffset);
    void loadUsers({ query: submittedQuery, planFilter, offset: nextOffset });
  };

  const handleNextPage = () => {
    if (offset + pageSize >= data.total || loading) return;
    const nextOffset = offset + pageSize;
    setOffset(nextOffset);
    void loadUsers({ query: submittedQuery, planFilter, offset: nextOffset });
  };

  const fromIdx = data.total === 0 ? 0 : offset + 1;
  const toIdx = Math.min(offset + data.items.length, data.total);

  return (
    <div>
      <PageHead
        eyebrow="Quản trị học viên"
        title="Người dùng"
        sub="Tra cứu tài khoản, kiểm tra gói điểm và lịch sử thanh toán của học viên."
        right={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
            Làm mới
          </Button>
        }
      />

      {/* Search + Filters */}
      <Card className="mb-6 p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo email, tên hoặc user ID..."
              aria-label="Tìm kiếm người dùng"
              className="h-11 w-full rounded-full border border-line bg-paper pr-10 pl-10 text-sm outline-none focus:border-ink"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-subtle hover:bg-ink/5 hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            Tìm kiếm
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái gói">
            {PLAN_FILTERS.map((f) => {
              const active = planFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleFilterChange(f.value)}
                  aria-pressed={active}
                  className={
                    active
                      ? "h-8 cursor-pointer rounded-full bg-ink px-3.5 text-xs font-semibold text-paper transition-colors"
                      : "h-8 cursor-pointer rounded-full border border-line bg-white px-3.5 text-xs font-semibold text-ink-2 transition-colors hover:border-ink/40"
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-subtle">
            Tổng: <span className="font-semibold text-ink">{data.total}</span> người dùng
          </div>
        </div>
      </Card>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* User List */}
      {data.items.length === 0 ? (
        <Card className="p-10 text-center">
          <Users size={28} className="mx-auto text-subtle" />
          <p className="mt-3 text-sm font-semibold text-ink">
            {loading ? "Đang tải dữ liệu..." : "Không tìm thấy người dùng phù hợp"}
          </p>
          <p className="mt-1 text-xs text-subtle">
            Thử đổi từ khóa tìm kiếm hoặc bộ lọc gói đăng ký.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => {
            const sub = item.subscription;
            return (
              <Card
                key={item.id}
                className="p-4 transition-colors hover:border-ink/25 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Identity & profile */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-bold text-ink">
                        {item.name || "Chưa đặt tên"}
                      </span>
                      {item.planStatus === "active_paid" && sub ? (
                        <Badge tone="good">{sub.planName}</Badge>
                      ) : item.planStatus === "expired" ? (
                        <Badge tone="warn">
                          Hết hạn{sub ? ` · ${sub.planName}` : ""}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Miễn phí</Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                      <span className="truncate font-medium">{item.email}</span>
                      <span className="font-mono text-[11px] text-subtle">{item.id}</span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
                      <span>
                        Band mục tiêu:{" "}
                        <strong className="text-ink">
                          {item.profile ? fmtBand(item.profile.targetBand) : "Chưa đặt"}
                        </strong>
                      </span>
                      <span>
                        Ngày thi:{" "}
                        <strong className="text-ink">
                          {item.profile?.examDate ? formatDateOnly(item.profile.examDate) : "Chưa đặt"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Subscription & Billing summary */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-right">
                      <div>
                        <div className="text-subtle">Điểm & Credit</div>
                        <div className="font-semibold text-ink">
                          {sub ? `${sub.pointsRemaining} / ${sub.planPointsTotal} điểm` : "0 điểm"}
                          {" · "}
                          {item.detailCredits} credit
                        </div>
                        {sub && (
                          <div className="text-[11px] text-subtle">
                            Hạn: {formatDateTime(sub.expiresAt)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-subtle">Đơn đã thanh toán</div>
                        <div className="font-semibold text-ink">
                          {item.paidOrderCount} đơn · {vnd(item.totalPaidVnd)}
                        </div>
                        {item.lastOrderAt && (
                          <div className="text-[11px] text-subtle">
                            Gần nhất: {formatDateOnly(item.lastOrderAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      to="/users/$userId"
                      params={{ userId: item.id }}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full border border-line bg-paper px-4 text-xs font-semibold text-ink transition-colors hover:border-ink"
                    >
                      Chi tiết
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-subtle">
          {data.total > 0
            ? `Hiển thị ${fromIdx}–${toIdx} / ${data.total} người dùng`
            : "0 kết quả"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={offset <= 0 || loading}
          >
            <ArrowLeft size={14} />
            Trang trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={offset + pageSize >= data.total || loading}
          >
            Trang sau
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
