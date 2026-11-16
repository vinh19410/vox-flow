import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

import type { Database } from "@vox-flow/db";

import type { ApiEnv } from "../context";
import { extractTransferCode } from "./plans";
import { ingestSepayTransaction } from "./reconcile";

const sepayPayloadSchema = z.object({
  id: z.number().int(),
  gateway: z.string().default(""),
  transactionDate: z.string().default(""),
  accountNumber: z.string().default(""),
  subAccount: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  code: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  content: z.string().default(""),
  transferType: z.enum(["in", "out"]),
  transferAmount: z.number().int().nonnegative(),
  referenceCode: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
});

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function verifySepayApiKey(authHeader: string | null, expectedApiKey: string | undefined): boolean {
  const key = typeof expectedApiKey === "string" ? expectedApiKey.trim() : "";
  if (!key || !authHeader) {
    return false;
  }
  const match = /^Apikey\s+(.+)$/i.exec(authHeader.trim());
  if (!match?.[1]) {
    return false;
  }
  return safeEqualStrings(match[1].trim(), key);
}

export type SepayWebhookResult =
  | { status: 200; body: { success: true } }
  | { status: 400 | 401 | 500; body: { success: false; error: string } };

export async function handleSepayWebhook(params: {
  request: Request;
  db: Database;
  env?: ApiEnv;
  now?: () => Date;
}): Promise<SepayWebhookResult> {
  const { request, db, env } = params;
  const now = (params.now ?? (() => new Date()))();

  const apiKey = typeof env?.SEPAY_WEBHOOK_API_KEY === "string" ? env.SEPAY_WEBHOOK_API_KEY : undefined;
  if (!verifySepayApiKey(request.headers.get("authorization"), apiKey)) {
    return { status: 401, body: { success: false, error: "Unauthorized" } };
  }

  const bankAccount = typeof env?.SEPAY_BANK_ACCOUNT === "string" ? env.SEPAY_BANK_ACCOUNT.trim() : "";
  if (!bankAccount) {
    return { status: 500, body: { success: false, error: "Payment bank not configured" } };
  }

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return { status: 400, body: { success: false, error: "Invalid JSON payload" } };
  }

  const parsed = sepayPayloadSchema.safeParse(rawJson);
  if (!parsed.success) {
    return { status: 400, body: { success: false, error: "Invalid payload" } };
  }
  const payload = parsed.data;
  const extractedCode = extractTransferCode(payload.code, payload.content);

  await ingestSepayTransaction({
    db,
    env,
    now,
    source: "webhook",
    sepayId: payload.id,
    sepayUuid: null,
    transferType: payload.transferType,
    gateway: payload.gateway,
    accountNumber: payload.accountNumber,
    subAccount: payload.subAccount,
    transferAmount: payload.transferAmount,
    extractedCode,
    referenceCode: payload.referenceCode,
    transactionDate: payload.transactionDate,
  });

  return { status: 200, body: { success: true } };
}
