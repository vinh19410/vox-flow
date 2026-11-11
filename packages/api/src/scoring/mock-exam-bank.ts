/**
 * Canonical question bank for mock exams (`topicId === null`), shared by the
 * scoring pipeline and the upload guards. Pure TypeScript: no DB or server
 * runtime imports, so both `packages/api` and `apps/server` can consume it.
 *
 * Security invariant (#93): the client-supplied `attempt_answer.questionText`
 * must NEVER enter a grading prompt. Only text resolved from this bank (or the
 * "(question unavailable)" placeholder) is ever sent to the LLM.
 *
 * Key formats (mirrors `use-exam-session` step keys):
 * - Main question: `${item.id}` (e.g. `p1-1`)
 * - Static follow-up: `${item.id}-f` (only for items with a follow-up)
 */

export type MockExamMode = "full" | "part1" | "part2" | "part3";

export interface MockExamPromptItem {
  id: string;
  part: 1 | 2 | 3;
  text: string;
  cue?: { title: string; points: string[]; ending: string };
  followUp?: { text: string; trigger: string };
}

/** Golden literals: must stay character-identical to `apps/web` `ITEMS` (locked by mock-exam-bank.test.ts). */
export const MOCK_EXAM_PROMPTS: readonly MockExamPromptItem[] = [
  {
    id: "p1-1",
    part: 1,
    text: "Let's talk about where you live. Do you live in a house or an apartment?",
    followUp: {
      text: "You mentioned it gets quite noisy. What do you usually do to deal with the noise?",
      trigger: "quite noisy at night",
    },
  },
  {
    id: "p1-2",
    part: 1,
    text: "What do you like most about your neighbourhood?",
  },
  {
    id: "p1-3",
    part: 1,
    text: "Do you prefer studying in the morning or in the evening?",
  },
  {
    id: "p2-1",
    part: 2,
    text: "Describe a time when you helped someone.",
    cue: {
      title: "Describe a time when you helped someone.",
      points: ["who you helped", "how you helped them", "why you helped them"],
      ending: "and explain how you felt about helping this person.",
    },
  },
  {
    id: "p3-1",
    part: 3,
    text: "Why do you think some people prefer not to ask others for help?",
    followUp: {
      text: "You said pride is a big factor. Do you think this differs between generations?",
      trigger: "the main reason is pride",
    },
  },
  {
    id: "p3-2",
    part: 3,
    text: "Should schools encourage children to do volunteer work?",
  },
];

/** Which exam parts each server-side mode runs. Modes outside this map are fail-closed. */
export const MOCK_MODE_PARTS: Record<string, readonly (1 | 2 | 3)[]> = {
  full: [1, 2, 3],
  part1: [1],
  part2: [2],
  part3: [3],
};

/**
 * Every question key accepted for a mock attempt of `mode` (including static
 * follow-ups). Unknown modes return an EMPTY set — fail-closed, so a legacy or
 * unknown `attempt.mode` can never open the upload gate.
 */
export function getValidMockQuestionKeys(mode: string): Set<string> {
  const parts = MOCK_MODE_PARTS[mode];
  if (!parts || parts.length === 0) return new Set();
  const keys = new Set<string>();
  for (const item of MOCK_EXAM_PROMPTS) {
    if (!parts.includes(item.part)) continue;
    keys.add(item.id);
    if (item.followUp) keys.add(`${item.id}-f`);
  }
  return keys;
}

/**
 * Step keys for a mock attempt of `mode`, in the exact order `use-exam-session`
 * builds its steps (items of the mode's parts, main key then `-f` key).
 * Shared by the web session builder and the test parity checks.
 */
export function buildMockExamStepKeys(mode: string): string[] {
  const parts = MOCK_MODE_PARTS[mode];
  if (!parts || parts.length === 0) return [];
  const keys: string[] = [];
  for (const item of MOCK_EXAM_PROMPTS) {
    if (!parts.includes(item.part)) continue;
    keys.push(item.id);
    if (item.followUp) keys.push(`${item.id}-f`);
  }
  return keys;
}

/**
 * Canonical prompt text for a mock question key, resolved only from this bank.
 * With `mode`, a key outside the mode's valid set is rejected (null). Cue cards
 * compose into one prompt string; `-f` keys grade with the static follow-up.
 * Returns null for unknown or mode-mismatched keys — never client text.
 */
export function resolveCanonicalMockQuestionText(key: string, mode?: string): string | null {
  if (mode !== undefined && !getValidMockQuestionKeys(mode).has(key)) {
    return null;
  }
  const baseId = key.endsWith("-f") ? key.slice(0, -2) : key;
  const item = MOCK_EXAM_PROMPTS.find((candidate) => candidate.id === baseId);
  if (!item) return null;
  if (key.endsWith("-f")) return item.followUp?.text ?? null;
  if (item.cue) {
    return `${item.cue.title} You should say: ${item.cue.points.join(", ")}; ${item.cue.ending}`;
  }
  return item.text;
}
