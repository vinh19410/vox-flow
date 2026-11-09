import {
  Calendar,
  Camera,
  Check,
  CreditCard,
  ExternalLink,
  Flame,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { useApp } from "@/features/app-state/types";
import { useSignOut } from "@/hooks/use-sign-out";
import { PageHead } from "@/layouts/page-head";
import { authClient } from "@/lib/auth-client";
import { cx } from "@/lib/cx";
import { trpcClient } from "@/utils/trpc";

import { AvatarModal } from "./components/avatar-modal";

const VALID_BANDS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0] as const;

export function ProfileScreen() {
  const { s, set, go, toast } = useApp();
  const signOut = useSignOut();
  const { data: session } = authClient.useSession();

  // Tên và Avatar
  const initialName = session?.user?.name || s.name || "Học viên Vox Flow";
  const initialAvatar = session?.user?.image || "";
  const email = session?.user?.email || s.email;

  const [name, setName] = useState<string>(initialName);
  const [avatar, setAvatar] = useState<string>(initialAvatar);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identitySaved, setIdentitySaved] = useState(false);

  // Cập nhật khi session load xong
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
    if (session?.user?.image) {
      setAvatar(session.user.image);
    }
  }, [session?.user?.name, session?.user?.image]);

  // Mục tiêu IELTS
  const [targetBand, setTargetBand] = useState<number>(s.target || 7.0);
  const [examDate, setExamDate] = useState<string>(s.examDate || "");
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  useEffect(() => {
    if (s.target) setTargetBand(s.target);
    if (s.examDate) setExamDate(s.examDate);
  }, [s.target, s.examDate]);

  // Lưu thông tin định danh (Tên và Avatar)
  const handleSaveIdentity = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast("Tên hiển thị không được để trống");
      return;
    }

    setIsSavingIdentity(true);
    try {
      if (typeof authClient?.updateUser === "function") {
        await authClient.updateUser({
          name: trimmed,
          image: avatar || undefined,
        });
      }
      set({ name: trimmed });
      setIdentitySaved(true);
      toast("Đã cập nhật thông tin cá nhân thành công!");
      setTimeout(() => setIdentitySaved(false), 2500);
    } catch {
      toast("Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.");
    } finally {
      setIsSavingIdentity(false);
    }
  };

  // Chọn avatar mới từ modal
  const handleSelectAvatar = async (newAvatarUrl: string) => {
    setAvatar(newAvatarUrl);
    // Tự động lưu avatar mới
    try {
      if (typeof authClient?.updateUser === "function") {
        await authClient.updateUser({
          name: name.trim(),
          image: newAvatarUrl,
        });
      }
      toast("Đã cập nhật ảnh đại diện mới!");
    } catch {
      // Non-blocking, người dùng vẫn có thể bấm nút Lưu chung
    }
  };

  // Lưu mục tiêu luyện thi IELTS
  const handleSaveGoal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setGoalError(null);

    const dateToSend = examDate.trim() ? examDate.trim() : null;

    if (dateToSend) {
      const now = new Date();
      const todayUtc = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
      if (dateToSend < todayUtc) {
        setGoalError("Ngày thi dự kiến không thể ở trong quá khứ.");
        return;
      }
    }

    setIsSavingGoal(true);
    try {
      if (trpcClient?.profile?.upsert?.mutate) {
        await trpcClient.profile.upsert.mutate({
          targetBand,
          examDate: dateToSend,
        });
      }
      set({ target: targetBand, examDate: dateToSend });
      setGoalSaved(true);
      toast("Đã cập nhật mục tiêu luyện thi IELTS!");
      setTimeout(() => setGoalSaved(false), 2500);
    } catch {
      setGoalError("Không thể lưu mục tiêu. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="TÀI KHOẢN HỌC VIÊN"
        title="Hồ sơ cá nhân"
        sub="Quản lý thông tin định danh, mục tiêu luyện thi IELTS và gói dịch vụ của bạn."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái: Thông tin định danh & Mục tiêu IELTS (7 cột) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card 1: Thông tin định danh */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Thông tin cá nhân</h2>
                <p className="text-xs text-subtle">
                  Tên hiển thị và ảnh đại diện xuất hiện trên bài thi & bảng điểm
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {/* Avatar circle with change button */}
              <div className="group relative">
                <div className="grid h-24 w-24 overflow-hidden rounded-full border-4 border-paper bg-brand-soft text-2xl font-bold text-brand shadow-sm ring-2 ring-brand/20">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  aria-label="Đổi ảnh đại diện"
                  className="absolute right-0 bottom-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-ink text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                >
                  <Camera size={14} />
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <label htmlFor="user-display-name" className="text-xs font-semibold text-ink-2">
                    Tên hiển thị
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="user-display-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={50}
                      className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium focus:border-brand focus:outline-none"
                      placeholder="Nhập tên hiển thị..."
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveIdentity}
                      disabled={isSavingIdentity || name.trim() === ""}
                    >
                      {isSavingIdentity ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : identitySaved ? (
                        <>
                          <Check size={14} /> Đã lưu
                        </>
                      ) : (
                        "Lưu tên"
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="user-account-email" className="text-xs font-semibold text-ink-2">
                    Email tài khoản
                  </label>
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-sm text-subtle">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={16} className="text-subtle" />
                      <span id="user-account-email" className="truncate">{email || "Chưa thiết lập"}</span>
                    </div>
                    <Badge tone="good" className="shrink-0 text-[11px]">
                      Đã xác thực
                    </Badge>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="gap-2"
                  >
                    <Sparkles size={14} className="text-brand" />
                    <span>Mở bộ chọn ảnh đại diện</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Mục tiêu luyện thi IELTS */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Target size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Mục tiêu luyện thi IELTS</h2>
                <p className="text-xs text-subtle">
                  Hệ thống dùng band mục tiêu để đo lường độ lệch và gợi ý bài tập trọng tâm
                </p>
              </div>
            </div>

            {goalError && (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                {goalError}
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink-2">
                    Band điểm mục tiêu
                  </label>
                  <span className="tnum text-xs font-bold text-brand">
                    Mục tiêu hiện tại: {targetBand.toFixed(1)} Overall
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
                  {VALID_BANDS.map((b) => {
                    const isSelected = targetBand === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setTargetBand(b)}
                        className={cx(
                          "tnum h-11 rounded-xl border text-sm font-bold transition-all",
                          isSelected
                            ? "border-ink bg-ink text-paper shadow-xs"
                            : "border-line bg-white hover:border-ink/40 text-ink",
                        )}
                      >
                        {b.toFixed(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="user-exam-date" className="text-xs font-semibold text-ink-2">
                  Ngày thi dự kiến (tuỳ chọn)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Calendar
                      size={16}
                      className="absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
                    />
                    <input
                      id="user-exam-date"
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white py-2.5 pr-3 pl-10 text-sm font-medium focus:border-brand focus:outline-none"
                    />
                  </div>
                  {examDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExamDate("")}
                      className="text-xs"
                    >
                      Xóa ngày
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <p className="text-xs text-subtle">
                  Cập nhật lộ trình bất kỳ lúc nào để thuật toán AI bám sát tiến độ
                </p>
                <Button
                  size="sm"
                  onClick={handleSaveGoal}
                  disabled={isSavingGoal}
                >
                  {isSavingGoal ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : goalSaved ? (
                    <>
                      <Check size={14} /> Đã lưu mục tiêu
                    </>
                  ) : (
                    "Lưu mục tiêu"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Cột phải: Gói dịch vụ & Tài khoản (5 cột) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card 3: Gói học viên */}
          <Card className="flex flex-col p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-good/15 text-good">
                <CreditCard size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-subtle uppercase tracking-wider">
                  GÓI HIỆN TẠI
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <h3 className="truncate text-xl font-bold">
                    {s.plan ? s.plan.name : "Gói Miễn phí"}
                  </h3>
                  <Badge tone={s.plan ? "good" : "neutral"} className="shrink-0">
                    {s.plan ? "Đang hoạt động" : "Cơ bản"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-paper/50 p-4">
              <div className="text-xs text-subtle">Quyền lợi tài khoản:</div>
              <p className="mt-1 text-sm font-medium text-ink">
                {s.plan
                  ? `Mở chi tiết 4 tiêu chí không giới hạn đến ngày ${s.plan.until}.`
                  : "Mở band tổng và xem chi tiết bằng chứng của 1 câu yếu nhất."}
              </p>
              {!s.plan && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-brand">
                  <Flame size={14} />
                  <span>Nâng cấp để xem trọn vẹn điểm mạnh/yếu 4 tiêu chí.</span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <Button
                className="w-full justify-center gap-2"
                onClick={() => go("billing")}
              >
                <span>Quản lý & Nâng cấp gói</span>
                <ExternalLink size={16} />
              </Button>
            </div>
          </Card>

          {/* Card 4: Phiên đăng nhập & Bảo mật */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Tài khoản & Phiên</h3>
                <p className="text-xs text-subtle">
                  Thông tin phiên làm việc và bảo mật
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-paper/30">
              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <span className="text-subtle">Trạng thái</span>
                <span className="font-semibold text-good">● Đang đăng nhập</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <span className="text-subtle">ID Người dùng</span>
                <span className="font-mono text-[11px] text-ink">
                  {session?.user?.id ? `${session.user.id.slice(0, 12)}...` : "Khách"}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-4">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 text-warning hover:border-warning/30 hover:bg-warning/10"
                onClick={() => void signOut()}
              >
                <LogOut size={16} />
                <span>Đăng xuất tài khoản</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <AvatarModal
        open={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatar}
        onSelect={handleSelectAvatar}
      />
    </>
  );
}
