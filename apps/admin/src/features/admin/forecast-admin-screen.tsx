import { Badge } from "@vox-flow/ui/ds/badge";
import { Button } from "@vox-flow/ui/ds/button";
import { Card } from "@vox-flow/ui/ds/card";
import { Modal } from "@vox-flow/ui/ds/modal";
import { PageHead } from "@vox-flow/ui/ds/page-head";
import {
  Archive,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { trpcClient } from "@/utils/trpc";

export type AdminForecastSource = {
  id: string;
  sourceType: "manual" | "student" | "web";
  sourceUrl?: string | null;
  rawContent?: string | null;
};

export type AdminForecastTopic = {
  id: string;
  title: string;
  quarter: string;
  part: number;
  questions: string[];
  status: "draft" | "published" | "archived";
  reviewedBy?: string | null;
  reviewedAt?: number | null;
  sources?: AdminForecastSource[];
  realReportCount: number;
};

export interface ForecastAdminScreenProps {
  initialTopics?: AdminForecastTopic[];
  initialQuarter?: string;
  accessDeniedForTest?: boolean;
}

export function getCurrentQuarter(date: Date = new Date()): string {
  const year = date.getFullYear();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

export function formatQuarterLabel(quarter: string): string {
  const match = /^(\d{4})-Q([1-4])$/.exec(quarter);
  if (!match) return quarter;
  return `${match[1]} - Quý ${match[2]}`;
}

export function buildQuarterOptions(
  topics: AdminForecastTopic[],
  selectedQuarter: string,
  now: Date = new Date(),
): string[] {
  const currentYear = now.getFullYear();
  const set = new Set<string>();
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    for (let q = 1; q <= 4; q++) {
      set.add(`${y}-Q${q}`);
    }
  }
  for (const topic of topics) {
    if (topic.quarter) {
      set.add(topic.quarter);
    }
  }
  if (selectedQuarter && selectedQuarter !== "all") {
    set.add(selectedQuarter);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function ForecastAdminScreen({
  initialTopics,
  initialQuarter,
  accessDeniedForTest = false,
}: ForecastAdminScreenProps) {
  const [topics, setTopics] = useState<AdminForecastTopic[]>(initialTopics ?? []);
  const [quarter, setQuarter] = useState<string>(
    () => initialQuarter ?? (initialTopics ? "all" : getCurrentQuarter()),
  );
  const [customQuarterInput, setCustomQuarterInput] = useState("");
  const [enteringCustomQuarter, setEnteringCustomQuarter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [partFilter, setPartFilter] = useState<"all" | 1 | 2 | 3>("all");
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(accessDeniedForTest);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit State
  const [editingTopic, setEditingTopic] = useState<AdminForecastTopic | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editQuestionsText, setEditQuestionsText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create State
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newQuarter, setNewQuarter] = useState(() =>
    initialQuarter && initialQuarter !== "all" ? initialQuarter : getCurrentQuarter(),
  );
  const [newPart, setNewPart] = useState(1);
  const [newQuestionsText, setNewQuestionsText] = useState("");
  const [newSourceType, setNewSourceType] = useState<"manual" | "student" | "web">("manual");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceContent, setNewSourceContent] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const quarterOptions = useMemo(
    () => buildQuarterOptions(topics, quarter),
    [topics, quarter],
  );

  const loadTopics = async (targetQuarter: string = quarter) => {
    try {
      setLoading(true);
      setActionError(null);
      if (trpcClient?.forecastAdmin?.listDrafts?.query) {
        const data = await trpcClient.forecastAdmin.listDrafts.query(
          targetQuarter === "all" ? {} : { quarter: targetQuarter },
        );
        setTopics(data as AdminForecastTopic[]);
        setAccessDenied(false);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("Admin access required") || errMsg.includes("FORBIDDEN")) {
        setAccessDenied(true);
      } else {
        setActionError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialTopics && !accessDeniedForTest) {
      void loadTopics(quarter);
    }
  }, [quarter]);

  const handlePublish = async (id: string) => {
    try {
      setActionError(null);
      if (trpcClient?.forecastAdmin?.publish?.mutate) {
        await trpcClient.forecastAdmin.publish.mutate({ id });
      }
      setTopics((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: "published", reviewedAt: Date.now() }
            : t,
        ),
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Duyệt đề thất bại";
      setActionError(errMsg);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      setActionError(null);
      if (trpcClient?.forecastAdmin?.archive?.mutate) {
        await trpcClient.forecastAdmin.archive.mutate({ id });
      }
      setTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "archived" } : t)),
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Lưu trữ đề thất bại";
      setActionError(errMsg);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTopic || editSaving) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError("Tiêu đề chủ đề không được để trống.");
      return;
    }
    const questions = editQuestionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    try {
      setEditSaving(true);
      setEditError(null);
      setActionError(null);
      if (trpcClient?.forecastAdmin?.updateDraft?.mutate) {
        await trpcClient.forecastAdmin.updateDraft.mutate({
          id: editingTopic.id,
          title: trimmedTitle,
          questions,
        });
      }
      setTopics((prev) =>
        prev.map((t) =>
          t.id === editingTopic.id
            ? { ...t, title: trimmedTitle, questions }
            : t,
        ),
      );
      setEditingTopic(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Lưu thay đổi thất bại";
      setEditError(errMsg);
      setActionError(errMsg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateDraft = async () => {
    setCreateError(null);
    if (!newTitle.trim()) {
      setCreateError("Vui lòng nhập tiêu đề cho chủ đề.");
      return;
    }

    const trimmedQuarter = newQuarter.trim();
    if (!trimmedQuarter) {
      setCreateError("Vui lòng nhập quý cho chủ đề.");
      return;
    }

    if (
      newSourceType === "web" &&
      (!newSourceUrl.trim() || !/^https?:\/\//i.test(newSourceUrl.trim()))
    ) {
      setCreateError("Nguồn web bắt buộc có URL hợp lệ (bắt đầu bằng http:// hoặc https://).");
      return;
    }

    const questions = newQuestionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    const sources = [
      {
        sourceType: newSourceType,
        sourceUrl: newSourceType === "web" ? newSourceUrl.trim() : undefined,
        rawContent: newSourceContent.trim() || undefined,
      },
    ];

    try {
      if (trpcClient?.forecastAdmin?.createDraft?.mutate) {
        const created = await trpcClient.forecastAdmin.createDraft.mutate({
          title: newTitle.trim(),
          quarter: trimmedQuarter,
          part: newPart,
          questions,
          sources,
        });
        setTopics((prev) => [
          {
            ...created,
            quarter: trimmedQuarter,
            questions,
            sources: sources.map((s, idx) => ({ id: `s_${idx}`, ...s })),
            realReportCount: 0,
          } as AdminForecastTopic,
          ...prev,
        ]);
      } else {
        const localCreated: AdminForecastTopic = {
          id: `draft_${Date.now()}`,
          title: newTitle.trim(),
          quarter: trimmedQuarter,
          part: newPart,
          questions,
          status: "draft",
          realReportCount: 0,
          sources: sources.map((s, idx) => ({ id: `s_${idx}`, ...s })),
        };
        setTopics((prev) => [localCreated, ...prev]);
      }

      if (quarter !== "all" && quarter !== trimmedQuarter) {
        setQuarter(trimmedQuarter);
      }

      setCreating(false);
      setNewTitle("");
      setNewQuestionsText("");
      setNewSourceUrl("");
      setNewSourceContent("");
      setNewSourceType("manual");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Tạo bản nháp thất bại";
      setCreateError(errMsg);
    }
  };

  const handleApplyCustomQuarter = () => {
    const trimmed = customQuarterInput.trim();
    if (!trimmed) return;
    setQuarter(trimmed);
    setEnteringCustomQuarter(false);
    setCustomQuarterInput("");
  };

  if (accessDenied) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-bad-soft p-4 text-bad">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Truy cập bị từ chối</h2>
        <p className="mt-2 max-w-md text-sm text-ink-2">
          Chỉ người sở hữu sản phẩm mới có quyền truy cập vào công cụ quản trị duyệt đề forecast.
        </p>
      </div>
    );
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTopics = topics.filter((t) => {
    if (quarter !== "all" && t.quarter !== quarter) return false;
    if (partFilter !== "all" && t.part !== partFilter) return false;
    if (filter !== "all" && t.status !== filter) return false;
    if (normalizedSearch && !t.title.toLowerCase().includes(normalizedSearch)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHead
        eyebrow="Quản trị"
        title="Duyệt đề Forecast"
        sub="Duyệt đề từ 3 nguồn: tự soạn, học viên báo và thu thập từ web. Mọi đề phải được duyệt trước khi đăng."
      />

      <div className="space-y-6">
        {actionError && (
          <div className="rounded-lg bg-bad-soft p-3 text-sm text-bad">
            {actionError}
          </div>
        )}

        {/* Controls & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search by title */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề..."
                aria-label="Tìm kiếm theo tiêu đề"
                data-testid="input-search-title"
                className="w-60 rounded-lg border border-border bg-paper py-1.5 pr-3 pl-9 text-sm text-ink shadow-sm focus:border-brand focus:outline-none"
              />
            </div>

            {/* Quarter filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="forecast-quarter-select" className="text-sm font-medium text-ink-2">
                Quý:
              </label>
              <select
                id="forecast-quarter-select"
                aria-label="Lọc theo quý"
                data-testid="select-quarter"
                value={enteringCustomQuarter ? "__custom__" : quarter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__custom__") {
                    setEnteringCustomQuarter(true);
                  } else {
                    setEnteringCustomQuarter(false);
                    setQuarter(val);
                  }
                }}
                className="rounded-lg border border-border bg-paper px-3 py-1.5 text-sm font-semibold text-ink shadow-sm focus:outline-none"
              >
                <option value="all">Tất cả quý</option>
                {quarterOptions.map((q) => (
                  <option key={q} value={q}>
                    {formatQuarterLabel(q)}
                  </option>
                ))}
                <option value="__custom__">Quý khác...</option>
              </select>

              {enteringCustomQuarter && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customQuarterInput}
                    onChange={(e) => setCustomQuarterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCustomQuarter();
                      }
                    }}
                    placeholder="VD: 2028-Q1"
                    aria-label="Nhập quý tùy chỉnh"
                    data-testid="input-custom-quarter"
                    className="w-28 rounded-lg border border-border bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleApplyCustomQuarter}
                    data-testid="btn-apply-custom-quarter"
                  >
                    Áp dụng
                  </Button>
                </div>
              )}
            </div>

            {/* Part filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="forecast-part-select" className="text-sm font-medium text-ink-2">
                Phần:
              </label>
              <select
                id="forecast-part-select"
                aria-label="Lọc theo Part"
                data-testid="select-part-filter"
                value={partFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setPartFilter(val === "all" ? "all" : (Number(val) as 1 | 2 | 3));
                }}
                className="rounded-lg border border-border bg-paper px-3 py-1.5 text-sm font-semibold text-ink shadow-sm focus:outline-none"
              >
                <option value="all">Tất cả Part</option>
                <option value={1}>Part 1</option>
                <option value={2}>Part 2</option>
                <option value={3}>Part 3</option>
              </select>
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center rounded-lg border border-border bg-paper p-1">
              {(
                [
                  ["all", "Tất cả"],
                  ["draft", "Bản nháp"],
                  ["published", "Đã duyệt"],
                  ["archived", "Lưu trữ"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    filter === key
                      ? "bg-brand text-white"
                      : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadTopics(quarter)}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateError(null);
                setNewQuarter(quarter === "all" ? getCurrentQuarter() : quarter);
                setCreating(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Thêm bản nháp
            </Button>
          </div>
        </div>

        {/* Topics List */}
        <div className="grid gap-4">
          {filteredTopics.length === 0 ? (
            <Card className="p-8 text-center text-ink-3">
              Không có đề nào phù hợp với bộ lọc.
            </Card>
          ) : (
            filteredTopics.map((topic) => (
              <Card key={topic.id} className="p-5 transition hover:shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-paper-2 px-2 py-0.5 text-xs font-bold text-ink">
                        Part {topic.part}
                      </span>
                      <span className="rounded bg-paper-2 px-2 py-0.5 text-xs font-medium text-ink-2">
                        {topic.quarter}
                      </span>
                      <h3 className="text-base font-bold text-ink">
                        {topic.title}
                      </h3>
                      {topic.status === "draft" && (
                        <Badge tone="warn">Bản nháp</Badge>
                      )}
                      {topic.status === "published" && (
                        <Badge tone="good">
                          <CheckCircle2 className="h-3 w-3" /> Đã duyệt
                        </Badge>
                      )}
                      {topic.status === "archived" && (
                        <Badge tone="neutral">Lưu trữ</Badge>
                      )}
                    </div>

                    {/* Questions */}
                    <div className="pl-2">
                      <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">
                        {topic.questions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Sources & Real reports count */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-ink-3">
                      <div className="flex items-center gap-1.5 font-medium text-ink-2">
                        <Users className="h-3.5 w-3.5 text-brand" />
                        <span>
                          {topic.realReportCount} thí sinh báo đã gặp
                        </span>
                      </div>

                      {topic.sources && topic.sources.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-3">Nguồn:</span>
                          {topic.sources.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded bg-paper-2 px-2 py-0.5"
                            >
                              <FileText className="h-3 w-3 text-ink-2" />
                              {s.sourceType === "manual" && "Tự soạn"}
                              {s.sourceType === "student" && "Học viên báo"}
                              {s.sourceType === "web" && (
                                <>
                                  <span>Web</span>
                                  {s.sourceUrl && (
                                    <a
                                      href={s.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-brand hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTopic(topic);
                        setEditTitle(topic.title);
                        setEditQuestionsText(topic.questions.join("\n"));
                      }}
                      className="gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Sửa
                    </Button>

                    {topic.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => void handlePublish(topic.id)}
                        className="gap-1 bg-good hover:bg-good/90"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Duyệt
                      </Button>
                    )}

                    {topic.status !== "archived" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleArchive(topic.id)}
                        className="gap-1 text-ink-3 hover:text-bad"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Lưu trữ
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTopic && (
        <Modal
          open={Boolean(editingTopic)}
          onClose={() => {
            if (!editSaving) {
              setEditError(null);
              setEditingTopic(null);
            }
          }}
        >
          <div className="space-y-4 p-6">
            <h3 className="text-lg font-bold text-ink">Chỉnh sửa đề thi nháp</h3>
            {editError && (
              <div className="rounded-lg bg-bad-soft p-2.5 text-xs text-bad">{editError}</div>
            )}
            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Tiêu đề chủ đề
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={editSaving}
                className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Danh sách câu hỏi (mỗi câu 1 dòng)
              </label>
              <textarea
                rows={4}
                value={editQuestionsText}
                onChange={(e) => setEditQuestionsText(e.target.value)}
                disabled={editSaving}
                className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={editSaving}
                onClick={() => {
                  setEditError(null);
                  setEditingTopic(null);
                }}
              >
                Hủy
              </Button>
              <Button size="sm" disabled={editSaving} onClick={() => void handleSaveEdit()}>
                {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {creating && (
        <Modal
          open={creating}
          onClose={() => setCreating(false)}
        >
          <div className="space-y-4 p-6">
            <h3 className="text-lg font-bold text-ink">Thêm bản nháp đề mới</h3>

            {createError && (
              <div className="rounded-lg bg-bad-soft p-2.5 text-xs text-bad">
                {createError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Tiêu đề chủ đề
              </label>
              <input
                type="text"
                placeholder="VD: Describe an energetic person you know"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="new-draft-quarter"
                  className="block text-xs font-semibold text-ink-2"
                >
                  Quý (Quarter)
                </label>
                <input
                  id="new-draft-quarter"
                  type="text"
                  list="forecast-quarter-options"
                  placeholder="VD: 2026-Q4"
                  value={newQuarter}
                  onChange={(e) => setNewQuarter(e.target.value)}
                  data-testid="input-new-quarter"
                  className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
                />
                <datalist id="forecast-quarter-options">
                  {quarterOptions.map((q) => (
                    <option key={q} value={q} />
                  ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="new-draft-part"
                  className="block text-xs font-semibold text-ink-2"
                >
                  Phần thi (Part)
                </label>
                <select
                  id="new-draft-part"
                  value={newPart}
                  onChange={(e) => setNewPart(Number(e.target.value))}
                  data-testid="select-new-part"
                  className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
                >
                  <option value={1}>Part 1</option>
                  <option value={2}>Part 2</option>
                  <option value={3}>Part 3</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="new-draft-source"
                className="block text-xs font-semibold text-ink-2"
              >
                Nguồn đề (Source)
              </label>
              <select
                id="new-draft-source"
                value={newSourceType}
                onChange={(e) =>
                  setNewSourceType(e.target.value as "manual" | "student" | "web")
                }
                data-testid="select-new-source"
                className="mt-1 rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              >
                <option value="manual">Tự soạn (Manual)</option>
                <option value="student">Học viên báo (Student)</option>
                <option value="web">Thu thập từ Web (Web)</option>
              </select>
            </div>

            {newSourceType === "web" && (
              <div>
                <label className="block text-xs font-semibold text-ink-2">
                  Đường dẫn nguồn web (sourceUrl) *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/ielts-speaking-forecast"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-ink-3">
                  Bắt buộc có URL để đối chiếu nguồn. Câu hỏi phải được viết lại.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Ghi chú nguồn / Nội dung thô
              </label>
              <input
                type="text"
                placeholder="VD: Nhóm ôn thi BC ngày 10/1"
                value={newSourceContent}
                onChange={(e) => setNewSourceContent(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Câu hỏi (mỗi câu 1 dòng)
              </label>
              <textarea
                rows={4}
                placeholder="Who is this person?&#10;What do they do?&#10;Why do you think they are energetic?"
                value={newQuestionsText}
                onChange={(e) => setNewQuestionsText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreating(false)}
              >
                Hủy
              </Button>
              <Button size="sm" onClick={() => void handleCreateDraft()}>
                Tạo bản nháp
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
