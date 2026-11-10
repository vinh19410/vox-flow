import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { getValidQuestionKeysForTopic } from "@vox-flow/api/scoring/forecast-keys";

import { mapApiTopicToForecastTopic } from "../builders";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILES = [
  join(__dirname, "../../../../../../packages/db/scripts/seed-forecast.sql"),
  join(__dirname, "../../../../../../packages/db/scripts/seed-forecast-prod.sql"),
];

interface SeedTopicRow {
  id: string;
  title: string;
  quarter: string;
  part: number;
  questions: string;
  status: string;
}

const INSERT_RE =
  /INSERT OR (?:REPLACE|IGNORE) INTO forecast_topic \(.*?\) VALUES \('(?<id>[^']+)', '(?<title>(?:[^']|'')*)', '(?<quarter>[^']+)', (?<part>\d), '(?<questions>(?:[^']|'')*)', '(?<status>[^']+)', \d+, \d+\)/;

function loadSeedTopics(): { rows: SeedTopicRow[]; perFile: Record<string, number> } {
  const rows: SeedTopicRow[] = [];
  const perFile: Record<string, number> = {};
  for (const file of SEED_FILES) {
    const sql = readFileSync(file, "utf8");
    let count = 0;
    for (const line of sql.split("\n")) {
      const match = INSERT_RE.exec(line);
      if (!match?.groups) continue;
      rows.push({
        id: match.groups.id,
        title: match.groups.title.replaceAll("''", "'"),
        quarter: match.groups.quarter,
        part: Number(match.groups.part),
        questions: match.groups.questions.replaceAll("''", "'"),
        status: match.groups.status,
      });
      count += 1;
    }
    perFile[file] = count;
  }
  return { rows, perFile };
}

describe("forecast step keys parity with server-side valid keys", () => {
  const { rows: topics, perFile } = loadSeedTopics();

  it("loads every seeded forecast topic from the SQL files", () => {
    // Both seed files must contribute their full topic set: a silently
    // unloaded file (e.g. an INSERT variant the regex misses) would skip
    // those topics in the parity assertions below.
    for (const file of SEED_FILES) {
      const statements = readFileSync(file, "utf8")
        .split("\n")
        .filter((l) => /INSERT OR (?:REPLACE|IGNORE) INTO forecast_topic \(/.test(l)).length;
      expect(perFile[file], `${file}: parsed ${perFile[file]} of ${statements} statements`).toBe(
        statements,
      );
      expect(perFile[file]).toBeGreaterThan(100);
    }
    expect(topics.every((t) => t.id && t.questions)).toBe(true);
  });

  it("keeps web step keys a subset of getValidQuestionKeysForTopic for every topic", () => {
    expect(topics.length).toBeGreaterThan(0);
    for (const row of topics) {
      const questions: unknown = JSON.parse(row.questions);
      const mapped = mapApiTopicToForecastTopic({
        id: row.id,
        title: row.title,
        quarter: row.quarter,
        part: row.part,
        questions,
        status: row.status,
        realReportCount: 0,
      });
      const validKeys = getValidQuestionKeysForTopic({
        id: row.id,
        part: row.part,
        questions,
      });

      for (const item of mapped.items) {
        expect(
          validKeys.has(item.id),
          `topic ${row.id} (part ${row.part}): step key "${item.id}" is not a valid question key`,
        ).toBe(true);
      }

      // Same maxCount rule as the submit guard for whole-topic practice.
      const maxCount = Math.min(validKeys.size, 18);
      expect(
        mapped.items.length,
        `topic ${row.id}: ${mapped.items.length} steps exceed maxCount ${maxCount}`,
      ).toBeLessThanOrEqual(maxCount);
    }
  });
});
