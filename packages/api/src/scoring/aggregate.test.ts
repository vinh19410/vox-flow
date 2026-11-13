import { describe, expect, it } from "vitest";

import {
  aggregateRuns,
  confidenceRange,
  ieltsRound,
  median,
  overallFromCriteria,
  snapToHalfBand,
  weakestQuestionKey,
} from "./aggregate";

describe("median", () => {
  it("returns the middle value of an odd-length list regardless of order", () => {
    expect(median([7, 5.5, 6])).toBe(6);
    expect(median([6.5])).toBe(6.5);
  });

  it("averages the two middle values of an even-length list and snaps to 0.5", () => {
    expect(median([6, 7])).toBe(6.5);
    expect(median([6, 6.5])).toBe(6.5);
    expect(median([5, 6, 6.5, 9])).toBe(6.5);
  });

  it("throws on an empty list", () => {
    expect(() => median([])).toThrow();
  });
});

describe("ieltsRound", () => {
  it.each([
    [6, 6],
    [6.125, 6],
    [6.25, 6.5],
    [6.5, 6.5],
    [6.625, 6.5],
    [6.75, 7],
    [6.875, 7],
    [8.875, 9],
    [0, 0],
  ])("rounds %s to %s", (input, expected) => {
    expect(ieltsRound(input)).toBe(expected);
  });
});

describe("snapToHalfBand", () => {
  it("snaps to the nearest 0.5 and clamps into 0–9", () => {
    expect(snapToHalfBand(6.2)).toBe(6);
    expect(snapToHalfBand(6.25)).toBe(6.5);
    expect(snapToHalfBand(6.8)).toBe(7);
    expect(snapToHalfBand(-1)).toBe(0);
    expect(snapToHalfBand(9.6)).toBe(9);
  });
});

describe("overallFromCriteria", () => {
  it("applies IELTS rounding to the mean of the four criteria", () => {
    // mean 6.25 -> 6.5
    expect(overallFromCriteria({ FC: 6.5, LR: 6, GRA: 6, P: 6.5 })).toBe(6.5);
    // mean 6.75 -> 7
    expect(overallFromCriteria({ FC: 7, LR: 7, GRA: 6.5, P: 6.5 })).toBe(7);
    // mean 6.125 -> 6
    expect(overallFromCriteria({ FC: 6.5, LR: 6, GRA: 6, P: 6 })).toBe(6);
  });
});

describe("aggregateRuns", () => {
  it("takes the per-criterion median and derives overall from the medians", () => {
    const result = aggregateRuns([
      { FC: 6, LR: 6.5, GRA: 5.5, P: 7 },
      { FC: 7, LR: 6, GRA: 6, P: 6.5 },
      { FC: 6.5, LR: 6, GRA: 6.5, P: 6 },
    ]);
    expect(result.criteria).toEqual({ FC: 6.5, LR: 6, GRA: 6, P: 6.5 });
    // mean (6.5 + 6 + 6 + 6.5) / 4 = 6.25 -> 6.5
    expect(result.overall).toBe(6.5);
  });

  it("throws when there are no runs", () => {
    expect(() => aggregateRuns([])).toThrow();
  });
});

describe("confidenceRange", () => {
  it("returns [min, max] from multiple run overalls regardless of input order", () => {
    expect(confidenceRange([6.0, 6.5, 7.0])).toEqual([6.0, 7.0]);
    expect(confidenceRange([7.0, 6.0, 6.5])).toEqual([6.0, 7.0]);
  });

  it("snaps values to 0.5 bands and clamps into 0–9", () => {
    expect(confidenceRange([5.2, 6.8, 6.25])).toEqual([5.0, 7.0]);
    expect(confidenceRange([-1, 9.6])).toEqual([0, 9]);
  });

  it("returns equal bounds when given a single run", () => {
    expect(confidenceRange([6.5])).toEqual([6.5, 6.5]);
  });

  it("throws on empty input or non-finite values", () => {
    expect(() => confidenceRange([])).toThrow();
    expect(() => confidenceRange([6.5, Number.NaN])).toThrow();
    expect(() => confidenceRange([Number.POSITIVE_INFINITY])).toThrow();
  });
});

describe("weakestQuestionKey", () => {
  it("picks the question with the most minus evidence across all 4 criteria", () => {
    const answers = [
      { questionKey: "q1", partNumber: 1 },
      { questionKey: "q2", partNumber: 1 },
      { questionKey: "q3", partNumber: 2 },
    ];
    const criteria = [
      {
        evidence: [
          { questionKey: "q1", kind: "plus" as const },
          { questionKey: "q2", kind: "minus" as const },
        ],
      },
      {
        evidence: [
          { questionKey: "q2", kind: "minus" as const },
          { questionKey: "q3", kind: "minus" as const },
        ],
      },
      { evidence: [{ questionKey: "q1", kind: "plus" as const }] },
      { evidence: [] },
    ];
    expect(weakestQuestionKey(criteria, answers)).toBe("q2");
  });

  it("breaks ties by partNumber ascending then answer order regardless of unsorted input", () => {
    const answers = [
      { questionKey: "p2-1", partNumber: 2 },
      { questionKey: "p1-2", partNumber: 1 },
      { questionKey: "p1-1", partNumber: 1 },
    ];
    const criteria = [
      {
        evidence: [
          { questionKey: "p2-1", kind: "minus" as const },
          { questionKey: "p1-2", kind: "minus" as const },
        ],
      },
    ];
    // p1-2 has partNumber 1 vs p2-1 partNumber 2 -> p1-2 wins
    expect(weakestQuestionKey(criteria, answers)).toBe("p1-2");

    // Equal partNumber: original array order wins (p1-2 comes before p1-1 in `answers`)
    const samePartTie = [
      {
        evidence: [
          { questionKey: "p1-1", kind: "minus" as const },
          { questionKey: "p1-2", kind: "minus" as const },
        ],
      },
    ];
    expect(weakestQuestionKey(samePartTie, answers)).toBe("p1-2");
  });

  it("picks the first ordered answer when there is no minus evidence", () => {
    const answers = [
      { questionKey: "p2-1", partNumber: 2 },
      { questionKey: "p1-1", partNumber: 1 },
      { questionKey: "p1-2", partNumber: 1 },
    ];
    const criteria = [
      { evidence: [{ questionKey: "p2-1", kind: "plus" as const }] },
    ];
    expect(weakestQuestionKey(criteria, answers)).toBe("p1-1");
  });

  it("ignores minus evidence referencing unknown questionKeys not present in answers", () => {
    const answers = [{ questionKey: "q1", partNumber: 1 }];
    const criteria = [
      {
        evidence: [
          { questionKey: "ghost-q", kind: "minus" as const },
          { questionKey: "ghost-q", kind: "minus" as const },
        ],
      },
    ];
    expect(weakestQuestionKey(criteria, answers)).toBe("q1");
  });

  it("returns null when answers is empty", () => {
    expect(weakestQuestionKey([{ evidence: [{ questionKey: "q1", kind: "minus" }] }], [])).toBeNull();
  });
});
