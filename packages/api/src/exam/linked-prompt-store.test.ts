import type { R2Bucket } from "@cloudflare/workers-types";
import { describe, expect, it, vi } from "vitest";

import {
  buildLinkedPromptKey,
  deleteLinkedPrompt,
  type LinkedPrompt,
  LinkedPromptSchema,
  loadLinkedPrompt,
  saveLinkedPrompt,
} from "./linked-prompt-store";

function createMockR2Bucket() {
  const store = new Map<string, { value: string; contentType?: string }>();

  const getSpy = vi.fn(async (key: string) => {
    const entry = store.get(key);
    if (!entry) return null;
    return {
      text: async () => entry.value,
    };
  });

  const putSpy = vi.fn(
    async (
      key: string,
      value: string | ArrayBuffer | ArrayBufferView | ReadableStream | Blob | null,
      options?: { httpMetadata?: { contentType?: string } },
    ) => {
      if (typeof value !== "string") {
        throw new Error("Expected string JSON value in test mock");
      }
      store.set(key, {
        value,
        contentType: options?.httpMetadata?.contentType,
      });
      return null;
    },
  );

  const deleteSpy = vi.fn(async (keys: string | string[]) => {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) {
      store.delete(k);
    }
  });

  const bucket = {
    get: getSpy,
    put: putSpy,
    delete: deleteSpy,
  } as unknown as R2Bucket;

  return { store, bucket, getSpy, putSpy, deleteSpy };
}

describe("linked-prompt-store", () => {
  const userId = "usr_123";
  const attemptId = "att_456";
  const questionKey = "p1-2";

  const samplePrompt: LinkedPrompt = {
    questionText: "Since you enjoy cooking Italian pasta, do you often cook for your family?",
    triggerPhrase: "cooking Italian pasta",
    baseQuestionText: "Do you like cooking?",
    updatedAt: 1_700_000_000_000,
  };

  describe("buildLinkedPromptKey", () => {
    it("builds tenant-scoped prompt JSON key", () => {
      expect(buildLinkedPromptKey(userId, attemptId, questionKey)).toBe(
        "users/usr_123/attempts/att_456/prompts/p1-2.json",
      );
    });

    it("rejects empty or traversal segments in userId, attemptId, and questionKey", () => {
      expect(() => buildLinkedPromptKey("", attemptId, questionKey)).toThrow();
      expect(() => buildLinkedPromptKey("   ", attemptId, questionKey)).toThrow();
      expect(() => buildLinkedPromptKey("usr/evil", attemptId, questionKey)).toThrow();
      expect(() => buildLinkedPromptKey("usr\\evil", attemptId, questionKey)).toThrow();
      expect(() => buildLinkedPromptKey("..evil", attemptId, questionKey)).toThrow();

      expect(() => buildLinkedPromptKey(userId, "", questionKey)).toThrow();
      expect(() => buildLinkedPromptKey(userId, "att/evil", questionKey)).toThrow();
      expect(() => buildLinkedPromptKey(userId, "att\\evil", questionKey)).toThrow();
      expect(() => buildLinkedPromptKey(userId, "att..evil", questionKey)).toThrow();

      expect(() => buildLinkedPromptKey(userId, attemptId, "")).toThrow();
      expect(() => buildLinkedPromptKey(userId, attemptId, "../secret")).toThrow();
      expect(() => buildLinkedPromptKey(userId, attemptId, "p1.1")).toThrow();
      expect(() => buildLinkedPromptKey(userId, attemptId, "p1/1")).toThrow();
    });
  });

  describe("saveLinkedPrompt / loadLinkedPrompt / deleteLinkedPrompt", () => {
    it("round-trips a valid linked prompt with JSON content-type metadata", async () => {
      const { bucket, store, putSpy } = createMockR2Bucket();

      await saveLinkedPrompt(bucket, {
        userId,
        attemptId,
        questionKey,
        prompt: samplePrompt,
      });

      const expectedKey = "users/usr_123/attempts/att_456/prompts/p1-2.json";
      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(store.get(expectedKey)?.contentType).toBe("application/json");

      const loaded = await loadLinkedPrompt(bucket, { userId, attemptId, questionKey });
      expect(loaded).toEqual(samplePrompt);
    });

    it("round-trips a linked prompt without optional triggerPhrase", async () => {
      const { bucket } = createMockR2Bucket();
      const withoutTrigger: LinkedPrompt = {
        questionText: "Could you tell me more about how you spend your weekends?",
        baseQuestionText: "What do you do on weekends?",
        updatedAt: 1_700_000_000_100,
      };

      await saveLinkedPrompt(bucket, {
        userId,
        attemptId,
        questionKey: "p1-3",
        prompt: withoutTrigger,
      });

      const loaded = await loadLinkedPrompt(bucket, { userId, attemptId, questionKey: "p1-3" });
      expect(loaded).toEqual(withoutTrigger);
    });

    it("returns null when the prompt object does not exist", async () => {
      const { bucket } = createMockR2Bucket();
      const loaded = await loadLinkedPrompt(bucket, { userId, attemptId, questionKey: "p1-99" });
      expect(loaded).toBeNull();
    });

    it("returns null when R2 contains corrupt JSON", async () => {
      const { bucket, store } = createMockR2Bucket();
      const key = buildLinkedPromptKey(userId, attemptId, questionKey);
      store.set(key, { value: "{not valid json", contentType: "application/json" });

      const loaded = await loadLinkedPrompt(bucket, { userId, attemptId, questionKey });
      expect(loaded).toBeNull();
    });

    it("returns null when R2 JSON fails LinkedPromptSchema validation", async () => {
      const { bucket, store } = createMockR2Bucket();
      const key = buildLinkedPromptKey(userId, attemptId, questionKey);

      store.set(key, {
        value: JSON.stringify({
          questionText: "Hi?", // shorter than min(5)
          baseQuestionText: "How are you?",
          updatedAt: -5,
        }),
        contentType: "application/json",
      });

      const loaded = await loadLinkedPrompt(bucket, { userId, attemptId, questionKey });
      expect(loaded).toBeNull();
    });

    it("rejects saving an invalid prompt without writing to R2", async () => {
      const { bucket, putSpy } = createMockR2Bucket();

      await expect(
        saveLinkedPrompt(bucket, {
          userId,
          attemptId,
          questionKey,
          prompt: {
            questionText: "No",
            baseQuestionText: "Base",
            updatedAt: 100,
          },
        }),
      ).rejects.toThrow();

      expect(putSpy).not.toHaveBeenCalled();
    });

    it("deletes the stored prompt key cleanly", async () => {
      const { bucket, store, deleteSpy } = createMockR2Bucket();
      await saveLinkedPrompt(bucket, {
        userId,
        attemptId,
        questionKey,
        prompt: samplePrompt,
      });
      expect(store.size).toBe(1);

      await deleteLinkedPrompt(bucket, { userId, attemptId, questionKey });
      expect(deleteSpy).toHaveBeenCalledWith(
        "users/usr_123/attempts/att_456/prompts/p1-2.json",
      );
      expect(store.size).toBe(0);
      await expect(
        loadLinkedPrompt(bucket, { userId, attemptId, questionKey }),
      ).resolves.toBeNull();
    });

    it("rejects path traversal across save, load, and delete", async () => {
      const { bucket, getSpy, putSpy, deleteSpy } = createMockR2Bucket();

      await expect(
        saveLinkedPrompt(bucket, {
          userId: "../other",
          attemptId,
          questionKey,
          prompt: samplePrompt,
        }),
      ).rejects.toThrow();

      await expect(
        loadLinkedPrompt(bucket, {
          userId,
          attemptId: "att/../../x",
          questionKey,
        }),
      ).rejects.toThrow();

      await expect(
        deleteLinkedPrompt(bucket, {
          userId,
          attemptId,
          questionKey: "p1-1.json",
        }),
      ).rejects.toThrow();

      expect(putSpy).not.toHaveBeenCalled();
      expect(getSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it("validates LinkedPromptSchema boundaries", () => {
      expect(
        LinkedPromptSchema.safeParse({
          questionText: "12345",
          baseQuestionText: "Q",
          updatedAt: 0,
        }).success,
      ).toBe(true);

      expect(
        LinkedPromptSchema.safeParse({
          questionText: "1234",
          baseQuestionText: "Q",
          updatedAt: 0,
        }).success,
      ).toBe(false);

      expect(
        LinkedPromptSchema.safeParse({
          questionText: "Valid question?",
          triggerPhrase: "x".repeat(161),
          baseQuestionText: "Q",
          updatedAt: 0,
        }).success,
      ).toBe(false);
    });
  });
});
