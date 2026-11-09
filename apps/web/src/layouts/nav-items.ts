import type { LucideIcon } from "lucide-react";
import {
  ChartLine,
  CreditCard,
  Flame,
  LayoutDashboard,
  Mic,
} from "lucide-react";

export type NavId =
  | "dashboard"
  | "select"
  | "forecast"
  | "history"
  | "billing";

export interface NavItem {
  id: NavId;
  label: string;
  short: string;
  icon: LucideIcon;
  to: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Trang chủ",
    short: "Trang chủ",
    icon: LayoutDashboard,
    to: "/app/dashboard",
  },
  {
    id: "select",
    label: "Thi thử",
    short: "Thi thử",
    icon: Mic,
    to: "/app/select",
  },
  {
    id: "forecast",
    label: "Đề forecast",
    short: "Forecast",
    icon: Flame,
    to: "/app/forecast",
  },
  {
    id: "history",
    label: "Lịch sử",
    short: "Lịch sử",
    icon: ChartLine,
    to: "/app/history",
  },
  {
    id: "billing",
    label: "Gói & thanh toán",
    short: "Gói",
    icon: CreditCard,
    to: "/app/billing",
  },
];

export function resolveActiveNav(pathname: string): NavId | null {
  for (const item of NAV_ITEMS) {
    if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
      return item.id;
    }
  }
  return null;
}
