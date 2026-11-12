#!/usr/bin/env node
/**
 * Unit & fixture tests for .agents/scripts/bruno-runner.mjs
 * Run: node .agents/scripts/__tests__/bruno-runner.test.mjs
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  classifyBrunoReport,
  formatAssertLine,
  generateCollection,
  parseApiTestsMarkdown,
  slugifyFeatureEnvVar,
  writeBackResults,
} from "../bruno-runner.mjs";

// 1. Feature env var slugification
assert.equal(slugifyFeatureEnvVar("auth-account"), "AUTH_ACCOUNT_BASE");
assert.equal(slugifyFeatureEnvVar("authentication"), "AUTHENTICATION_BASE");

// 2. Assert expression formatting
assert.equal(formatAssertLine("result.data=OK"), "res.body.result.data: eq OK");
assert.equal(
  formatAssertLine("code^=USER_ALREADY_EXISTS"),
  "res.body.code: startsWith USER_ALREADY_EXISTS",
);
assert.equal(
  formatAssertLine("url*=redirect_uri="),
  "res.body.url: contains redirect_uri=",
);
assert.equal(formatAssertLine("$body=null"), "res.body: isNull");
assert.equal(formatAssertLine("token=isString"), "res.body.token: isString");
assert.equal(
  formatAssertLine("header.set-cookie*=session_token="),
  "res.headers['set-cookie']: contains session_token=",
);

// 3. Own-API Markdown parse + collection generation + Auto=No skip + no top-level # comments
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bruno-runner-test-"));
try {
  const sampleMd = `---
type: api-tests
feature: auth-account
status: draft
---

# API Tests

<!-- TC:START -->
| TC | Auth | Method | Path | Headers | Body | HTTP | Assert | Ref | Kết quả | Lần chạy |
|----|------|--------|------|---------|------|------|--------|-----|---------|----------|
| TC-01 | public | GET | /trpc/healthCheck | — | — | 200 | result.data=OK | ACL#1 | — | — |
| TC-02 | session | GET | /api/auth/get-session | — | — | 200 | session.token=isString | ACL#28 FR-auth-account-019 | — | — |
| TC-03 | public | POST | /api/auth/sign-in/email | cf-connecting-ip: 203.0.113.10 | {"email":"a@b.c","password":"x"} | — | — | ACL#24 FR-auth-account-012 | — | — |
<!-- TC:END -->

## Lịch sử chạy
`;

  fs.writeFileSync(path.join(tmpDir, "api-tests.md"), sampleMd, "utf8");
  const parsed = parseApiTestsMarkdown(sampleMd);
  assert.equal(parsed.isOwnMode, true);
  assert.equal(parsed.rows.length, 3);

  const gen = generateCollection(tmpDir);
  assert.equal(gen.isOwnMode, true);
  assert.equal(gen.skippedAutoNo, 1);
  // _setup/login.bru + TC-01 + TC-02 = 3 files
  assert.equal(gen.generatedCount, 3);

  for (const f of gen.generatedFiles) {
    const content = fs.readFileSync(f, "utf8");
    // Verify no top-level '#' comments outside blocks
    const lines = content.split("\n");
    let depth = 0;
    for (const l of lines) {
      const t = l.trim();
      if (t.endsWith("{")) depth++;
      else if (t === "}") depth--;
      else if (t.startsWith("#")) {
        assert.ok(depth > 0, `Top-level comment found in ${f}: ${l}`);
      }
    }
  }

  // 4. Classify report: 100% connection-refused -> PENDING
  const pendingReport = [
    {
      results: [
        { name: "TC-01 GET /trpc/healthCheck", error: "connect ECONNREFUSED 127.0.0.1:3000" },
        { name: "TC-02 GET /api/auth/get-session", error: "connect ECONNREFUSED 127.0.0.1:3000" },
      ],
    },
  ];
  const clsPending = classifyBrunoReport(pendingReport);
  assert.equal(clsPending.allPending, true);
  assert.equal(clsPending.tcOutcomes.get("TC-01").status, "PENDING");

  // 5. Classify report: live mix PASS/FAIL + writeback
  const liveReport = [
    {
      results: [
        {
          name: "TC-01 GET /trpc/healthCheck",
          response: { status: 200 },
          assertionResults: [{ status: "pass" }],
        },
        {
          name: "TC-02 GET /api/auth/get-session",
          response: { status: 401 },
          assertionResults: [{ status: "fail" }],
        },
      ],
    },
  ];
  const clsLive = classifyBrunoReport(liveReport);
  assert.equal(clsLive.allPending, false);
  assert.equal(clsLive.tcOutcomes.get("TC-01").status, "PASS");
  assert.equal(clsLive.tcOutcomes.get("TC-02").status, "FAIL");

  const wb = writeBackResults(
    sampleMd,
    clsLive.tcOutcomes,
    "local",
    "2026-11-12T09:00:00Z",
  );
  assert.equal(wb.pass, 1);
  assert.equal(wb.fail, 1);
  assert.ok(wb.nextMd.includes("| TC-01 | public | GET | /trpc/healthCheck | — | — | 200 | result.data=OK | ACL#1 | ✅ PASS | 2026-11-12T09:00:00Z (local) |"));
  assert.ok(wb.nextMd.includes("| TC-02 | session | GET | /api/auth/get-session | — | — | 200 | session.token=isString | ACL#28 FR-auth-account-019 | ❌ FAIL | 2026-11-12T09:00:00Z (local) |"));
  assert.ok(wb.nextMd.includes("- **2026-11-12T09:00:00Z** · env=`local`"));

  console.log("All bruno-runner tests passed!");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
