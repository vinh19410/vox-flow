import { QueryClient, QueryClientContext, useQuery } from "@tanstack/react-query";
import type { QuotaStatus } from "@vox-flow/api/quota/quota";
import { useContext } from "react";

import type { Mode } from "@/features/exam/types";
import type { ForecastKind } from "@/features/forecast/types";
import * as trpcMod from "@/utils/trpc";

export const QUOTA_EXCEEDED = "QUOTA_EXCEEDED" as const;
export const GLOBAL_CAP_REACHED = "GLOBAL_CAP_REACHED" as const;

export type QuotaErrorCode = typeof QUOTA_EXCEEDED | typeof GLOBAL_CAP_REACHED;

export const GLOBAL_CAP_NEUTRAL_MESSAGE =
  "Hạn mức miễn phí toàn hệ thống hôm nay đã tạm đầy. Đặt lại lúc 00:00 (giờ Việt Nam).";

export const QUOTA_EXCEEDED_MESSAGE =
  "Bạn đã dùng hết 3/3 điểm miễn phí hôm nay. Đặt lại lúc 00:00 (giờ Việt Nam).";

export const QUOTA_SUBMIT_CAP_MESSAGE =
  "Hạn mức miễn phí hôm nay đã chạm trần khi nộp bài. Bản ghi âm của bạn vẫn được giữ nguyên — vui lòng nộp lại sau 00:00 (giờ Việt Nam) hoặc nâng cấp gói trả phí.";

const DETACHED_QUERY_CLIENT = new QueryClient();

export interface QuotaState {
  isLoaded: boolean;
  isLoading: boolean;
  status: QuotaStatus | null;
  refetch: () => void;
}

export interface QuotaCheckResult {
  allowed: boolean;
  cost: number;
  reason: QuotaErrorCode | null;
}

export function modePointCost(mode: Mode): number {
  return mode === "full" ? 3 : 1;
}

export function forecastPointCost(kind: ForecastKind, singleQuestion = false): number {
  if (singleQuestion) return 1;
  return kind === "p1" ? 1 : 2;
}

function isQuotaStatusPayload(value: unknown): value is QuotaStatus {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<QuotaStatus>;
  return (
    typeof candidate.remainingPoints === "number" &&
    typeof candidate.dailyLimit === "number" &&
    typeof candidate.entitlement === "string" &&
    typeof candidate.globalCapReached === "boolean"
  );
}

type OptionalTrpcModule = {
  trpc?: {
    quota?: {
      status?: {
        queryOptions?: () => Record<string, unknown> & { queryKey?: readonly unknown[] };
        queryKey?: () => readonly unknown[];
      };
    };
  };
  queryClient?: {
    invalidateQueries?: (filters: { queryKey: readonly unknown[] }) => Promise<void> | void;
  };
};

function readOptionalTrpcModule(): OptionalTrpcModule {
  const mod = trpcMod as unknown as OptionalTrpcModule;
  const resolved: OptionalTrpcModule = {};
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

export function invalidateQuotaStatus(): void {
  const mod = readOptionalTrpcModule();
  const statusProxy = mod.trpc?.quota?.status;
  const key = statusProxy?.queryKey?.() ?? statusProxy?.queryOptions?.()?.queryKey;
  if (key && mod.queryClient?.invalidateQueries) {
    void Promise.resolve(mod.queryClient.invalidateQueries({ queryKey: key })).catch(() => {});
  }
}

export function useQuotaStatus(): QuotaState {
  const ctxClient = useContext(QueryClientContext);
  const mod = readOptionalTrpcModule();
  const rawOptions = mod.trpc?.quota?.status?.queryOptions?.();
  const hasProviderAndOptions = Boolean(ctxClient && rawOptions);

  const queryOptions = hasProviderAndOptions
    ? {
        ...rawOptions,
        enabled: true,
        staleTime: 15_000,
      }
    : {
        queryKey: ["quota", "status", "disabled"] as const,
        queryFn: async () => null as QuotaStatus | null,
        enabled: false,
      };

  const result = useQuery(queryOptions as never, ctxClient ?? DETACHED_QUERY_CLIENT);

  if (!hasProviderAndOptions && !isQuotaStatusPayload(result.data)) {
    return {
      isLoaded: false,
      isLoading: false,
      status: null,
      refetch: () => {},
    };
  }

  const status = isQuotaStatusPayload(result.data) ? result.data : null;
  return {
    isLoaded: status !== null,
    isLoading: Boolean(result.isLoading),
    status,
    refetch: () => {
      void result.refetch?.();
    },
  };
}

export function canStartMode(quota: QuotaState, mode: Mode): QuotaCheckResult {
  const cost = modePointCost(mode);
  if (!quota.isLoaded || !quota.status || quota.status.entitlement === "paid") {
    return { allowed: true, cost, reason: null };
  }
  const { status } = quota;
  if (status.remainingPoints < cost) {
    return { allowed: false, cost, reason: QUOTA_EXCEEDED };
  }
  const globalAffordable =
    !status.globalCapReached &&
    (mode === "full" ? status.globalRemainingCanAfford.full : status.globalRemainingCanAfford.part);
  if (!globalAffordable) {
    return { allowed: false, cost, reason: GLOBAL_CAP_REACHED };
  }
  return { allowed: true, cost, reason: null };
}

export function canStartForecast(
  quota: QuotaState,
  kind: ForecastKind,
  singleQuestion = false,
): QuotaCheckResult {
  const cost = forecastPointCost(kind, singleQuestion);
  if (!quota.isLoaded || !quota.status || quota.status.entitlement === "paid") {
    return { allowed: true, cost, reason: null };
  }
  const { status } = quota;
  if (status.remainingPoints < cost) {
    return { allowed: false, cost, reason: QUOTA_EXCEEDED };
  }
  const canAfford = singleQuestion
    ? status.globalRemainingCanAfford.singleQuestion
    : kind === "p1"
      ? status.globalRemainingCanAfford.forecastP1
      : status.globalRemainingCanAfford.forecastP23;
  if (status.globalCapReached || !canAfford) {
    return { allowed: false, cost, reason: GLOBAL_CAP_REACHED };
  }
  return { allowed: true, cost, reason: null };
}

export function parseQuotaErrorCode(err: unknown): QuotaErrorCode | null {
  if (!(err instanceof Error)) return null;
  if (err.message === QUOTA_EXCEEDED) return QUOTA_EXCEEDED;
  if (err.message === GLOBAL_CAP_REACHED) return GLOBAL_CAP_REACHED;
  return null;
}

export function getQuotaErrorMessage(
  code: QuotaErrorCode,
  context: "start" | "submit" | "retry" | "retake" = "start",
): string {
  if (code === GLOBAL_CAP_REACHED) {
    if (context === "submit") {
      return QUOTA_SUBMIT_CAP_MESSAGE;
    }
    if (context === "retry") {
      return "Hạn mức miễn phí toàn hệ thống hôm nay đã tạm đầy nên chưa thể chấm lại. Điểm miễn phí (nếu còn trong hạn mức hoàn 3 lần/ngày) được hoàn tự động; vui lòng thử lại sau 00:00 (giờ Việt Nam) hoặc nâng cấp gói trả phí.";
    }
    return GLOBAL_CAP_NEUTRAL_MESSAGE;
  }

  switch (context) {
    case "submit":
      return QUOTA_SUBMIT_CAP_MESSAGE;
    case "retry":
      return "Bạn không đủ điểm miễn phí hôm nay để chấm lại bài này. Điểm sẽ đặt lại lúc 00:00 (giờ Việt Nam).";
    case "retake":
      return "Bạn đã dùng hết 3/3 điểm miễn phí hôm nay (lần luyện lại thứ 2 trở đi tính 1 điểm). Đặt lại lúc 00:00 (giờ Việt Nam).";
    case "start":
    default:
      return QUOTA_EXCEEDED_MESSAGE;
  }
}
