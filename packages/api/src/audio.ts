import type { Database } from "@vox-flow/db";
import { attempt, attemptAnswer } from "@vox-flow/db/schema";
import { eq } from "drizzle-orm";

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
] as const;

export type AllowedAudioMimeType = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];

export const QUESTION_KEY_RE = /^[a-zA-Z0-9_-]+$/;

const SAFE_FILENAME_RE = /^[a-zA-Z0-9_-]+(\.\d+)?\.(webm|mp4|ogg|wav|mp3)$/;

/**
 * Normalizes an incoming MIME type string by trimming whitespace,
 * converting to lowercase, stripping parameter suffixes (e.g. ";codecs=opus"),
 * and validating against ALLOWED_AUDIO_MIME_TYPES.
 *
 * Returns the normalized AllowedAudioMimeType or null if unsupported.
 */
export function normalizeMimeType(
  raw: string | null | undefined,
): AllowedAudioMimeType | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const clean = raw.split(";")[0]?.trim().toLowerCase();
  if (!clean) {
    return null;
  }
  if (ALLOWED_AUDIO_MIME_TYPES.includes(clean as AllowedAudioMimeType)) {
    return clean as AllowedAudioMimeType;
  }
  return null;
}

/**
 * Returns standard file extension for an allowed audio MIME type.
 */
export function getAudioExtension(mime: AllowedAudioMimeType): string {
  switch (mime) {
    case "audio/mp4":
      return "mp4";
    case "audio/ogg":
      return "ogg";
    case "audio/wav":
      return "wav";
    case "audio/mpeg":
      return "mp3";
    case "audio/webm":
    default:
      return "webm";
  }
}

/**
 * Constructs a server-controlled audio storage key with strict tenant hierarchy:
 * users/<userId>/attempts/<attemptId>/<questionKey>[.<generation>].<ext>
 *
 * `generation` (epoch ms, client-supplied) gets its own dot segment so concurrent
 * uploads of different generations never write the same object. `.` is not part of
 * QUESTION_KEY_RE, so a suffixed key can never collide with a legacy unsuffixed key.
 *
 * Throws an Error if questionKey fails QUESTION_KEY_RE.
 */
export function buildAudioKey(
  userId: string,
  attemptId: string,
  questionKey: string,
  mime: AllowedAudioMimeType,
  generation?: number,
): string {
  if (!QUESTION_KEY_RE.test(questionKey)) {
    throw new Error(`Invalid questionKey format: "${questionKey}"`);
  }
  const ext = getAudioExtension(mime);
  const stem = generation === undefined ? questionKey : `${questionKey}.${generation}`;
  return `users/${userId}/attempts/${attemptId}/${stem}.${ext}`;
}

/**
 * Validates whether an audio storage key strictly belongs to the given user and attempt.
 *
 * Defense-in-depth:
 * 1. Checks prefix with trailing slash to prevent prefix extension attacks (e.g. att_123 matching att_123_evil).
 * 2. Uses prefix slicing instead of dynamic RegExp to avoid ReDoS and regex metacharacter injection.
 * 3. Enforces that the remaining filename matches single-segment allowlist without path traversal or nested directories.
 */
export function isValidAudioKey(
  key: string | null | undefined,
  userId: string,
  attemptId: string,
): boolean {
  if (!key || typeof key !== "string" || !userId || !attemptId) {
    return false;
  }
  const prefix = `users/${userId}/attempts/${attemptId}/`;
  if (!key.startsWith(prefix)) {
    return false;
  }
  const filename = key.slice(prefix.length);
  return SAFE_FILENAME_RE.test(filename);
}

/**
 * Returns hardened response headers for audio delivery to prevent stored XSS,
 * MIME-sniffing, and clickjacking/framing risks.
 */
export function safeAudioResponseHeaders(
  mime: string | null | undefined,
): Record<string, string> {
  const normalized = normalizeMimeType(mime) ?? "audio/webm";
  return {
    "Content-Type": normalized,
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
}
export interface AudioStreamObject {
  range?: { offset?: number; length?: number; suffix?: number };
  size: number;
  body: unknown;
}

export type AudioStreamResult =
  | { status: 403; headers?: Record<string, string>; body: string }
  | { status: 404; headers?: Record<string, string>; body: string }
  | { status: 200 | 206; headers: Record<string, string>; body: unknown };

/**
 * Encapsulates the entire streaming decision:
 * 1. Checks tenant isolation with isValidAudioKey (rejects attacker keys with 403).
 * 2. Checks R2 object presence (returns 404 if missing).
 * 3. Applies safe headers (nosniff, inline, CSP sandbox, safe Content-Type).
 * 4. Resolves 206 range vs 200 full content with exact Content-Length.
 */
export function resolveAudioStreamResponse(params: {
  audioKey: string | null | undefined;
  mimeType: string | null | undefined;
  attemptOwnerId: string;
  attemptId: string;
  object: AudioStreamObject | null;
}): AudioStreamResult {
  if (!isValidAudioKey(params.audioKey, params.attemptOwnerId, params.attemptId)) {
    return { status: 403, body: "Forbidden" };
  }

  if (!params.object) {
    return { status: 404, body: "Audio not found" };
  }

  const safeHeaders = safeAudioResponseHeaders(params.mimeType);
  const headers: Record<string, string> = {
    ...safeHeaders,
    "Accept-Ranges": "bytes",
  };

  const { object } = params;
  if (object.range) {
    let offset: number | null = null;
    let length: number | null = null;

    if (typeof object.range.offset === "number" && typeof object.range.length === "number") {
      offset = object.range.offset;
      length = object.range.length;
    } else if (typeof object.range.offset === "number") {
      offset = object.range.offset;
      length = Math.max(0, object.size - offset);
    } else if (typeof object.range.suffix === "number") {
      length = Math.min(object.size, object.range.suffix);
      offset = Math.max(0, object.size - length);
    }

    if (offset !== null && length !== null && length > 0) {
      headers["Content-Range"] = `bytes ${offset}-${offset + length - 1}/${object.size}`;
      headers["Content-Length"] = String(length);
      return { status: 206, headers, body: object.body };
    }
  }

  headers["Content-Length"] = String(object.size);
  return { status: 200, headers, body: object.body };
}


export type AnswerAnomalyReason =
  | "invalid_audio_key_prefix"
  | "unsupported_mime_type";

/**
 * Classifies an attempt answer row to identify data anomalies or potential security tampering.
 */
export function classifyAnswerRow(row: {
  audioKey: string | null | undefined;
  mimeType: string | null | undefined;
  userId: string;
  attemptId: string;
}): AnswerAnomalyReason[] {
  const reasons: AnswerAnomalyReason[] = [];

  if (!isValidAudioKey(row.audioKey, row.userId, row.attemptId)) {
    reasons.push("invalid_audio_key_prefix");
  }

  if (!normalizeMimeType(row.mimeType)) {
    reasons.push("unsupported_mime_type");
  }

  return reasons;
}

export interface SuspiciousAnswerRecord {
  id: string;
  attemptId: string;
  userId: string;
  audioKey: string;
  mimeType: string;
  reasons: AnswerAnomalyReason[];
}

/**
 * Scans database for suspicious or malformed attempt_answer rows.
 * Read-only analysis tool for audit and incident triage.
 */
export async function findSuspiciousAnswers(
  db: Database,
): Promise<SuspiciousAnswerRecord[]> {
  const rows = await db
    .select({
      id: attemptAnswer.id,
      attemptId: attemptAnswer.attemptId,
      audioKey: attemptAnswer.audioKey,
      mimeType: attemptAnswer.mimeType,
      userId: attempt.userId,
    })
    .from(attemptAnswer)
    .innerJoin(attempt, eq(attemptAnswer.attemptId, attempt.id));

  const suspicious: SuspiciousAnswerRecord[] = [];

  for (const row of rows) {
    const reasons = classifyAnswerRow({
      audioKey: row.audioKey,
      mimeType: row.mimeType,
      userId: row.userId,
      attemptId: row.attemptId,
    });

    if (reasons.length > 0) {
      suspicious.push({
        id: row.id,
        attemptId: row.attemptId,
        userId: row.userId,
        audioKey: row.audioKey,
        mimeType: row.mimeType,
        reasons,
      });
    }
  }

  return suspicious;
}
