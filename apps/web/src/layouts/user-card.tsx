import { LogOut } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";

export function UserCard() {
  const { s } = useApp();
  const signOut = useSignOut();
  const { data: session } = authClient.useSession();
  // Session user wins over the prototype state seed ("Minh Anh") so real
  // accounts see their own name; seed only covers the not-yet-loaded window.
  const displayName = session?.user?.name || s.name;

  return (
    <div className="mt-auto rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{displayName}</div>
          <div className="truncate text-xs text-subtle">
            {s.plan ? `Gói ${s.plan.name}` : "Miễn phí"}
          </div>
        </div>
        <button
          onClick={() => void signOut()}
          className="text-subtle hover:text-ink"
          aria-label="Đăng xuất"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
