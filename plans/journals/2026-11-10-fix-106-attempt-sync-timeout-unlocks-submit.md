---
title: Fix 106 attempt sync timeout unlocks submit
date: 2026-11-10
summary: "Hung attempt.getActive/attempt.start (tRPC httpBatchLink, bare fetch, no timeout) kept attemptStatus pending forever, locking the submit button. Added a 15s UI-state timer in useExamSession bootstrap (no request abort, late id still lands via applyAttemptId while mounted); .finally+cleanup clear, pending-only guard. TDD: 2 red tests (TestingLibraryElementError at unlock step) then green; probe test for early-settle invariant; getActive-hung variant per review. Full web suite 297/297, check-types 7/7, 2 independent reviewers APPROVE. Beta ship to dev for #106."
---

# Fix 106 attempt sync timeout unlocks submit

Hung attempt.getActive/attempt.start (tRPC httpBatchLink, bare fetch, no timeout) kept attemptStatus pending forever, locking the submit button. Added a 15s UI-state timer in useExamSession bootstrap (no request abort, late id still lands via applyAttemptId while mounted); .finally+cleanup clear, pending-only guard. TDD: 2 red tests (TestingLibraryElementError at unlock step) then green; probe test for early-settle invariant; getActive-hung variant per review. Full web suite 297/297, check-types 7/7, 2 independent reviewers APPROVE. Beta ship to dev for #106.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
