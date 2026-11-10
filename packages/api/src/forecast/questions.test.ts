import { describe, expect, it } from "vitest";

import { parseForecastTopicQuestions, resolveCanonicalQuestionText } from "./questions";

describe("parseForecastTopicQuestions", () => {
  it("parses a part-1 plain array", () => {
    const result = parseForecastTopicQuestions('["a","b"]');
    expect(result.questions).toEqual(["a", "b"]);
    expect(result.isNew).toBe(false);
  });

  it("parses a part-2/3 object with cueCards and part3", () => {
    const result = parseForecastTopicQuestions(
      '{"cueCards":["p1","p2","end"],"part3":["q1"],"isNew":true}',
    );
    expect(result.questions).toEqual({ cueCards: ["p1", "p2", "end"], part3: ["q1"], isNew: true });
    expect(result.isNew).toBe(true);
  });

  it("reads isNew even without cueCards/part3", () => {
    const result = parseForecastTopicQuestions('{"isNew":true}');
    expect(result.questions).toEqual([]);
    expect(result.isNew).toBe(true);
  });

  it("returns empty questions on malformed JSON or unexpected shapes", () => {
    expect(parseForecastTopicQuestions("not json").questions).toEqual([]);
    expect(parseForecastTopicQuestions("42").questions).toEqual([]);
    expect(parseForecastTopicQuestions('"str"').questions).toEqual([]);
  });

  it("coerces array items to strings without sniffing markers", () => {
    const result = parseForecastTopicQuestions('["[Cue] T","[Part 3] Q"]');
    expect(result.questions).toEqual(["[Cue] T", "[Part 3] Q"]);
  });
});

describe("resolveCanonicalQuestionText", () => {
  const part1Topic = { id: "T", title: "Part 1 topic", part: 1, questions: ["Where do you live?", "Second?"] };
  const part2Topic = {
    id: "T",
    title: "Cue card title",
    part: 2,
    questions: { cueCards: ["point 1", "ending"], part3: ["Follow up?", "Deepen?"] },
  };

  it("resolves part-1 keys within bounds", () => {
    expect(resolveCanonicalQuestionText(part1Topic, "T-0")).toBe("Where do you live?");
    expect(resolveCanonicalQuestionText(part1Topic, "T-1")).toBe("Second?");
  });

  it("rejects out-of-bounds and cross-part keys", () => {
    expect(resolveCanonicalQuestionText(part1Topic, "T-2")).toBeNull();
    expect(resolveCanonicalQuestionText(part1Topic, "T-c")).toBeNull();
    expect(resolveCanonicalQuestionText(part1Topic, "T-p3-0")).toBeNull();
  });

  it("resolves part-2 cue card and part-3 keys", () => {
    expect(resolveCanonicalQuestionText(part2Topic, "T-c")).toBe("Cue card title");
    expect(resolveCanonicalQuestionText(part2Topic, "T-p3-0")).toBe("Follow up?");
    expect(resolveCanonicalQuestionText(part2Topic, "T-p3-1")).toBe("Deepen?");
  });

  it("rejects out-of-bounds part-3 indexes", () => {
    expect(resolveCanonicalQuestionText(part2Topic, "T-p3-2")).toBeNull();
  });

  it("rejects keys of a different topic", () => {
    expect(resolveCanonicalQuestionText(part1Topic, "other-0")).toBeNull();
  });

  it("keeps nested topic ids unambiguous", () => {
    // Topic "abc" must not claim key "abc-1-0" (belongs to topic "abc-1"):
    // the suffix "1-0" matches no slot pattern.
    expect(resolveCanonicalQuestionText(part1Topic, "T-1-0")).toBeNull();
    const nested = { id: "T-1", title: "Nested", part: 1, questions: ["Q"] };
    expect(resolveCanonicalQuestionText(nested, "T-1-0")).toBe("Q");
  });

  it("rejects junk keys that share the topic prefix", () => {
    expect(resolveCanonicalQuestionText(part1Topic, "T-junk")).toBeNull();
    expect(resolveCanonicalQuestionText(part1Topic, "T-junk-f")).toBeNull();
    expect(resolveCanonicalQuestionText(part1Topic, "T--1")).toBeNull();
  });

  it("treats blank bank entries as unresolvable", () => {
    const blankBank = { id: "T", title: "T", part: 1, questions: ["", "   "] };
    expect(resolveCanonicalQuestionText(blankBank, "T-0")).toBeNull();
    expect(resolveCanonicalQuestionText(blankBank, "T-1")).toBeNull();
  });

  it("aligns plain-array part-2 topics with the #91 upload guard", () => {
    // #91's parseTopicQuestions treats a plain unprefixed array on a part 2+
    // topic as cue cards (never part 3), and the upload guard accepts `-c`.
    const plainP2 = { id: "T", title: "Cue card title", part: 2, questions: ["legacy", "array"] };
    expect(resolveCanonicalQuestionText(plainP2, "T-c")).toBe("Cue card title");
    expect(resolveCanonicalQuestionText(plainP2, "T-p3-0")).toBeNull();
  });

  it("resolves legacy prefixed arrays on part-2 topics like the guard", () => {
    const legacyP2 = {
      id: "T",
      title: "Cue card title",
      part: 2,
      questions: ["[Cue] point one", "[Cue] ending", "[Part 3] Follow up?"],
    };
    expect(resolveCanonicalQuestionText(legacyP2, "T-c")).toBe("Cue card title");
    expect(resolveCanonicalQuestionText(legacyP2, "T-p3-0")).toBe("Follow up?");
  });

  it("rejects bank keys when the shape does not match the topic part", () => {
    expect(
      resolveCanonicalQuestionText({ ...part1Topic, questions: { cueCards: [], part3: [] } }, "T-0"),
    ).toBeNull();
  });
});
