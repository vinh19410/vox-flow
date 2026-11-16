import { QueryClient, QueryClientContext, useQuery } from "@tanstack/react-query";
import { useContext } from "react";

import * as trpcMod from "@/utils/trpc";

export interface BillingSubscriptionInfo {
  planId: "week" | "month" | "exam";
  planName: string;
  pointsRemaining: number;
  planPointsTotal: number;
  expiresAt: number;
}

export interface BillingStatusData {
  subscription: BillingSubscriptionInfo | null;
  detailCredits: number;
}

export interface BillingReceiptItem {
  id: string;
  planId: "pack" | "week" | "month" | "exam";
  planName: string;
  amountVnd: number;
  transferCode: string;
  sepayId: number | null;
  paidAt: number | null;
  createdAt: number;
}

const DETACHED_QUERY_CLIENT = new QueryClient();

type OptionalBillingTrpcModule = {
  trpc?: {
    billing?: {
      status?: {
        queryOptions?: () => Record<string, unknown> & { queryKey?: readonly unknown[] };
        queryKey?: () => readonly unknown[];
      };
      listOrders?: {
        queryOptions?: () => Record<string, unknown> & { queryKey?: readonly unknown[] };
        queryKey?: () => readonly unknown[];
      };
    };
  };
  queryClient?: {
    invalidateQueries?: (filters: { queryKey: readonly unknown[] }) => Promise<void> | void;
  };
};

function readOptionalBillingTrpc(): OptionalBillingTrpcModule {
  const mod = trpcMod as unknown as OptionalBillingTrpcModule;
  const resolved: OptionalBillingTrpcModule = {};
  try {
    resolved.trpc = mod.trpc;
  } catch {
    // Vitest partial mocks of @/utils/trpc throw on accessing unmocked ESM exports.
  }
  try {
    resolved.queryClient = mod.queryClient;
  } catch {
    // Vitest partial mocks of @/utils/trpc throw on accessing unmocked ESM exports.
  }
  return resolved;
}

function isBillingStatusPayload(value: unknown): value is BillingStatusData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<BillingStatusData>;
  return typeof candidate.detailCredits === "number" && "subscription" in candidate;
}

export function invalidateBillingStatus(): void {
  const mod = readOptionalBillingTrpc();
  const statusProxy = mod.trpc?.billing?.status;
  const statusKey = statusProxy?.queryKey?.() ?? statusProxy?.queryOptions?.()?.queryKey;
  if (statusKey && mod.queryClient?.invalidateQueries) {
    void Promise.resolve(mod.queryClient.invalidateQueries({ queryKey: statusKey })).catch(() => {});
  }
  const ordersProxy = mod.trpc?.billing?.listOrders;
  const ordersKey = ordersProxy?.queryKey?.() ?? ordersProxy?.queryOptions?.()?.queryKey;
  if (ordersKey && mod.queryClient?.invalidateQueries) {
    void Promise.resolve(mod.queryClient.invalidateQueries({ queryKey: ordersKey })).catch(() => {});
  }
}

export function useBillingStatus(): {
  isLoaded: boolean;
  isLoading: boolean;
  status: BillingStatusData | null;
  refetch: () => void;
} {
  const ctxClient = useContext(QueryClientContext);
  const mod = readOptionalBillingTrpc();
  const rawOptions = mod.trpc?.billing?.status?.queryOptions?.();
  const hasProviderAndOptions = Boolean(ctxClient && rawOptions);

  const queryOptions = hasProviderAndOptions
    ? {
        ...rawOptions,
        enabled: true,
        staleTime: 15_000,
      }
    : {
        queryKey: ["billing", "status", "disabled"] as const,
        queryFn: async () => null as BillingStatusData | null,
        enabled: false,
      };

  const result = useQuery(queryOptions as never, ctxClient ?? DETACHED_QUERY_CLIENT);

  if (!hasProviderAndOptions && !isBillingStatusPayload(result.data)) {
    return {
      isLoaded: false,
      isLoading: false,
      status: null,
      refetch: () => {},
    };
  }

  const status = isBillingStatusPayload(result.data) ? result.data : null;
  return {
    isLoaded: status !== null,
    isLoading: Boolean(result.isLoading),
    status,
    refetch: () => {
      void result.refetch?.();
    },
  };
}

export function useBillingOrders(enabled = true): {
  isLoaded: boolean;
  isLoading: boolean;
  orders: BillingReceiptItem[];
} {
  const ctxClient = useContext(QueryClientContext);
  const mod = readOptionalBillingTrpc();
  const rawOptions = mod.trpc?.billing?.listOrders?.queryOptions?.();
  const hasProviderAndOptions = Boolean(ctxClient && rawOptions && enabled);

  const queryOptions = hasProviderAndOptions
    ? {
        ...rawOptions,
        enabled: true,
        staleTime: 15_000,
      }
    : {
        queryKey: ["billing", "listOrders", "disabled"] as const,
        queryFn: async () => [] as BillingReceiptItem[],
        enabled: false,
      };

  const result = useQuery(queryOptions as never, ctxClient ?? DETACHED_QUERY_CLIENT);
  const orders = Array.isArray(result.data) ? (result.data as BillingReceiptItem[]) : [];

  return {
    isLoaded: hasProviderAndOptions && !result.isLoading && Array.isArray(result.data),
    isLoading: Boolean(result.isLoading),
    orders,
  };
}
