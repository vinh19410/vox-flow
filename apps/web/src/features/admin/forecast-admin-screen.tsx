import {
  Archive,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { Modal } from "@/components/ds/modal";
import { PageHead } from "@/layouts/page-head";
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
  accessDeniedForTest?: boolean;
}

export function ForecastAdminScreen({
  initialTopics,
  accessDeniedForTest = false,
}: ForecastAdminScreenProps) {
  const [topics, setTopics] = useState<AdminForecastTopic[]>(initialTopics ?? []);
  const [quarter, setQuarter] = useState("2026-Q1");
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(accessDeniedForTest);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit State
  const [editingTopic, setEditingTopic] = useState<AdminForecastTopic | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editQuestionsText, setEditQuestionsText] = useState("");

  // Create State
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPart, setNewPart] = useState(1);
  const [newQuestionsText, setNewQuestionsText] = useState("");
  const [newSourceType, setNewSourceType] = useState<"manual" | "student" | "web">("manual");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceContent, setNewSourceContent] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setActionError(null);
      if (trpcClient?.forecastAdmin?.listDrafts?.query) {
        const data = await trpcClient.forecastAdmin.listDrafts.query({
          quarter,
        });
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
      void loadTopics();
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
    if (!editingTopic) return;
    const questions = editQuestionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    try {
      setActionError(null);
      if (trpcClient?.forecastAdmin?.updateDraft?.mutate) {
        await trpcClient.forecastAdmin.updateDraft.mutate({
          id: editingTopic.id,
          title: editTitle,
          questions,
        });
      }
      setTopics((prev) =>
        prev.map((t) =>
          t.id === editingTopic.id
            ? { ...t, title: editTitle, questions }
            : t,
        ),
      );
      setEditingTopic(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Lưu thay đổi thất bại";
      setActionError(errMsg);
    }
  };

  const handleCreateDraft = async () => {
    setCreateError(null);
    if (!newTitle.trim()) {
      setCreateError("Vui lòng nhập tiêu đề cho chủ đề.");
      return;
    }

    if (newSourceType === "web" && (!newSourceUrl.trim() || !/^https?:\/\//i.test(newSourceUrl.trim()))) {
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
          quarter,
          part: newPart,
          questions,
          sources,
        });
        setTopics((prev) => [
          {
            ...created,
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
          quarter,
          part: newPart,
          questions,
          status: "draft",
          realReportCount: 0,
          sources: sources.map((s, idx) => ({ id: `s_${idx}`, ...s })),
        };
        setTopics((prev) => [localCreated, ...prev]);
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

  const filteredTopics = topics.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  return (
    <>
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-2">Quý:</span>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="rounded-lg border border-border bg-paper px-3 py-1.5 text-sm font-semibold text-ink shadow-sm focus:outline-none"
            >
              <option value="2026-Q1">2026 - Quý 1</option>
              <option value="2026-Q2">2026 - Quý 2</option>
              <option value="2026-Q3">2026 - Quý 3</option>
              <option value="2026-Q4">2026 - Quý 4</option>
            </select>

            <div className="ml-4 flex items-center rounded-lg border border-border bg-paper p-1">
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
              onClick={() => void loadTopics()}
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
          onClose={() => setEditingTopic(null)}
        >
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-ink">Chỉnh sửa đề thi nháp</h3>
            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Tiêu đề chủ đề
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
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
                className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTopic(null)}
              >
                Hủy
              </Button>
              <Button size="sm" onClick={() => void handleSaveEdit()}>
                Lưu thay đổi
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
          <div className="p-6 space-y-4">
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

            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Phần thi (Part)
              </label>
              <select
                value={newPart}
                onChange={(e) => setNewPart(Number(e.target.value))}
                className="mt-1 rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none"
              >
                <option value={1}>Part 1</option>
                <option value={2}>Part 2</option>
                <option value={3}>Part 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-2">
                Nguồn đề (Source)
              </label>
              <select
                value={newSourceType}
                onChange={(e) =>
                  setNewSourceType(e.target.value as "manual" | "student" | "web")
                }
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
    </>
  );
}
