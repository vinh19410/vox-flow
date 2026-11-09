import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

const SIGN_OUT_ERROR = "Đăng xuất thất bại. Vui lòng thử lại.";

export function useSignOut(redirect: string = "/auth") {
  const navigate = useNavigate();

  return useCallback(async () => {
    // The client resolves `{ data, error }` on HTTP failure and only rejects on
    // network errors — treat both as a failed sign-out and stay on the page.
    let thrown = false;
    const res = await authClient.signOut().catch(() => {
      thrown = true;
      return undefined;
    });
    if (thrown || res?.error) {
      toast.error(SIGN_OUT_ERROR);
      return;
    }
    await navigate({ to: redirect });
  }, [navigate, redirect]);
}
