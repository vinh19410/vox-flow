import { Download, FileText, ShieldCheck, Trash } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { Modal } from "@/components/ds/modal";
import { useApp } from "@/features/app-state/types";
import { PageHead } from "@/layouts/page-head";

import { ConsentRows } from "../onboarding/components/consent-rows";

export function PrivacyScreen() {
  const { s, set, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHead eyebrow="S25" title="Quyền riêng tư" sub="Mỗi quyền là một công tắc riêng. Thay đổi có hiệu lực ngay lập tức." />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <ConsentRows />
          <Card className="p-6">
            <h2 className="font-bold">Dữ liệu đang lưu</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(
                [
                  [s.attempts.length, "bài làm"],
                  [s.attempts.length * 6, "đoạn ghi âm"],
                  ["48 MB", "dung lượng"],
                ] as [number | string, string][]
              ).map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-paper p-4">
                  <div className="tnum text-2xl font-bold">{v}</div>
                  <div className="text-xs text-subtle">{l}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => toast("Đang chuẩn bị file — sẽ gửi qua email")}>
                <Download size={14} /> Xuất toàn bộ dữ liệu
              </Button>
              <Button variant="ghost" size="sm">
                <FileText size={14} /> Chính sách bảo mật
              </Button>
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-6">
            <ShieldCheck className="text-good" />
            <h2 className="mt-4 font-bold">Cam kết của chúng tôi</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              <li>· Không bán hoặc chia sẻ giọng nói cho bên thứ ba.</li>
              <li>· Chỉ dùng để huấn luyện khi bạn bật công tắc.</li>
              <li>· Âm thanh được mã hóa khi lưu trữ.</li>
            </ul>
          </Card>
          <Card className="border-bad/25 p-6">
            <h2 className="font-bold text-bad">Xóa toàn bộ dữ liệu</h2>
            <p className="mt-2 text-sm text-ink-2">Xóa vĩnh viễn ghi âm, transcript và điểm. Tài khoản và gói đang dùng vẫn giữ nguyên.</p>
            <Button className="mt-5 w-full bg-bad hover:bg-bad/90" onClick={() => setConfirm(true)}>
              <Trash size={16} /> Xóa dữ liệu
            </Button>
          </Card>
        </div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} width="max-w-sm">
        <div className="p-7">
          <h2 className="text-xl font-bold">Xóa {s.attempts.length} bài làm?</h2>
          <p className="mt-2 text-sm text-ink-2">Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa khỏi máy chủ trong vòng 24 giờ.</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Hủy
            </Button>
            <Button
              className="bg-bad hover:bg-bad/90"
              onClick={() => {
                set({ attempts: [] });
                setConfirm(false);
                toast("Đã xóa dữ liệu bài làm");
              }}
            >
              Xóa vĩnh viễn
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
