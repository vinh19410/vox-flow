import { useRouterState } from "@tanstack/react-router";
import { CreditCard, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vox-flow/ui/components/dropdown-menu";

import { useApp } from "@/features/app-state/types";
import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/ds/logo";

import { NAV_ITEMS, resolveActiveNav } from "./nav-items";
export function BottomNav() {
  const { s, go } = useApp();
  const signOut = useSignOut();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const active = resolveActiveNav(pathname);
  const { data: session } = authClient.useSession();
  // Session user wins over the prototype state seed ("Minh Anh") so real
  // accounts see their own name; seed only covers the not-yet-loaded window.
  const displayName = session?.user?.name || s.name;
  const email = session?.user?.email;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-3 backdrop-blur lg:hidden">
        <Logo />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Tài khoản người dùng"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {displayName.charAt(0).toUpperCase()}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 rounded-2xl border border-line bg-paper p-1.5 shadow-lg"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-left">
                <div className="truncate text-sm font-semibold text-ink">{displayName}</div>
                {email && <div className="truncate text-xs text-subtle">{email}</div>}
                <div className="mt-0.5 inline-block text-[11px] font-medium text-brand">
                  {s.plan ? `Gói ${s.plan.name}` : "Gói Miễn phí"}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => go("billing")}
                className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <CreditCard className="text-subtle" />
                <span>Gói & thanh toán</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void signOut()}
                className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <LogOut />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV_ITEMS.map((n) => (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            className={
              active === n.id
                ? "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-brand"
                : "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-subtle"
            }
          >
            <n.icon size={20} strokeWidth={1.8} />
            {n.short}
          </button>
        ))}
      </nav>
    </>
  );
}
