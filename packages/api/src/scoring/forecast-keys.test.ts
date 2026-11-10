import { describe, expect, it } from "vitest";

import {
  cueCardKey,
  followUpKey,
  getValidQuestionKeysForTopic,
  parseTopicQuestions,
  part1QuestionKey,
  part3QuestionKey,
} from "./forecast-keys";

describe("parseTopicQuestions", () => {
  it("parses a JSON string with cueCards and part3", () => {
    const parsed = parseTopicQuestions(
      '{"cueCards":["Who is it","How you met"],"part3":["Why creative?","Can it be taught?"]}',
    );
    expect(parsed.cueCards).toEqual(["Who is it", "How you met"]);
    expect(parsed.part3Questions).toEqual(["Why creative?", "Can it be taught?"]);
    expect(parsed.part1Questions).toBeUndefined();
  });

  it("accepts an already-parsed { cueCards, part3 } object", () => {
    const parsed = parseTopicQuestions({
      cueCards: ["Point 1", "Point 2", "Ending"],
      part3: ["Q1"],
    });
    expect(parsed.cueCards).toEqual(["Point 1", "Point 2", "Ending"]);
    expect(parsed.part3Questions).toEqual(["Q1"]);
  });

  it("splits a legacy array with [Cue] / [Part 3] prefixes", () => {
    const parsed = parseTopicQuestions([
      "[Cue] Who the person is",
      "[Cue] And explain how you feel",
      "[Part 3] Why do people admire others?",
      "[Part 3] Is admiration common?",
    ]);
    expect(parsed.cueCards).toEqual(["Who the person is", "And explain how you feel"]);
    expect(parsed.part3Questions).toEqual([
      "Why do people admire others?",
      "Is admiration common?",
    ]);
  });

  it("treats a plain string array as Part 1 questions (also exposed as cue cards)", () => {
    const parsed = parseTopicQuestions(["Q one", "Q two"]);
    expect(parsed.part1Questions).toEqual(["Q one", "Q two"]);
    // Flat unprefixed arrays must never synthesize Part 3 questions.
    expect(parsed.part3Questions).toEqual([]);
    expect(parsed.cueCards).toEqual(["Q one", "Q two"]);
  });

  it("parses a JSON string containing a plain array", () => {
    const parsed = parseTopicQuestions('["A","B","C"]');
    expect(parsed.part1Questions).toEqual(["A", "B", "C"]);
  });

  it("returns empty lists for invalid JSON or unexpected shapes", () => {
    expect(parseTopicQuestions("not json")).toEqual({ cueCards: [], part3Questions: [] });
    expect(parseTopicQuestions(null)).toEqual({ cueCards: [], part3Questions: [] });
    expect(parseTopicQuestions(42)).toEqual({ cueCards: [], part3Questions: [] });
    expect(parseTopicQuestions('{"other":true}')).toEqual({
      cueCards: [],
      part3Questions: [],
    });
  });
});

describe("getValidQuestionKeysForTopic", () => {
  const seventeenP1Questions = Array.from({ length: 17 }, (_, i) => `P1 question ${i + 1}`);

  it("returns 17 main keys and 17 follow-up keys for a Part 1 topic", () => {
    const keys = getValidQuestionKeysForTopic({
      id: "p1-tidiness",
      part: 1,
      questions: seventeenP1Questions,
    });
    expect(keys.size).toBe(34);
    expect(keys.has("p1-tidiness-0")).toBe(true);
    expect(keys.has(followUpKey("p1-tidiness-0"))).toBe(true);
    expect(keys.has("p1-tidiness-16")).toBe(true);
    expect(keys.has(followUpKey("p1-tidiness-16"))).toBe(true);
    expect(keys.has(cueCardKey("p1-tidiness"))).toBe(false);
  });

  it("accepts raw JSON string questions for Part 1", () => {
    const keys = getValidQuestionKeysForTopic({
      id: "t",
      part: 1,
      questions: '["A","B"]',
    });
    expect(keys).toEqual(
      new Set([part1QuestionKey("t", 0), "t-0-f", part1QuestionKey("t", 1), "t-1-f"]),
    );
  });

  it("returns a cue card key, p3 keys, and follow-ups for Part 2/3 topics", () => {
    const keys = getValidQuestionKeysForTopic({
      id: "p23-env",
      part: 2,
      questions: { cueCards: ["Who", "How"], part3: ["Why?", "How often?"] },
    });
    expect(keys).toEqual(
      new Set([
        cueCardKey("p23-env"),
        followUpKey(cueCardKey("p23-env")),
        part3QuestionKey("p23-env", 0),
        followUpKey(part3QuestionKey("p23-env", 0)),
        part3QuestionKey("p23-env", 1),
        followUpKey(part3QuestionKey("p23-env", 1)),
      ]),
    );
  });

  it("maps a flat unprefixed array on a part != 1 topic to a single cue card only", () => {
    const keys = getValidQuestionKeysForTopic({
      id: "p2-flat",
      part: 2,
      questions: ["Describe something", "Another prompt"],
    });
    expect(keys).toEqual(
      new Set([cueCardKey("p2-flat"), followUpKey(cueCardKey("p2-flat"))]),
    );
    expect([...keys].some((k) => k.includes("-p3-"))).toBe(false);
  });

  it("supports legacy prefixed arrays for Part 2/3 topics", () => {
    const keys = getValidQuestionKeysForTopic({
      id: "legacy",
      part: 2,
      questions: ["[Cue] Point one", "[Part 3] Question one"],
    });
    expect(keys.has("legacy-c")).toBe(true);
    expect(keys.has("legacy-p3-0")).toBe(true);
    expect(keys.has(followUpKey("legacy-p3-0"))).toBe(true);
  });

  it("restricts to { key, key-f } for single-question practice", () => {
    const keys = getValidQuestionKeysForTopic(
      { id: "p1-tidiness", part: 1, questions: seventeenP1Questions },
      "area-1",
    );
    expect(keys).toEqual(new Set(["area-1", followUpKey("area-1")]));

    const cueScoped = getValidQuestionKeysForTopic(
      { id: "p23-env", part: 2, questions: { cueCards: ["Who"], part3: ["Why?"] } },
      "p23-env-p3-0",
    );
    expect(cueScoped).toEqual(
      new Set(["p23-env-p3-0", followUpKey("p23-env-p3-0")]),
    );

    expect(
      getValidQuestionKeysForTopic(
        { id: "p1-tidiness", part: 1, questions: ["A"] },
        null,
      ).size,
    ).toBe(2);
  });
});
