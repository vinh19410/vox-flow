import { describe, expect, it } from "vitest";

import { MOCK_EXAM_PROMPTS, getValidMockQuestionKeys, resolveCanonicalMockQuestionText } from "./mock-exam-bank";
import { SINGLE_QUESTION_CAP, TOPIC_LESS_CAP, maxAnswersForAttempt } from "./answer-limits";

describe("mock-exam-bank", () => {
  describe("getValidMockQuestionKeys", () => {
    it("returns the 8 full-test keys in use-exam-session step order", () => {
      expect([...getValidMockQuestionKeys("full")]).toEqual([
        "p1-1",
        "p1-1-f",
        "p1-2",
        "p1-3",
        "p2-1",
        "p3-1",
        "p3-1-f",
        "p3-2",
      ]);
    });

    it("returns part-scoped key sets in step order", () => {
      expect([...getValidMockQuestionKeys("part1")]).toEqual(["p1-1", "p1-1-f", "p1-2", "p1-3"]);
      expect([...getValidMockQuestionKeys("part2")]).toEqual(["p2-1"]);
      expect([...getValidMockQuestionKeys("part3")]).toEqual(["p3-1", "p3-1-f", "p3-2"]);
    });

    it("is fail-closed for unknown modes: no key is valid", () => {
      expect(getValidMockQuestionKeys("unknown")).toEqual(new Set());
      expect(getValidMockQuestionKeys("daily-practice")).toEqual(new Set());
    });

    it("locks to a single valid questionKey for mock retakes and fails closed on mismatch", () => {
      expect(getValidMockQuestionKeys("part2", "p2-1")).toEqual(new Set(["p2-1"]));
      expect(getValidMockQuestionKeys("full", "p1-1-f")).toEqual(new Set(["p1-1-f"]));
      expect(getValidMockQuestionKeys("part1", "p2-1")).toEqual(new Set());
      expect(getValidMockQuestionKeys("full", "not-in-bank")).toEqual(new Set());
    });
  });

  describe("resolveCanonicalMockQuestionText", () => {
    it("returns the original Part 1 question", () => {
      expect(resolveCanonicalMockQuestionText("p1-1", "part1")).toBe(
        "Let's talk about where you live. Do you live in a house or an apartment?",
      );
    });

    it("returns the static follow-up text for -f keys", () => {
      expect(resolveCanonicalMockQuestionText("p1-1-f", "part1")).toBe(
        "You mentioned it gets quite noisy. What do you usually do to deal with the noise?",
      );
      expect(resolveCanonicalMockQuestionText("p3-1-f", "full")).toBe(
        "You said pride is a big factor. Do you think this differs between generations?",
      );
    });

    it("composes the Part 2 cue card text", () => {
      for (const mode of ["part2", "full"] as const) {
        const text = resolveCanonicalMockQuestionText("p2-1", mode);
        expect(text).toContain("Describe a time when you helped someone.");
        expect(text).toContain("who you helped");
        expect(text).toContain("how you helped them");
        expect(text).toContain("why you helped them");
        expect(text).toContain("and explain how you felt about helping this person.");
      }
    });

    it("returns null for a wrong-mode key or an unknown key", () => {
      expect(resolveCanonicalMockQuestionText("p3-1", "part1")).toBeNull();
      expect(resolveCanonicalMockQuestionText("p1-99", "full")).toBeNull();
      expect(resolveCanonicalMockQuestionText("p1-99")).toBeNull();
    });
  });

  describe("golden literals (must match apps/web/src/features/exam/data.ts ITEMS verbatim)", () => {
    it("holds the 6 exam items in client step order", () => {
      expect(MOCK_EXAM_PROMPTS.map((item) => item.id)).toEqual(["p1-1", "p1-2", "p1-3", "p2-1", "p3-1", "p3-2"]);
    });

    it("locks the five plain question texts", () => {
      const textOf = (id: string) => MOCK_EXAM_PROMPTS.find((item) => item.id === id)?.text;
      expect(textOf("p1-1")).toBe("Let's talk about where you live. Do you live in a house or an apartment?");
      expect(textOf("p1-2")).toBe("What do you like most about your neighbourhood?");
      expect(textOf("p1-3")).toBe("Do you prefer studying in the morning or in the evening?");
      expect(textOf("p3-1")).toBe("Why do you think some people prefer not to ask others for help?");
      expect(textOf("p3-2")).toBe("Should schools encourage children to do volunteer work?");
    });

    it("locks the Part 2 cue card", () => {
      expect(MOCK_EXAM_PROMPTS.find((item) => item.id === "p2-1")?.cue).toEqual({
        title: "Describe a time when you helped someone.",
        points: ["who you helped", "how you helped them", "why you helped them"],
        ending: "and explain how you felt about helping this person.",
      });
    });

    it("locks the static follow-ups", () => {
      expect(MOCK_EXAM_PROMPTS.find((item) => item.id === "p1-1")?.followUp).toEqual({
        text: "You mentioned it gets quite noisy. What do you usually do to deal with the noise?",
        trigger: "quite noisy at night",
      });
      expect(MOCK_EXAM_PROMPTS.find((item) => item.id === "p3-1")?.followUp).toEqual({
        text: "You said pride is a big factor. Do you think this differs between generations?",
        trigger: "the main reason is pride",
      });
    });
  });

  describe("maxAnswersForAttempt (mock modes)", () => {
    it("caps topic-less attempts by the mode's key-set size; unknown modes cap at 0", () => {
      expect(maxAnswersForAttempt({ mode: "full", topicId: null, questionKey: null }, null)).toBe(8);
      expect(maxAnswersForAttempt({ mode: "part1", topicId: null, questionKey: null }, null)).toBe(4);
      expect(maxAnswersForAttempt({ mode: "part2", topicId: null, questionKey: null }, null)).toBe(1);
      expect(maxAnswersForAttempt({ mode: "part3", topicId: null, questionKey: null }, null)).toBe(3);
      // Fail-closed: an unknown mode has an empty key set, so nothing is allowed.
      expect(maxAnswersForAttempt({ mode: "daily-practice", topicId: null, questionKey: null }, null)).toBe(0);
    });

    it("keeps TOPIC_LESS_CAP for a forecast attempt whose topic row was deleted", () => {
      expect(maxAnswersForAttempt({ mode: "part2", topicId: "deleted-topic", questionKey: null }, null)).toBe(
        TOPIC_LESS_CAP,
      );
    });

    it("keeps SINGLE_QUESTION_CAP for single-question practice", () => {
      expect(maxAnswersForAttempt({ mode: "part1", topicId: "t1", questionKey: "t1-0" }, null)).toBe(
        SINGLE_QUESTION_CAP,
      );
    });
  });
});
