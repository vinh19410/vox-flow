import { describe, expect, it } from "vitest";

import { aggregateRuns, ieltsRound, median, overallFromCriteria, snapToHalfBand } from "./aggregate";

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
