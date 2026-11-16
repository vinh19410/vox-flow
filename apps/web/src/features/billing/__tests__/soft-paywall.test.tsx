import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const billingStatusSpy = vi.fn();
const unlockDetailSpy = vi.fn();
const invalidateQueriesSpy = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpc: {
    billing: {
      status: {
        queryOptions: () => ({
          queryKey: ["billing", "status"],
          queryFn: () => billingStatusSpy(),
        }),
        queryKey: () => ["billing", "status"],
      },
      listOrders: {
        queryKey: () => ["billing", "listOrders"],
      },
    },
  },
  queryClient: {
    invalidateQueries: (...args: unknown[]) => invalidateQueriesSpy(...args),
  },
  trpcClient: {
    billing: {
      unlockDetail: { mutate: (...args: unknown[]) => unlockDetailSpy(...args) },
    },
  },
}));

import { createInitialState } from "@/features/app-state/initial-state";
import { AppCtx, type AppCtxValue } from "@/features/app-state/types";
import { SoftPaywall } from "@/features/results/components/soft-paywall";

describe("SoftPaywall with detailCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 1-click unlock button when detailCredits > 0 and calls billing.unlockDetail", async () => {
    billingStatusSpy.mockResolvedValue({ subscription: null, detailCredits: 2 });
    unlockDetailSpy.mockResolvedValue({ unlocked: true, alreadyUnlocked: false, remaining: 1 });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const toast = vi.fn();
    const openPaywall = vi.fn();
    const ctxVal = {
      s: createInitialState(),
      set: vi.fn(),
      go: vi.fn(),
      goResult: vi.fn(),
      paywallOpen: false,
      openPaywall,
      closePaywall: vi.fn(),
      toastMsg: null,
      toast,
      lastUnpersistedAttempt: null,
      setLastUnpersistedAttempt: vi.fn(),
      pendingSubmission: false,
      setPendingSubmission: vi.fn(),
    } as AppCtxValue;

    render(
      <QueryClientProvider client={client}>
        <AppCtx.Provider value={ctxVal}>
          <SoftPaywall inline attemptId="att-locked-1" />
        </AppCtx.Provider>
      </QueryClientProvider>,
    );

    const unlockBtn = await screen.findByRole("button", {
      name: /Dùng 1 lượt để mở bài này \(còn 2 lượt\)/,
    });
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(unlockDetailSpy).toHaveBeenCalledWith({ attemptId: "att-locked-1" });
    });
    expect(invalidateQueriesSpy).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("Đã mở khóa chi tiết bài thi (còn 1 lượt).");
  });
});
