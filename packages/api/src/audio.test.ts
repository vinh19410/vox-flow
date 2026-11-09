import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { attempt, attemptAnswer, user } from "@vox-flow/db/schema";
import { describe, expect, it } from "vitest";
import type { Database } from "@vox-flow/db";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  buildAudioKey,
  classifyAnswerRow,
  findSuspiciousAnswers,
  getAudioExtension,
  isValidAudioKey,
  normalizeMimeType,
  QUESTION_KEY_RE,
  resolveAudioStreamResponse,
  safeAudioResponseHeaders,
} from "./audio";
import { createTestDb } from "./test/db";

describe("audio security module", () => {
  describe("ALLOWED_AUDIO_MIME_TYPES and normalizeMimeType", () => {
    it("contains exactly expected audio MIME types", () => {
      expect(ALLOWED_AUDIO_MIME_TYPES).toEqual([
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
        "audio/mpeg",
      ]);
    });

    it("accepts valid mime types and strips extra parameters like codecs", () => {
      expect(normalizeMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
      expect(normalizeMimeType("AUDIO/MP4 ; codecs=mp4a.40.2")).toBe("audio/mp4");
      expect(normalizeMimeType(" audio/ogg ")).toBe("audio/ogg");
      expect(normalizeMimeType("audio/wav")).toBe("audio/wav");
      expect(normalizeMimeType("audio/mpeg")).toBe("audio/mpeg");
    });

    it("rejects dangerous or unsupported mime types with null", () => {
      expect(normalizeMimeType("text/html")).toBeNull();
      expect(normalizeMimeType("text/html; charset=utf-8")).toBeNull();
      expect(normalizeMimeType("application/javascript")).toBeNull();
      expect(normalizeMimeType("image/svg+xml")).toBeNull();
      expect(normalizeMimeType("application/octet-stream")).toBeNull();
      expect(normalizeMimeType("video/mp4")).toBeNull();
      expect(normalizeMimeType("")).toBeNull();
      expect(normalizeMimeType(null)).toBeNull();
      expect(normalizeMimeType(undefined)).toBeNull();
    });
  });

  describe("getAudioExtension", () => {
    it("maps mime types to proper file extensions", () => {
      expect(getAudioExtension("audio/webm")).toBe("webm");
      expect(getAudioExtension("audio/mp4")).toBe("mp4");
      expect(getAudioExtension("audio/ogg")).toBe("ogg");
      expect(getAudioExtension("audio/wav")).toBe("wav");
      expect(getAudioExtension("audio/mpeg")).toBe("mp3");
    });
  });

  describe("QUESTION_KEY_RE and buildAudioKey", () => {
    it("validates question key format strictly", () => {
      expect(QUESTION_KEY_RE.test("p1-1")).toBe(true);
      expect(QUESTION_KEY_RE.test("p2_q1")).toBe(true);
      expect(QUESTION_KEY_RE.test("question123")).toBe(true);
      expect(QUESTION_KEY_RE.test("../malicious")).toBe(false);
      expect(QUESTION_KEY_RE.test("part1/q1")).toBe(false);
      expect(QUESTION_KEY_RE.test("q 1")).toBe(false);
      expect(QUESTION_KEY_RE.test("q?test=1")).toBe(false);
    });

    it("builds server-controlled audio key with correct hierarchy", () => {
      const key = buildAudioKey("user-123", "att-456", "p1-1", "audio/webm");
      expect(key).toBe("users/user-123/attempts/att-456/p1-1.webm");

      const mp4Key = buildAudioKey("user-123", "att-456", "p2-1", "audio/mp4");
      expect(mp4Key).toBe("users/user-123/attempts/att-456/p2-1.mp4");
    });

    it("throws an error when questionKey contains invalid characters or traversal", () => {
      expect(() =>
        buildAudioKey("user-123", "att-456", "../evil", "audio/webm"),
      ).toThrow("Invalid questionKey format");

      expect(() =>
        buildAudioKey("user-123", "att-456", "sub/folder", "audio/webm"),
      ).toThrow("Invalid questionKey format");
    });
  });

  describe("isValidAudioKey", () => {
    const userId = "usr_abc123";
    const attemptId = "att_xyz789";

    it("accepts valid keys matching owner and attempt prefix with allowed extension", () => {
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/p1-1.webm`, userId, attemptId)).toBe(true);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/p2_q1.mp4`, userId, attemptId)).toBe(true);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/q1.ogg`, userId, attemptId)).toBe(true);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/q2.wav`, userId, attemptId)).toBe(true);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/q3.mp3`, userId, attemptId)).toBe(true);
    });

    it("rejects keys belonging to another user or attempt", () => {
      expect(isValidAudioKey(`users/other-user/attempts/${attemptId}/p1-1.webm`, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/${userId}/attempts/other-attempt/p1-1.webm`, userId, attemptId)).toBe(false);
    });

    it("prevents prefix extension collision attacks (attempts/<id>extra/)", () => {
      // trailing slash check prevents att_xyz789 matching att_xyz789_extra
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}_extra/p1-1.webm`, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/${userId}_other/attempts/${attemptId}/p1-1.webm`, userId, attemptId)).toBe(false);
    });

    it("rejects directory traversal and nested subdirectories in filename", () => {
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/../victim/p1-1.webm`, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/sub/p1-1.webm`, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/p1/..`, userId, attemptId)).toBe(false);
    });

    it("rejects disallowed file extensions or missing filenames", () => {
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/file.html`, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/file.exe`, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/.webm`, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/${userId}/attempts/${attemptId}/p1-1`, userId, attemptId)).toBe(false);
    });

    it("handles null, undefined, empty strings, and regex-metacharacter IDs safely", () => {
      expect(isValidAudioKey(null, userId, attemptId)).toBe(false);
      expect(isValidAudioKey(undefined, userId, attemptId)).toBe(false);
      expect(isValidAudioKey("", userId, attemptId)).toBe(false);

      // Metacharacter safety: dot in userId shouldn't match arbitrary character
      const dottedUser = "user.name";
      expect(isValidAudioKey(`users/user-name/attempts/${attemptId}/p1.webm`, dottedUser, attemptId)).toBe(false);
      expect(isValidAudioKey(`users/user.name/attempts/${attemptId}/p1.webm`, dottedUser, attemptId)).toBe(true);
    });
  });

  describe("safeAudioResponseHeaders", () => {
    it("returns nosniff, inline disposition, and CSP sandbox for valid mime type", () => {
      const headers = safeAudioResponseHeaders("audio/webm;codecs=opus");
      expect(headers).toEqual({
        "Content-Type": "audio/webm",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      });
    });

    it("falls back to audio/webm Content-Type when given invalid or missing mime type", () => {
      const headersInvalid = safeAudioResponseHeaders("text/html");
      expect(headersInvalid["Content-Type"]).toBe("audio/webm");
      expect(headersInvalid["X-Content-Type-Options"]).toBe("nosniff");

      const headersNull = safeAudioResponseHeaders(null);
      expect(headersNull["Content-Type"]).toBe("audio/webm");
      expect(headersNull["X-Content-Type-Options"]).toBe("nosniff");
    });
  });

  describe("classifyAnswerRow", () => {
    it("returns empty array for completely valid rows", () => {
      const reasons = classifyAnswerRow({
        userId: "u1",
        attemptId: "att1",
        audioKey: "users/u1/attempts/att1/q1.webm",
        mimeType: "audio/webm",
      });
      expect(reasons).toHaveLength(0);
    });

    it("detects invalid audioKey prefix or format", () => {
      const reasons = classifyAnswerRow({
        userId: "u1",
        attemptId: "att1",
        audioKey: "users/u2/attempts/att1/q1.webm",
        mimeType: "audio/webm",
      });
      expect(reasons).toContain("invalid_audio_key_prefix");
    });

    it("detects invalid or untrusted mimeType", () => {
      const reasons = classifyAnswerRow({
        userId: "u1",
        attemptId: "att1",
        audioKey: "users/u1/attempts/att1/q1.webm",
        mimeType: "text/html",
      });
      expect(reasons).toContain("unsupported_mime_type");
    });

    it("detects multiple issues simultaneously", () => {
      const reasons = classifyAnswerRow({
        userId: "u1",
        attemptId: "att1",
        audioKey: "arbitrary-path/audio.html",
        mimeType: "text/html",
      });
      expect(reasons).toEqual(expect.arrayContaining(["invalid_audio_key_prefix", "unsupported_mime_type"]));
    });
  });

  describe("findSuspiciousAnswers", () => {
    it("scans database join and collects all flagged answer rows with reasons", async () => {
      const mockRows = [
        {
          id: "ans_ok",
          attemptId: "att_1",
          userId: "usr_1",
          audioKey: "users/usr_1/attempts/att_1/q1.webm",
          mimeType: "audio/webm",
        },
        {
          id: "ans_bad_prefix",
          attemptId: "att_1",
          userId: "usr_1",
          audioKey: "users/usr_victim/attempts/att_victim/q1.webm",
          mimeType: "audio/webm",
        },
        {
          id: "ans_bad_mime",
          attemptId: "att_2",
          userId: "usr_2",
          audioKey: "users/usr_2/attempts/att_2/q1.webm",
          mimeType: "text/html",
        },
      ];

      const mockDb = {
        select: () => ({
          from: () => ({
            innerJoin: () => Promise.resolve(mockRows),
          }),
        }),
      } as unknown as Database;

      const suspicious = await findSuspiciousAnswers(mockDb);
      expect(suspicious).toHaveLength(2);
      expect(suspicious[0]?.id).toBe("ans_bad_prefix");
      expect(suspicious[0]?.reasons).toContain("invalid_audio_key_prefix");
      expect(suspicious[1]?.id).toBe("ans_bad_mime");
      expect(suspicious[1]?.reasons).toContain("unsupported_mime_type");
    });
  });

  describe("resolveAudioStreamResponse (GET audio route logic)", () => {
    const attemptOwnerId = "usr_owner";
    const attemptId = "att_123";
    const validKey = `users/${attemptOwnerId}/attempts/${attemptId}/q1.webm`;
    const attackerKey = `users/usr_victim/attempts/att_victim/q1.webm`;

    it("rejects attacker-supplied audioKey with 403 Forbidden", () => {
      const res = resolveAudioStreamResponse({
        audioKey: attackerKey,
        mimeType: "audio/webm",
        attemptOwnerId,
        attemptId,
        object: { size: 1024, body: "stream-body" },
      });
      expect(res.status).toBe(403);
      if (res.status === 403) {
        expect(res.body).toBe("Forbidden");
      }
    });
    it("rejects path traversal in audioKey with 403 Forbidden", () => {
      const res = resolveAudioStreamResponse({
        audioKey: `users/${attemptOwnerId}/attempts/${attemptId}/../evil.webm`,
        mimeType: "audio/webm",
        attemptOwnerId,
        attemptId,
        object: { size: 1024, body: "stream-body" },
      });
      expect(res.status).toBe(403);
    });

    it("returns 404 when object is not found in R2", () => {
      const res = resolveAudioStreamResponse({
        audioKey: validKey,
        mimeType: "audio/webm",
        attemptOwnerId,
        attemptId,
        object: null,
      });
      expect(res.status).toBe(404);
      if (res.status === 404) {
        expect(res.body).toBe("Audio not found");
      }
    });
    it("returns 200 with all safe security headers and Content-Length on full response", () => {
      const res = resolveAudioStreamResponse({
        audioKey: validKey,
        mimeType: "audio/webm;codecs=opus",
        attemptOwnerId,
        attemptId,
        object: { size: 2048, body: "full-stream-payload" },
      });
      expect(res.status).toBe(200);
      if (res.status === 200) {
        expect(res.headers["Content-Type"]).toBe("audio/webm");
        expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
        expect(res.headers["Content-Disposition"]).toBe("inline");
        expect(res.headers["Content-Security-Policy"]).toBe("default-src 'none'; sandbox");
        expect(res.headers["Accept-Ranges"]).toBe("bytes");
        expect(res.headers["Content-Length"]).toBe("2048");
        expect(res.body).toBe("full-stream-payload");
      }
    });
    it("returns 206 with Content-Range and Content-Length matching chunk length on range request", () => {
      const res = resolveAudioStreamResponse({
        audioKey: validKey,
        mimeType: "audio/mp4",
        attemptOwnerId,
        attemptId,
        object: {
          range: { offset: 100, length: 500 },
          size: 2048,
          body: "range-chunk",
        },
      });
      expect(res.status).toBe(206);
      if (res.status === 206) {
        expect(res.headers["Content-Type"]).toBe("audio/mp4");
        expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
        expect(res.headers["Content-Disposition"]).toBe("inline");
        expect(res.headers["Content-Security-Policy"]).toBe("default-src 'none'; sandbox");
        expect(res.headers["Accept-Ranges"]).toBe("bytes");
        expect(res.headers["Content-Range"]).toBe("bytes 100-599/2048");
        expect(res.headers["Content-Length"]).toBe("500");
        expect(res.body).toBe("range-chunk");
      }
    });
    it("supports open-ended range requests (bytes=100-)", () => {
      const res = resolveAudioStreamResponse({
        audioKey: validKey,
        mimeType: "audio/webm",
        attemptOwnerId,
        attemptId,
        object: {
          range: { offset: 100 },
          size: 1000,
          body: "open-ended-chunk",
        },
      });
      expect(res.status).toBe(206);
      if (res.status === 206) {
        expect(res.headers["Content-Range"]).toBe("bytes 100-999/1000");
        expect(res.headers["Content-Length"]).toBe("900");
      }
    });

    it("supports suffix range requests (bytes=-300)", () => {
      const res = resolveAudioStreamResponse({
        audioKey: validKey,
        mimeType: "audio/webm",
        attemptOwnerId,
        attemptId,
        object: {
          range: { suffix: 300 },
          size: 1000,
          body: "suffix-chunk",
        },
      });
      expect(res.status).toBe(206);
      if (res.status === 206) {
        expect(res.headers["Content-Range"]).toBe("bytes 700-999/1000");
        expect(res.headers["Content-Length"]).toBe("300");
      }
    });
  });

  describe("Real D1 Integration: findSuspiciousAnswers & audit SQL script", () => {
    it("executes findSuspiciousAnswers and scripts/audit-attempt-answers.sql on real D1 SQLite instance", async () => {
      const testCtx = await createTestDb();
      try {
        const userId1 = "usr_d1_audit_1";
        const userId2 = "usr_d1_audit_2";
        const attId1 = "att_d1_1";
        const attId2 = "att_d1_2";

        // Seed users & attempts
        await testCtx.db.insert(user).values([
          { id: userId1, name: "User 1", email: "u1@example.com" },
          { id: userId2, name: "User 2", email: "u2@example.com" },
        ]);
        await testCtx.db.insert(attempt).values([
          { id: attId1, userId: userId1, mode: "full", status: "submitted" },
          { id: attId2, userId: userId2, mode: "full", status: "submitted" },
        ]);

        // Seed 1 legitimate answer + 3 anomalous answers
        await testCtx.db.insert(attemptAnswer).values([
          {
            id: "ans_d1_valid",
            attemptId: attId1,
            questionKey: "p1-1",
            questionText: "Valid Q",
            partNumber: 1,
            orderIndex: 0,
            audioKey: `users/${userId1}/attempts/${attId1}/p1-1.webm`,
            durationMs: 10000,
            mimeType: "audio/webm",
          },
          {
            id: "ans_d1_mismatched_user",
            attemptId: attId1,
            questionKey: "p1-2",
            questionText: "Mismatched User Q",
            partNumber: 1,
            orderIndex: 1,
            audioKey: `users/${userId2}/attempts/${attId2}/victim.webm`,
            durationMs: 12000,
            mimeType: "audio/webm",
          },
          {
            id: "ans_d1_bad_mime",
            attemptId: attId2,
            questionKey: "p2-1",
            questionText: "XSS Mime Q",
            partNumber: 2,
            orderIndex: 0,
            audioKey: `users/${userId2}/attempts/${attId2}/p2-1.webm`,
            durationMs: 15000,
            mimeType: "text/html",
          },
          {
            id: "ans_d1_traversal",
            attemptId: attId1,
            questionKey: "p1-3",
            questionText: "Traversal Q",
            partNumber: 1,
            orderIndex: 2,
            audioKey: `users/${userId1}/attempts/${attId1}/../traversal.webm`,
            durationMs: 9000,
            mimeType: "audio/webm",
          },
        ]);

        // 1. Verify findSuspiciousAnswers on real D1
        const suspicious = await findSuspiciousAnswers(testCtx.db);
        expect(suspicious).toHaveLength(3);
        const flaggedIds = suspicious.map((s) => s.id);
        expect(flaggedIds).toContain("ans_d1_mismatched_user");
        expect(flaggedIds).toContain("ans_d1_bad_mime");
        expect(flaggedIds).toContain("ans_d1_traversal");
        expect(flaggedIds).not.toContain("ans_d1_valid");

        // 2. Verify scripts/audit-attempt-answers.sql on real D1
        const sqlPath = existsSync(join(process.cwd(), "scripts/audit-attempt-answers.sql"))
          ? join(process.cwd(), "scripts/audit-attempt-answers.sql")
          : join(process.cwd(), "../../scripts/audit-attempt-answers.sql");
        const sqlRaw = readFileSync(sqlPath, "utf-8");
        // Extract SELECT statement (skip leading comments)
        const selectSql = sqlRaw.slice(sqlRaw.indexOf("SELECT"));
        interface AuditRow {
          answer_id: string;
        }
        const sqlResult = await testCtx.d1.prepare(selectSql).all<AuditRow>();
        expect(sqlResult.results).toHaveLength(3);
        const sqlResultIds = sqlResult.results.map((r) => r.answer_id);
        expect(sqlResultIds).toContain("ans_d1_mismatched_user");
        expect(sqlResultIds).toContain("ans_d1_bad_mime");
        expect(sqlResultIds).toContain("ans_d1_traversal");
        expect(sqlResultIds).not.toContain("ans_d1_valid");
      } finally {
        await testCtx.dispose();
      }
    });
  });
});
