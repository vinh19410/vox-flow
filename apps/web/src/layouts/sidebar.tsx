import { Link, useRouterState } from "@tanstack/react-router";

import { Logo } from "@/components/ds/logo";

import { NAV_ITEMS, resolveActiveNav } from "./nav-items";
import { UserCard } from "./user-card";

export function Sidebar() {
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const active = resolveActiveNav(pathname);

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-paper px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="mt-10 flex flex-col gap-1">
        {NAV_ITEMS.map((n) => (
          <Link
            key={n.id}
            to={n.to}
            className={
              active === n.id
                ? "flex h-11 items-center gap-3 rounded-2xl bg-ink px-3 text-sm font-medium text-paper transition-colors"
                : "flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-ink/5"
            }
          >
            <n.icon size={18} strokeWidth={1.8} />
            {n.label}
          </Link>
        ))}
      </nav>
      <UserCard />
    </aside>
  );
}
