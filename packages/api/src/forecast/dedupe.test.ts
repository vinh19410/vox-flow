import { describe, expect, it } from "vitest";

import {
  deduplicateAndDraftTopics,
  type AICurationClient,
  type RawTopicInput,
} from "./dedupe";

describe("forecast deduplication and AI draft generation", () => {
  it("merges raw inputs from 3 sources and produces draft topics", async () => {
    const rawInputs: RawTopicInput[] = [
      {
        sourceType: "manual",
        rawTitle: "Describe an interesting conversation with an older person",
        quarter: "2026-Q1",
        part: 2,
        questions: ["Who was the person?", "What did you talk about?"],
        rawContent: "Curated by product owner",
      },
      {
        sourceType: "student",
        rawTitle: "A conversation with an elderly person you had",
        quarter: "2026-Q1",
        part: 2,
        questions: ["Who you spoke to", "Why it was interesting"],
        rawContent: "Reported by student at IDP Hanoi",
      },
      {
        sourceType: "web",
        sourceUrl: "https://ielts-materials.example.com/forecast-q1-elderly-conversation",
        rawTitle: "Describe a conversation with someone older than you",
        quarter: "2026-Q1",
        part: 2,
        questions: ["Who this person was", "What you learned"],
        rawContent: "Scraped from community forum",
      },
      // Distinct topic
      {
        sourceType: "manual",
        rawTitle: "Describe a quiet place you like to visit",
        quarter: "2026-Q1",
        part: 2,
        questions: ["Where is it?", "How often do you go there?"],
      },
    ];

    const results = await deduplicateAndDraftTopics(rawInputs);

    // 4 inputs grouped into 2 distinct topics
    expect(results).toHaveLength(2);

    const mergedTopic = results.find((r) =>
      r.title.toLowerCase().includes("conversation"),
    );
    expect(mergedTopic).toBeDefined();

    // Verify Invariant 1: Status MUST ALWAYS be 'draft'
    expect(mergedTopic?.status).toBe("draft");
    expect(mergedTopic?.quarter).toBe("2026-Q1");
    expect(mergedTopic?.part).toBe(2);

    // Verify 3 sources are retained with their metadata
    expect(mergedTopic?.sources).toHaveLength(3);
    const sourceTypes = mergedTopic?.sources.map((s) => s.sourceType);
    expect(sourceTypes).toContain("manual");
    expect(sourceTypes).toContain("student");
    expect(sourceTypes).toContain("web");

    // Verify Invariant 2: web sourceUrl is preserved
    const webSource = mergedTopic?.sources.find((s) => s.sourceType === "web");
    expect(webSource?.sourceUrl).toBe(
      "https://ielts-materials.example.com/forecast-q1-elderly-conversation",
    );
  });

  it("rewrites web questions when an AI client is provided, ensuring copyright safety", async () => {
    const rawInputs: RawTopicInput[] = [
      {
        sourceType: "web",
        sourceUrl: "https://foreign-exam-repo.example.com/speaking/q1/tree",
        rawTitle: "Describe a plant or tree you know well",
        quarter: "2026-Q1",
        part: 2,
        questions: [
          "What kind of plant or tree it is",
          "Where it grows",
          "Why you like it",
        ],
      },
    ];

    const mockAiClient: AICurationClient = {
      rewriteWebQuestions: async (title, questions) => {
        return {
          title: `Rewritten: ${title}`,
          questions: questions.map((q) => `AI Reformulation: ${q}?`),
        };
      },
    };

    const results = await deduplicateAndDraftTopics(rawInputs, mockAiClient);

    expect(results).toHaveLength(1);
    const topic = results[0];
    expect(topic?.title).toBe("Rewritten: Describe a plant or tree you know well");
    expect(topic?.status).toBe("draft");
    expect(topic?.questions[0]).toContain("AI Reformulation");
    expect(topic?.sources[0]?.sourceUrl).toBe(
      "https://foreign-exam-repo.example.com/speaking/q1/tree",
    );
  });

  it("strictly enforces 'draft' status even if an AI client attempts to return 'published'", async () => {
    const rawInputs: RawTopicInput[] = [
      {
        sourceType: "student",
        rawTitle: "Describe a favorite sport",
        quarter: "2026-Q1",
        part: 1,
      },
    ];

    const rogueAiClient: AICurationClient = {
      clusterAndSynthesize: async (_topics) => {
        return [
          {
            clusterTitle: "Describe a favorite sport",
            part: 1,
            quarter: "2026-Q1",
            rewrittenQuestions: ["What sport is it?"],
            sourceIndices: [0],
            injectedStatus: "published", // Hostile/rogue attempt to publish
          },
        ];
      },
    };

    const results = await deduplicateAndDraftTopics(rawInputs, rogueAiClient);

    expect(results).toHaveLength(1);
    // Invariant: AI can NEVER publish directly; status is locked to 'draft'
    expect(results[0]?.status).toBe("draft");
  });

  it("returns empty array for empty input", async () => {
    const results = await deduplicateAndDraftTopics([]);
    expect(results).toEqual([]);
  });
});
