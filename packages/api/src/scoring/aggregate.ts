import { CRITERION_KEYS, type CriterionKey } from "./types";

/** Floating-point slack used when comparing fractional bands. */
const EPSILON = 1e-9;

/** Rounds to the nearest 0.5 step (halves round up) and clamps into 0–9. */
export function snapToHalfBand(value: number): number {
  const snapped = Math.round(value * 2 + EPSILON) / 2;
  return Math.min(9, Math.max(0, snapped));
}

/**
 * Median of a non-empty list. With an even count the two middle values are
 * averaged and then snapped to a 0.5 step so the result is always a valid band.
 */
export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error("median requires at least one value");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return snapToHalfBand((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/**
 * IELTS overall-band rounding of a mean of criterion bands:
 * - fraction below .25 rounds down to the whole band (6.125 -> 6.0)
 * - fraction from .25 up to below .75 becomes the half band (6.25 -> 6.5, 6.625 -> 6.5)
 * - fraction from .75 rounds up to the next whole band (6.75 -> 7.0)
 */
export function ieltsRound(mean: number): number {
  const whole = Math.floor(mean + EPSILON);
  const fraction = mean - whole;
  let rounded: number;
  if (fraction < 0.25 - EPSILON) {
    rounded = whole;
  } else if (fraction < 0.75 - EPSILON) {
    rounded = whole + 0.5;
  } else {
    rounded = whole + 1;
  }
  return Math.min(9, Math.max(0, rounded));
}

export type CriterionBands = Record<CriterionKey, number>;

/** Overall band of one set of criterion bands: IELTS rounding of their mean. */
export function overallFromCriteria(bands: CriterionBands): number {
  const sum = CRITERION_KEYS.reduce((acc, key) => acc + bands[key], 0);
  return ieltsRound(sum / CRITERION_KEYS.length);
}

export type AggregatedBands = {
  criteria: CriterionBands;
  overall: number;
};

/**
 * Aggregates independent grading runs: each criterion is the median of the
 * runs' bands for that criterion, and the overall band is the IELTS rounding of
 * the mean of those four medians (not the median of the runs' overall bands).
 */
export function aggregateRuns(runs: readonly CriterionBands[]): AggregatedBands {
  if (runs.length === 0) {
    throw new Error("aggregateRuns requires at least one run");
  }
  const criteria = Object.fromEntries(
    CRITERION_KEYS.map((key) => [key, median(runs.map((run) => run[key]))]),
  ) as CriterionBands;
  return { criteria, overall: overallFromCriteria(criteria) };
}
