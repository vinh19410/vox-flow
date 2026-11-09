import { Check, Image as ImageIcon, Link as LinkIcon, Loader2, Sparkles, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ds/button";
import { Modal } from "@/components/ds/modal";
import { cx } from "@/lib/cx";

import { PRESET_AVATARS } from "../data/preset-avatars";
import { compressImageFile } from "../utils/image-compress";

export interface AvatarModalProps {
  open: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  onSelect: (avatarUrl: string) => void;
}

type TabKey = "presets" | "upload" | "url";

export function AvatarModal({
  open,
  onClose,
  currentAvatar,
  onSelect,
}: AvatarModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("presets");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || PRESET_AVATARS[0].url);
  const [customUrl, setCustomUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);
    try {
      const dataUrl = await compressImageFile(file);
      setSelectedAvatar(dataUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể xử lý ảnh này.";
      setError(message);
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const handleApplyUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      setError("Vui lòng nhập đường dẫn URL ảnh hợp lệ.");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:image/")) {
      setError("URL phải bắt đầu bằng https:// hoặc http://.");
      return;
    }
    setError(null);
    setSelectedAvatar(trimmed);
  };

  const handleConfirm = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Chọn ảnh đại diện</h2>
            <p className="text-xs text-subtle">
              Tùy biến hình ảnh đại diện cá nhân hóa trên Vox Flow
            </p>
          </div>
        </div>

        {/* Live Preview Circle */}
        <div className="my-6 flex items-center justify-center">
          <div className="relative">
            <div className="grid h-24 w-24 overflow-hidden rounded-full border-4 border-paper bg-brand-soft shadow-md ring-2 ring-brand/30">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt="Ảnh đại diện xem trước"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-subtle">
                  <ImageIcon size={32} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-paper p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("presets");
              setError(null);
            }}
            className={cx(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
              activeTab === "presets"
                ? "bg-white text-ink shadow-sm"
                : "text-subtle hover:text-ink",
            )}
          >
            <Sparkles size={14} />
            <span>Mẫu có sẵn</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              setError(null);
            }}
            className={cx(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
              activeTab === "upload"
                ? "bg-white text-ink shadow-sm"
                : "text-subtle hover:text-ink",
            )}
          >
            <Upload size={14} />
            <span>Tải ảnh lên</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("url");
              setError(null);
            }}
            className={cx(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
              activeTab === "url"
                ? "bg-white text-ink shadow-sm"
                : "text-subtle hover:text-ink",
            )}
          >
            <LinkIcon size={14} />
            <span>Link URL</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            {error}
          </div>
        )}

        {/* Tab content 1: Presets */}
        {activeTab === "presets" && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {PRESET_AVATARS.map((p) => {
              const isSelected = selectedAvatar === p.url;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedAvatar(p.url)}
                  className={cx(
                    "group relative flex flex-col items-center rounded-2xl border p-2 transition-all hover:scale-105",
                    isSelected
                      ? "border-brand bg-brand-soft/40 shadow-sm"
                      : "border-line bg-white hover:border-ink/20",
                  )}
                  title={`${p.name}: ${p.description}`}
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="h-12 w-12 rounded-full object-cover shadow-xs"
                  />
                  <span className="mt-1.5 truncate text-[11px] font-medium text-ink">
                    {p.name.split(" ")[0]}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-white shadow-xs">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab content 2: Upload */}
        {activeTab === "upload" && (
          <div className="rounded-2xl border-2 border-dashed border-line bg-paper/50 p-6 text-center">
            <input
              type="file"
              id="avatar-file-input"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <label
              htmlFor="avatar-file-input"
              className={cx(
                "inline-flex cursor-pointer flex-col items-center justify-center",
                isProcessing && "pointer-events-none opacity-60",
              )}
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
                {isProcessing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Upload size={24} />
                )}
              </div>
              <span className="mt-3 text-sm font-semibold text-ink">
                {isProcessing ? "Đang xử lý ảnh..." : "Bấm vào đây để chọn ảnh từ máy"}
              </span>
              <span className="mt-1 text-xs text-subtle">
                Hỗ trợ PNG, JPG, WebP tối đa 5MB (tự động nén & căn vuông)
              </span>
            </label>
          </div>
        )}

        {/* Tab content 3: URL */}
        {activeTab === "url" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
              />
              <Button size="sm" variant="outline" onClick={handleApplyUrl}>
                Xem thử
              </Button>
            </div>
            <p className="text-[11px] text-subtle">
              Dán đường dẫn ảnh công khai từ internet (URL kết thúc bằng .png, .jpg, .webp).
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={isProcessing}>
            Xác nhận đổi ảnh
          </Button>
        </div>
      </div>
    </Modal>
  );
}
