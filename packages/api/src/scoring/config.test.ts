import { afterEach, describe, expect, it, vi } from "vitest";

import { readScoringQueueMaxRetries } from "./config";

describe("readScoringQueueMaxRetries", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses a valid non-negative integer", () => {
    expect(readScoringQueueMaxRetries({ SCORING_QUEUE_MAX_RETRIES: "2" })).toBe(2);
    expect(readScoringQueueMaxRetries({ SCORING_QUEUE_MAX_RETRIES: "0" })).toBe(0);
  });

  it("falls back to 3 without warning on unset or empty values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readScoringQueueMaxRetries({})).toBe(3);
    expect(readScoringQueueMaxRetries({ SCORING_QUEUE_MAX_RETRIES: "" })).toBe(3);
    expect(readScoringQueueMaxRetries({ SCORING_QUEUE_MAX_RETRIES: "  " })).toBe(3);
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to 3 and warns on invalid values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const bad of ["abc", "-1", "2.5", "1e2", "101"]) {
      expect(readScoringQueueMaxRetries({ SCORING_QUEUE_MAX_RETRIES: bad })).toBe(3);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain("SCORING_QUEUE_MAX_RETRIES");
      warn.mockClear();
    }
  });

  it("accepts values up to the Cloudflare ceiling of 100", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readScoringQueueMaxRetries({ SCORING_QUEUE_MAX_RETRIES: "100" })).toBe(100);
    expect(warn).not.toHaveBeenCalled();
  });

  it("ignores non-string values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readScoringQueueMaxRetries({ SCORING_QUEUE_MAX_RETRIES: 5 })).toBe(3);
    expect(warn).not.toHaveBeenCalled();
  });
});
