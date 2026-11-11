import { buildMockExamStepKeys, resolveCanonicalMockQuestionText } from "@vox-flow/api/scoring/mock-exam-bank";
import { describe, expect, it } from "vitest";

import { ITEMS, MODES } from "../data";

/**
 * Client mode ids map onto the server-side mock-exam mode names used by the
 * upload allowlist and the scoring pipeline.
 */
const API_MODE: Record<(typeof MODES)[number]["id"], string> = {
  full: "full",
  p1: "part1",
  p2: "part2",
  p3: "part3",
};

/** Mirrors `use-exam-session`: filter items by the mode's parts, main key then `-f`. */
function webStepKeys(modeId: (typeof MODES)[number]["id"]): string[] {
  const parts = MODES.find((m) => m.id === modeId)?.parts ?? [];
  const keys: string[] = [];
  for (const item of ITEMS) {
    if (!parts.includes(item.part)) continue;
    keys.push(item.id);
    if (item.followUp) keys.push(`${item.id}-f`);
  }
  return keys;
}

describe("mock exam question parity between web ITEMS and the server bank", () => {
  for (const mode of MODES) {
    it(`keeps the step keys of mode ${mode.id} in sync with the shared bank`, () => {
      const apiMode = API_MODE[mode.id];
      const keys = webStepKeys(mode.id);
      expect(keys).toEqual(buildMockExamStepKeys(apiMode));
      for (const key of keys) {
        expect(resolveCanonicalMockQuestionText(key, apiMode)).not.toBeNull();
      }
    });
  }
});
