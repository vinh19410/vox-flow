import { ArrowRight, ShieldCheck, Volume2 } from "lucide-react";

import { Button } from "@/components/ds/button";

import { ConsentRows } from "./consent-rows";

export function ConsentStep({ onDone }: { onDone: () => void }) {
  return (
    <>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-paper">
        <ShieldCheck size={22} />
      </div>
      <h1 className="mt-5 text-[30px] leading-tight font-bold tracking-tight">Bạn quyết định dữ liệu của mình</h1>
      <p className="mt-2 text-ink-2">Hai lựa chọn tách riêng. Bạn có thể đổi hoặc xóa toàn bộ dữ liệu bất cứ lúc nào trong mục Quyền riêng tư.</p>
      <div className="mt-8">
        <ConsentRows />
      </div>
      <div className="mt-4 flex items-center gap-2 text-[13px] text-subtle">
        <Volume2 size={14} /> Ghi âm chỉ bắt đầu khi bạn bấm nút micro trong phòng thi.
      </div>
      <div className="mt-10 flex justify-end">
        <Button variant="accent" onClick={onDone}>
          Vào trang chủ <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}
