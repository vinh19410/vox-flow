import { render } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { vi } from "vitest";

import { createInitialState } from "@/features/app-state/initial-state";
import { ProtoToast } from "@/features/app-state/toast";
import { AppCtx, type AppCtxValue, type AppState } from "@/features/app-state/types";

export function createHarness(
  seed?: Partial<AppState>,
  opts?: { pendingSubmission?: boolean },
) {
  const go = vi.fn();
  const goResult = vi.fn();
  const toast = vi.fn();
  const set = vi.fn();
  const setPendingSubmission = vi.fn();
  const setLastUnpersistedAttempt = vi.fn();
  const openPaywall = vi.fn();
  const closePaywall = vi.fn();

  let latest: AppState | null = null;
  function Probe() {
    return null;
  }

  function Provider({ children }: { children: ReactNode }) {
    const [s, setS] = useState<AppState>(() => ({
      ...createInitialState(),
      ...seed,
    }));
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    latest = s;

    const value: AppCtxValue = {
      s,
      set: (u) => {
        set(u);
        setS((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
      },
      paywallOpen: false,
      openPaywall,
      closePaywall,
      toastMsg,
      toast: (m) => {
        toast(m);
        setToastMsg(m);
      },
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt,
      pendingSubmission: opts?.pendingSubmission ?? false,
      setPendingSubmission,
      go,
      goResult,
    };
    return (
      <AppCtx.Provider value={value}>
        {children}
        <Probe />
        <ProtoToast message={toastMsg} />
      </AppCtx.Provider>
    );
  }

  return {
    Provider,
    go,
    goResult,
    toast,
    set,
    setPendingSubmission,
    setLastUnpersistedAttempt,
    openPaywall,
    closePaywall,
    state: () => {
      if (!latest) throw new Error("Probe has not rendered yet");
      return latest;
    },
  };
}

export function renderWithApp(
  ui: ReactNode,
  seed?: Partial<AppState>,
  opts?: { pendingSubmission?: boolean },
) {
  const harness = createHarness(seed, opts);
  const utils = render(<harness.Provider>{ui}</harness.Provider>);
  return { ...utils, ...harness };
}
