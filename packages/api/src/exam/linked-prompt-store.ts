import { z } from "zod";

import { QUESTION_KEY_RE } from "../audio";

export type LinkedPromptBucketObject = {
  text(): Promise<string>;
};

export type LinkedPromptBucket = {
  get(key: string): Promise<LinkedPromptBucketObject | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<unknown>;
};

export const LinkedPromptSchema = z.object({
  questionText: z.string().min(5).max(300),
  triggerPhrase: z.string().max(160).optional(),
  baseQuestionText: z.string().min(1).max(1000),
  updatedAt: z.number().int().nonnegative(),
});

export type LinkedPrompt = z.infer<typeof LinkedPromptSchema>;

function assertSafePathSegment(value: string, label: string): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..")
  ) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
}

/**
 * Constructs the tenant-scoped R2 key for a dynamically linked exam prompt:
 * `users/<userId>/attempts/<attemptId>/prompts/<questionKey>.json`
 */
export function buildLinkedPromptKey(
  userId: string,
  attemptId: string,
  questionKey: string,
): string {
  assertSafePathSegment(userId, "userId");
  assertSafePathSegment(attemptId, "attemptId");
  if (!QUESTION_KEY_RE.test(questionKey)) {
    throw new Error(`Invalid questionKey format: "${questionKey}"`);
  }
  return `users/${userId}/attempts/${attemptId}/prompts/${questionKey}.json`;
}

export type LinkedPromptKeyParams = {
  userId: string;
  attemptId: string;
  questionKey: string;
};

/**
 * Validates and persists a linked prompt JSON object in R2.
 */
export async function saveLinkedPrompt(
  bucket: LinkedPromptBucket,
  params: LinkedPromptKeyParams & { prompt: LinkedPrompt },
): Promise<void> {
  const key = buildLinkedPromptKey(params.userId, params.attemptId, params.questionKey);
  const validated = LinkedPromptSchema.parse(params.prompt);
  await bucket.put(key, JSON.stringify(validated), {
    httpMetadata: { contentType: "application/json" },
  });
}

/**
 * Loads and validates a linked prompt from R2.
 * Fails safe by returning `null` when missing, unreadable, invalid JSON, or invalid schema.
 */
export async function loadLinkedPrompt(
  bucket: LinkedPromptBucket,
  params: LinkedPromptKeyParams,
): Promise<LinkedPrompt | null> {
  const key = buildLinkedPromptKey(params.userId, params.attemptId, params.questionKey);
  const obj = await bucket.get(key);
  if (!obj) {
    return null;
  }

  try {
    const raw = await obj.text();
    const parsedJson: unknown = JSON.parse(raw);
    const result = LinkedPromptSchema.safeParse(parsedJson);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Deletes a linked prompt object from R2 after key validation.
 */
export async function deleteLinkedPrompt(
  bucket: LinkedPromptBucket,
  params: LinkedPromptKeyParams,
): Promise<void> {
  const key = buildLinkedPromptKey(params.userId, params.attemptId, params.questionKey);
  await bucket.delete(key);
}
