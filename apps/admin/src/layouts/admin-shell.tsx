import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "@vox-flow/ui/ds/logo";
import {
  BookOpen,
  CreditCard,
  LogOut,
  MessageSquareWarning,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export type AdminNavId = "users" | "forecast" | "payments" | "disputes";

export interface AdminNavItem {
  id: AdminNavId;
  to: "/users" | "/forecast" | "/payments" | "/disputes";
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "users", to: "/users", label: "Người dùng", shortLabel: "Users", icon: Users },
  { id: "forecast", to: "/forecast", label: "Đề Forecast", shortLabel: "Forecast", icon: BookOpen },
  { id: "payments", to: "/payments", label: "Thanh toán", shortLabel: "Thanh toán", icon: CreditCard },
  {
    id: "disputes",
    to: "/disputes",
    label: "Khiếu nại",
    shortLabel: "Khiếu nại",
    icon: MessageSquareWarning,
  },
];

export function resolveAdminActiveNav(pathname: string): AdminNavId | null {
  const matched = ADMIN_NAV_ITEMS.find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  return matched?.id ?? null;
}

export interface AdminShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AdminShellProps {
  children: ReactNode;
  adminUser?: AdminShellUser | null;
}

export function AdminShell({ children, adminUser }: AdminShellProps) {
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const navigate = useNavigate();
  const activeNav = resolveAdminActiveNav(pathname);
  const sessionResult = authClient.useSession?.();
  const [signingOut, setSigningOut] = useState(false);

  const user = adminUser ?? sessionResult?.data?.user ?? null;
  const displayName =
    user?.name?.trim() || (user?.email ? user.email.split("@")[0] : "") || "Quản trị viên";
  const email = user?.email ?? "";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const res = await authClient.signOut();
      if (res && typeof res === "object" && "error" in res && res.error) {
        toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
        return;
      }
      await navigate({ to: "/login" });
    } catch {
      toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-paper px-4 py-6 lg:flex">
        <div className="flex items-center justify-between px-2">
          <Logo />
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand uppercase">
            Admin
          </span>
        </div>

        <nav aria-label="Điều hướng quản trị" className="mt-10 flex flex-col gap-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={
                  isActive
                    ? "flex h-11 items-center gap-3 rounded-2xl bg-ink px-3 text-sm font-medium text-paper transition-colors"
                    : "flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-ink/5"
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-sm font-bold text-brand">
              {user?.image ? (
                <img src={user.image} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{displayName}</div>
              {email && <div className="truncate text-xs text-subtle">{email}</div>}
            </div>
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-paper text-xs font-semibold text-ink-2 transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-50"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand uppercase">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="max-w-[160px] truncate text-xs font-semibold text-ink">
              {displayName}
            </div>
            {email && <div className="max-w-[160px] truncate text-[11px] text-subtle">{email}</div>}
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            aria-label="Đăng xuất"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink-2 hover:border-ink/40 hover:text-ink disabled:opacity-50"
          >
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Điều hướng di động"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <Link
              key={item.id}
              to={item.to}
              className={
                isActive
                  ? "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-brand"
                  : "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-subtle"
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-5 pt-6 pb-28 sm:px-8 lg:pt-10 lg:pb-16">
        {children}
      </main>
    </div>
  );
}
