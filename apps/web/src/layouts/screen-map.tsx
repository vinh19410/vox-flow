import { useRouterState } from "@tanstack/react-router";
import { Map as MapIcon } from "lucide-react";
import { useState } from "react";

import { useApp } from "@/features/app-state/types";
import { cx } from "@/lib/cx";
import type { ProtoScreen } from "@/features/app-state/types";

export interface ScreenMapEntry {
  id: ProtoScreen;
  code: string;
  label: string;
}

export const SCREEN_MAP: ScreenMapEntry[] = [
  { id: "landing", code: "S01", label: "Landing" },
  { id: "auth", code: "S02", label: "Đăng ký / Đăng nhập" },
  { id: "onboarding", code: "S03–05", label: "Onboarding (Mục tiêu · Mic check)" },
  { id: "dashboard", code: "S06", label: "Trang chủ" },
  { id: "select", code: "S07", label: "Chọn bài thi" },
  { id: "forecast", code: "S07b", label: "Luyện đề forecast" },
  { id: "exam", code: "S08–10", label: "Phòng thi · Cảnh báo nộp" },
  { id: "scoring", code: "S11", label: "Đang chấm" },
  { id: "results", code: "S12–15", label: "Kết quả · Bằng chứng · Paywall" },
  { id: "history", code: "S19", label: "Lịch sử bài làm" },
  { id: "billing", code: "S22–24", label: "Bảng giá · Thanh toán · Tài khoản" },
  { id: "terms", code: "S25", label: "Điều khoản sử dụng" },
];

export function ScreenMap() {
  const { s, go } = useApp();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const [open, setOpen] = useState(false);

  function screenPath(id: ProtoScreen): string {
    return ROUTES_BY_SCREEN[id] ?? "/";
  }

  const activeScreen: ProtoScreen | null =
    SCREEN_MAP.find(
      (entry) =>
        screenPath(entry.id) === pathname ||
        (entry.id === "results" && pathname.startsWith("/app/history/")),
    )?.id ?? null;

  return (
    <div className="fixed right-4 bottom-24 z-40 lg:bottom-6">
      {open && (
        <div className="mb-3 w-72 animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="border-b border-line px-4 py-3 text-xs font-semibold tracking-wider text-subtle uppercase">
            Sơ đồ màn hình prototype
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-1.5">
            {SCREEN_MAP.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  go(m.id);
                  setOpen(false);
                }}
                className={cx(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] hover:bg-paper",
                  activeScreen === m.id && "bg-paper font-semibold",
                )}
              >
                <span className="w-14 shrink-0 font-mono text-[11px] text-brand">
                  {m.code}
                </span>
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-auto flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-semibold shadow-lg hover:border-ink/30"
      >
        <MapIcon size={16} /> Màn hình
      </button>
    </div>
  );
}

const ROUTES_BY_SCREEN: Record<ProtoScreen, string> = {
  landing: "/",
  auth: "/auth",
  onboarding: "/onboarding",
  dashboard: "/app/dashboard",
  select: "/app/select",
  forecast: "/app/forecast",
  exam: "/exam",
  scoring: "/scoring",
  results: "/app/history/latest",
  history: "/app/history",
  billing: "/app/billing",
  terms: "/terms",
};
