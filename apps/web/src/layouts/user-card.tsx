import { LogOut } from "lucide-react";

import { useApp } from "@/features/app-state/types";
import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";

export function UserCard() {
  const { s, go } = useApp();
  const signOut = useSignOut();
  const { data: session } = authClient.useSession();
  // Session user wins over the prototype state seed ("Minh Anh") so real
  // accounts see their own name; seed only covers the not-yet-loaded window.
  const displayName = session?.user?.name || s.name;
  const avatarUrl = session?.user?.image;

  return (
    <div className="mt-auto rounded-2xl border border-line bg-white p-4 transition-colors hover:border-ink/20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => go("profile")}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus:outline-none"
          aria-label="Xem hồ sơ cá nhân"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-sm font-bold text-brand">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold hover:text-brand">{displayName}</div>
            <div className="truncate text-xs text-subtle">
              {s.plan ? `Gói ${s.plan.name}` : "Miễn phí"}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-subtle hover:text-ink cursor-pointer"
          aria-label="Đăng xuất"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
