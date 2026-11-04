import { useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { screenToRoute, resolveRouteTarget } from "./routes";
import { useAppStateStore } from "./store";
import { ProtoToast } from "./toast";
import { AppCtx } from "./types";
import type { AppCtxValue, NavOptions, ProtoScreen } from "./types";

export function AppStateProvider({ children }: { children: ReactNode }) {
  const store = useAppStateStore();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (l) => l.pathname });

  useEffect(() => {
    if (store.paywallOpen) {
      store.closePaywall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const go = (sc: ProtoScreen, opts?: NavOptions) => {
    void navigate(resolveRouteTarget(screenToRoute(sc), opts));
  };

  const goResult = (attemptId: string, opts?: NavOptions) => {
    void navigate(
      resolveRouteTarget(screenToRoute("results", attemptId), opts),
    );
  };

  const value: AppCtxValue = {
    ...store,
    go,
    goResult,
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      <ProtoToast message={store.toastMsg} />
    </AppCtx.Provider>
  );
}
