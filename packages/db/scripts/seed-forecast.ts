import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "../../..");
const RAW_DATA_PATH = join(ROOT_DIR, "raw-data/speaking-forecast-full.json");
const OUTPUT_SQL_PATH = join(__dirname, "seed-forecast.sql");

export function deterministicUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export function escapeSql(val: string | null | undefined): string {
  if (val === null || val === undefined) return "NULL";
  return `'${val.replace(/'/g, "''")}'`;
}

export interface RawForecastPart1 {
  topic: string;
  questions: string[];
}

export interface RawForecastPart2 {
  group: string;
  title: string;
  cueCards: string[];
  isNew: boolean;
}

export interface RawForecastPart3 {
  group: string;
  card: string;
  isNew: boolean;
  questions: string[];
}

export interface RawForecastData {
  meta: {
    source: string;
    forecastDate: string;
    updatedLabel: string;
  };
  part1: RawForecastPart1[];
  part2: RawForecastPart2[];
  part3: RawForecastPart3[];
}

export interface SeedTopic {
  id: string;
  title: string;
  quarter: string;
  part: number;
  questions: string;
  status: "published";
  createdAt: number;
  updatedAt: number;
}

export interface SeedSource {
  id: string;
  topicId: string;
  sourceType: "web";
  sourceUrl: string;
  rawContent: string;
  createdAt: number;
}

export function generateForecastSeed(rawPath = RAW_DATA_PATH): {
  topics: SeedTopic[];
  sources: SeedSource[];
  sql: string;
} {
  const rawContent = readFileSync(rawPath, "utf-8");
  const raw: RawForecastData = JSON.parse(rawContent);

  const quarter = "2026-Q3";
  const sourceUrl = "https://luyennoi.com";
  const now = 1730000000000;

  const topics: SeedTopic[] = [];
  const sources: SeedSource[] = [];

  // Part 1: 65 topics
  for (const p1 of raw.part1) {
    const topicId = deterministicUuid(`voxflow:topic:p1:${p1.topic.trim().toLowerCase()}`);
    const questionsJson = JSON.stringify(p1.questions);

    topics.push({
      id: topicId,
      title: p1.topic.trim(),
      quarter,
      part: 1,
      questions: questionsJson,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });

    sources.push({
      id: deterministicUuid(`voxflow:source:p1:${p1.topic.trim().toLowerCase()}`),
      topicId,
      sourceType: "web",
      sourceUrl,
      rawContent: JSON.stringify({ topic: p1.topic, questions: p1.questions }),
      createdAt: now,
    });
  }

  // Part 2 & 3: 113 cards
  const p3Map = new Map<string, RawForecastPart3>();
  for (const p3 of raw.part3) {
    p3Map.set(p3.card.trim().toLowerCase(), p3);
  }

  for (const p2 of raw.part2) {
    const key = p2.title.trim().toLowerCase();
    const p3 = p3Map.get(key);
    const p3Questions = p3 ? p3.questions : [];

    const topicId = deterministicUuid(`voxflow:topic:p23:${key}`);
    const questionsJson = JSON.stringify({
      cueCards: p2.cueCards,
      part3: p3Questions,
      isNew: Boolean(p2.isNew),
    });

    topics.push({
      id: topicId,
      title: p2.title.trim(),
      quarter,
      part: 2,
      questions: questionsJson,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });

    sources.push({
      id: deterministicUuid(`voxflow:source:p23:${key}`),
      topicId,
      sourceType: "web",
      sourceUrl,
      rawContent: JSON.stringify({ part2: p2, part3: p3 ?? null }),
      createdAt: now,
    });
  }

  const sqlStatements: string[] = [
    "-- Vox Flow 2026-Q3 Speaking Forecast Seed",
    "-- Target: D1 Local emulator / dev database only",
    "-- Generated from raw-data/speaking-forecast-full.json",
    "",
  ];

  for (const t of topics) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO forecast_topic (id, title, quarter, part, questions, status, created_at, updated_at) VALUES (${escapeSql(t.id)}, ${escapeSql(t.title)}, ${escapeSql(t.quarter)}, ${t.part}, ${escapeSql(t.questions)}, ${escapeSql(t.status)}, ${t.createdAt}, ${t.updatedAt});`,
    );
  }

  sqlStatements.push("");

  for (const s of sources) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO forecast_source (id, topic_id, source_type, source_url, raw_content, created_at) VALUES (${escapeSql(s.id)}, ${escapeSql(s.topicId)}, ${escapeSql(s.sourceType)}, ${escapeSql(s.sourceUrl)}, ${escapeSql(s.rawContent)}, ${s.createdAt});`,
    );
  }

  const sql = sqlStatements.join("\n");
  return { topics, sources, sql };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { topics, sources, sql } = generateForecastSeed();
  writeFileSync(OUTPUT_SQL_PATH, sql, "utf-8");
  console.log(`Generated ${topics.length} topics and ${sources.length} sources.`);
  console.log(`Saved SQL seed to: ${OUTPUT_SQL_PATH}`);
}
