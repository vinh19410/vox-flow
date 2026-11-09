import { useRouterState } from "@tanstack/react-router";

import { useApp } from "@/features/app-state/types";

import { Logo } from "@/components/ds/logo";

import { NAV_ITEMS, resolveActiveNav } from "./nav-items";

export function BottomNav() {
  const { s, go } = useApp();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const active = resolveActiveNav(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {s.name.charAt(0).toUpperCase()}
        </div>
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
