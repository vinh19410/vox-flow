# Research: Cloudflare Queues Consumer Semantics & Prompt-Injection Mitigations for LLM Grading

- **Conducted:** 2026-11-10
- **Scope:** Feeds the Vox Flow scoring-queue implementation plan (`packages/infra/alchemy.run.ts`, `apps/server/src/queue.ts`).
- **Version pins:** `@alchemy.run/cloudflare` + `alchemy` **2.0.0-beta.85** (installed, types verified locally); Cloudflare Queues docs retrieved 2026-11-10 (pages dated Apr–Oct 2026); wrangler-specific notes marked inline.

## TL;DR — Ranked recommendations

1. **Declare consumer settings in Alchemy as** `settings: { batchSize, maxConcurrency, maxRetries, maxWaitTimeMs, retryDelay }` and a **top-level** `deadLetterQueue` (queue *name*) on `Cloudflare.Queues.Consumer`. Today the stack declares retries only, so after 3 retries a message is **deleted permanently**; without a DLQ the only safety nets are the consumer's terminal-delivery `markScoreFailed` and the 5-minute cron sweep.
2. **Cap `maxConcurrency` deliberately** (e.g. 4–8). Unset = autoscale to 250 concurrent invocations per queue, i.e. up to 250 simultaneous LLM grading calls against one provider key. Cloudflare recommends leaving it unset *unless* limited by an upstream system — an LLM rate limit is exactly that case.
3. **Treat the server-side question bank as the source of truth** for grading: ignore client-supplied `questionText` as prompt content (or use it only for comparison), fetch the question from D1 by `attemptId`. This removes the primary injection channel instead of trying to detect injections.
4. **Layer bounded structured output + deterministic post-checks as detective controls, not the primary defense**: zod-validated band schema (0–9, half bands), per-criterion bounds, cross-run consistency over `SCORING_RUNS`, flag outliers for human review. Consensus across OWASP/Willison: no fool-proof prevention; AI-based anomaly detection alone is "tried and found lacking."
5. **Spotlight the transcript** (delimit + datamark + explicit "data, never instructions" system instruction). Measured effect is large (attack success >50% → <2% in lab conditions) but it is a hardening layer, not a boundary.

---

## Q1. `max_retries` — which side, and what happens when retries run out

**`max_retries` is a consumer setting.** Producers have no retry knob at all — the producer config in wrangler is only `queue` + `binding`, and queue-level settings are only delivery delay and retention ([Configure Queues](https://developers.cloudflare.com/queues/configuration/configure-queues/)). "Producer `maxRetries`" (as the ticket phrased it) does not exist; in the repo, `settings.maxRetries: 3` sits on the `Cloudflare.Queues.Consumer` resource — it *is* the consumer's retry budget. Queue-level: `--delivery-delay-secs` (0–86400 s) and `--message-retention-period-secs` (60 s–14 d, default 4 d).

Semantics ([Batching, Retries and Delays](https://developers.cloudflare.com/queues/configuration/batching-retries/), [Limits](https://developers.cloudflare.com/queues/platform/limits/)):

- Default 3, hard max 100 retries. Each retry bills an extra read operation.
- Applies when a handler throws/returns non-void, or `retry()`/`retryAll()` is called. Explicit `ack()` wins over later `retry()` (first call wins).
- `attempts` on the message counts deliveries; at the configured maximum the message is **not redelivered and is deleted permanently**.

**After retries are exhausted:** the message is deleted, *unless* a DLQ is configured — `dead_letter_queue` is a **consumer** option (name of another queue). DLQ facts ([Dead Letter Queues](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)): optional; a nonexistent named queue is auto-created; must share the source queue's jurisdiction; a DLQ needs its own consumer or messages sit there until retention (default 4 days) expires. So the default answer to "DLQ required?" is **no — and by default the job is lost**.

Vox Flow nuance: the consumer currently `ack()`s on the final delivery after `markScoreFailed`, which is a sound app-level terminal path. The residual gap is *infra-level* loss: if the isolate crashes mid-handler (no ack, no bookkeeping) the message eventually exhausts retries and vanishes with no record. A DLQ consumer (or keeping the cron sweep as the compensator) closes that gap.

## Q2. `max_concurrency` semantics, cost, and the visibility-timeout question

([Consumer concurrency](https://developers.cloudflare.com/queues/configuration/consumer-concurrency/), [Limits](https://developers.cloudflare.com/queues/platform/limits/), [Changelog](https://developers.cloudflare.com/queues/platform/changelog/))

- **Unset default: concurrency is enabled by default** and autoscales "to the maximum concurrent invocations" — **250 per queue** (push-based only; raised 20 → 250 at Queues GA, 2024-09-26). The dashboard exposes a fixed value of 1–250 or "auto (recommended)".
- **`max_concurrency: 1`** serializes processing and disables autoscaling ("Why are my consumers not autoscaling?"). There is **no documented `0` semantic in current docs** — uncapping means *removing* the setting; treat `0` as invalid.
- **Cost:** overall cost to drain a queue is unchanged by concurrency (Workers standard per-invocation billing); concurrency only moves cost earlier in time. Retries add read ops. What concurrency changes is **burst shape**: with `batchSize: 1`, `max_concurrency` ≈ max simultaneous LLM requests, which is the number your provider key's rate limit must absorb. Scale-down triggers on uncaught handler errors; explicit `retry()` does **not** count as a failure (change of 2024-02-24), so retry backpressure won't descale consumers.
- **`visibility_timeout_ms` does not apply to push consumers.** It exists only in the **pull-consumer** HTTP API (`/messages/pull` body; default 30 s, max 12 h — unacked leases expire and redeliver). Push consumers have no per-message visibility knob; the delivery unit is the invocation itself, bounded by **15 minutes wall clock** (CPU time default 30 s, raisable to 5 min via `limits.cpu_ms`; I/O wait such as LLM latency does not consume CPU budget). A hung invocation hits the 15-min wall clock and the message is treated as failed → retried. At-least-once delivery means duplicate grading is possible after a crash — the consumer must stay idempotent (keying writes on `attemptId`, as the code does, is the right pattern).
- For upstream 429s, Cloudflare's documented backpressure pattern is `retry({ delaySeconds })` (up to 24 h) rather than erroring.

Version-sensitive: configuring `max_concurrency` in a wrangler file requires wrangler ≥ 2.13.0 (Alchemy deploys via API, so this applies only to raw-wrangler workflows); delay-on-retry options need wrangler ≥ 3.38.0.

## Q3. Alchemy `Queue` resource API (verified against installed 2.0.0-beta.85)

Verified from the installed package source (`packages/infra/node_modules/@alchemy.run/cloudflare/src/Queues/{Queue,Consumer}.ts`) and cross-checked against the [API reference](https://alchemy.run/providers/cloudflare/queues) and [Queues guide](https://alchemy.run/cloudflare/messaging/queues):

- `Cloudflare.Queues.Queue(id, props?)` — `name?`, `jurisdiction?` (create-only; mismatch = error), `messageRetentionPeriod?` (seconds), `deliveryDelay?` (seconds), `deliveryPaused?`. **No retry/DLQ props at queue level** — matches Cloudflare semantics.
- `Cloudflare.Queues.Consumer(id, props)`:
  - `queueId`, `scriptName` (required); **one Worker consumer per queue** (Cloudflare constraint; Alchemy fails the deploy rather than silently adopting a foreign consumer).
  - `deadLetterQueue?: string` — **top-level**, takes a queue *name* (`.queueName` of a resource, a raw string, or `Queue.ref(...)` for cross-stack). Not inside `settings`.
  - `settings?: { batchSize?, maxConcurrency?, maxRetries? (default 3), maxWaitTimeMs? (default 5000, milliseconds), retryDelay? (seconds) }` — **`maxConcurrency` is supported**. Names map 1:1 to the Cloudflare API's camelCase JSON (`max_batch_size` → `batchSize`, `max_batch_timeout` → `maxWaitTimeMs`).
- `Cloudflare.Queues.consumeQueueMessages(queue, settings, handler)` is the alternative one-call wiring (same setting names, plus Duration-typed `maxWaitTime`/`retryDelay`); the repo's explicit `Consumer` resource is equivalent.
- **Breaking-change history:** v1 (`alchemy/cloudflare`, async/await, `await QueueConsumer(...)`) → v2 split providers into `@alchemy.run/cloudflare`, moved to Effect generators and `Cloudflare.Queues.*` namespaces; the [migration guide](https://alchemy.run/migrating-from-v1) documents the package/Stack/name changes. The setting renames above are the v2 names; anything quoting v1 property names (e.g. `maxBatchTimeout`) is stale. **Risk flag:** beta.85 is pre-GA; the docs site currently matches the installed types, but pin the exact beta and expect possible property renames before 2.0 stable.

## Q4. Prompt injection: untrusted transcript + client-supplied question text in a grading prompt

Threat model per [OWASP LLM01:2025](https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/blob/main/2_0_vulns/LLM01_PromptInjection.md) (still LLM01 in the [2026 edition](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)): prompt injection "can lead to … manipulating critical decision-making processes"; ASR'd speech and client JSON are both attacker-controllable input surfaces; the score is the manipulated decision. OWASP is explicit that prevention is not fool-proof and that RAG/fine-tuning don't fully mitigate.

**Ranked mitigations for this pipeline:**

1. **Server-side question bank as source of truth (architectural, do this first).** OWASP prevention #4/#6: least privilege and segregate/identify untrusted content. The client's `questionText` should never enter the grading prompt as authoritative; grade against the question fetched from D1 by `attemptId`. This eliminates the strongest channel outright instead of detecting abuse. (OWASP scenario #6 — payload-splitting a resume to flip an LLM evaluator's recommendation — is the published analog of exactly this attack on a grader.)
2. **Schema-bounded output + deterministic post-checks (detective, cheap, necessary-but-insufficient).** OWASP prevention #2: define and validate expected output formats *in code*. Constrain the response to a zod schema (band 0–9, half-band steps, four criteria, evidence fields); reject and re-run on violation. Score-limits/anomaly checks (e.g., band 9 with a 12-word transcript, cross-criterion incoherence, cross-run disagreement over `SCORING_RUNS: 3`) reliably catch *naive* inflation but a determined attacker can emit in-range, coherent text — so wire them to **flag for human review/dispute** (the existing `SCORE_DISPUTE_ENABLED` path), not to a "security" verdict.
3. **Spotlighting + instruction hierarchy for the transcript.** [Spotlighting (Hines et al., Microsoft, 2024)](https://arxiv.org/abs/2403.14720): delimiting/datamarking untrusted input cut attack success from >50% to <2% on GPT-family models with minimal task impact — lab numbers, but the best-evidenced prompt-side control. [The Instruction Hierarchy (OpenAI, 2024)](https://arxiv.org/abs/2404.13208): system/developer instructions outrank transcript "data" in models trained on the hierarchy. Counterweight: [delimiters alone won't save you](https://simonwillison.net/2023/May/11/delimiters-wont-save-you/) — use them layered, never as the boundary.
4. **Quarantined-grader shape (already mostly true here).** [Dual LLM pattern (Willison)](https://simonwillison.net/2023/Apr/25/dual-llm-pattern/): an LLM consuming untrusted content is safe if it has no tools/exfiltration surface *and* its output is verifiable — "classifying text into a fixed set of categories we can validate … before passing that on." A grading call that takes transcript text and returns only schema-validated JSON to the server is exactly that pattern; keep the grader tool-less and never feed grader output into another privileged prompt unvalidated.
5. **Not worth it now:** CaMeL-style provable control/data-flow separation ([Defeating Prompt Injections by Design, DeepMind 2025](https://arxiv.org/abs/2503.18813); 77% vs 84% task completion on AgentDojo) targets agentic tool systems; a single-shot tool-less grader doesn't need it. Keep as a reference if the pipeline ever gains tools/agentic steps.

No IELTS/essay-scoring-specific hardening standard exists in the sources surveyed; closest are OWASP's evaluator-manipulation scenario and general LLM-as-judge adversarial literature (survey attempts via arXiv/Semantic Scholar were rate-limited today — see limitations).

## Sources

| Claim area | Source |
| --- | --- |
| Consumer options, `max_retries` default 3, deletion after exhaustion | https://developers.cloudflare.com/queues/configuration/configure-queues/ · https://developers.cloudflare.com/queues/configuration/batching-retries/ |
| DLQ semantics, jurisdiction, 4-day retention | https://developers.cloudflare.com/queues/configuration/dead-letter-queues/ |
| Concurrency default/auto, 1 = no autoscale, billing, retry-not-failure | https://developers.cloudflare.com/queues/configuration/consumer-concurrency/ · https://developers.cloudflare.com/queues/platform/changelog/ |
| Limits: 250 concurrent, 100 retries, 15-min wall clock, CPU 30 s→5 min, visibility timeout pull-only (12 h) | https://developers.cloudflare.com/queues/platform/limits/ |
| Pull consumer `visibility_timeout` default 30 s, `attempts` deletion | https://developers.cloudflare.com/queues/configuration/pull-consumers/ |
| Wrangler config field list (no `visibility_timeout_ms` on push consumers) | https://developers.cloudflare.com/workers/wrangler/configuration/ |
| Alchemy v2 Queue/Consumer props, `deadLetterQueue` top-level, one-consumer rule | https://alchemy.run/providers/cloudflare/queues · https://alchemy.run/cloudflare/messaging/queues · installed `2.0.0-beta.85` `src/Queues/{Queue,Consumer}.ts` |
| Alchemy v1→v2 migration | https://alchemy.run/migrating-from-v1 |
| OWASP LLM01 prevention strategies, evaluator scenario #6 | https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/blob/main/2_0_vulns/LLM01_PromptInjection.md · https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/ |
| Spotlighting effectiveness | https://arxiv.org/abs/2403.14720 |
| Instruction hierarchy | https://arxiv.org/abs/2404.13208 |
| Dual LLM / delimiters skepticism / quarantined-verifiable-output | https://simonwillison.net/2023/Apr/25/dual-llm-pattern/ · https://simonwillison.net/2023/May/11/delimiters-wont-save-you/ |
| CaMeL | https://arxiv.org/abs/2503.18813 |

## Limitations & unresolved questions

- **Academic-survey gap:** arXiv API and Semantic Scholar rate-limited during this session; I could not retrieve IELTS/AES-specific adversarial-attack papers. The grader-hardening guidance rests on OWASP + Microsoft/OpenAI/DeepMind sources, not on AES literature. If the plan needs citations specific to essay-scoring attacks, retry the arXiv query (`"automated essay scoring" AND "prompt injection"`) later.
- **Alchemy beta drift:** all Alchemy property names are verified against 2.0.0-beta.85; if the plan bumps the version, re-verify `Consumer.settings`/`deadLetterQueue` against that build's types.
- **Unresolved decision (owner input needed):** whether a DLQ + DLQ consumer is wanted, or whether the existing cron sweep + terminal `markScoreFailed` is accepted as the loss-compensation story; and the concrete `maxConcurrency` number, which depends on the LLM provider's per-key rate limit.
