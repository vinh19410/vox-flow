---
title: "Hardening scoring limits (#91)"
date: 2026-11-10
---

# Hardening scoring limits (#91)

Issue #91 hardens the forecast scoring pipeline before user expansion.

Plan: plans/261110-1015-wi91-hardening-scoring-limits (validated 16/16, red-teamed 3 lenses, 2 Kongming gate reviews, ultra code review union 15/18 findings, 0 Critical/0 High after fixes).

What changed:
- packages/api/src/scoring/forecast-keys.ts: single source of truth for topic question keys (P1 `${id}-i`, cue `-c`, p3 `-p3-i`, follow-up `-f`, single-question). Web mapper consumes it; parity test over both seed files.
- D1 migration: attempt_answer.size_bytes, attempt_score.manual_retries, scoring_retry_log (user+VN-day index), data-registry entries.
- Upload route: topic-aware keys, caps (2/18/20), upsert-aware 35MB, fail-closed R2 size with orphan delete.
- attempt.submit + scoring consumer share answer-limits guard (closes the post-snapshot upload race found in review).
- score-attempt: sequential transcription, 240s budget, per-clip persistence, lease math documented (660s worst case < 720s lease).
- scoring.retry: reserve-first atomic batch (daily 3/day UTC+7 + per-attempt 1), rescue exempt, clock injectable; web hook no longer auto-retries failed attempts; screen distinguishes per-attempt vs daily exhaustion.

Gotchas:
- Drizzle 1.0.0-rc.5 has no .where on insert().values() — guard must be insert().select(sql) with columns in schema order.
- Do not touch attempt_score.updatedAt: lease release matches updatedAt === claimedAt.
- Cloudflare Worker 128MB: sequential loop keeps RAM bounded; do not reintroduce Promise.allSettled over R2 audio.
- Local full-suite runs flake at vitest 5s default (~80ms/query Miniflare on this box); CI is ~2x faster. Per-test 30s timeout added for the #92-heavy data-registry test.

Next: beta PR review/merge + CI convergence (vibe --ship --beta).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
