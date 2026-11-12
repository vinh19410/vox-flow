#!/usr/bin/env node
/**
 * Canonical Bruno Runner for BA-Kit (/api-test)
 * Shared across all features (own API + 3rd-party API).
 *
 * Usage:
 *   node .agents/scripts/bruno-runner.mjs gen --dir docs/{feature}/test/api
 *   node .agents/scripts/bruno-runner.mjs run --dir docs/{feature}/test/api [--env local|mock|staging|sandbox|prod] [--tc TC-01,TC-03] [--provider paygate] [--allow-prod]
 *
 * Security rules:
 *   - NEVER read, print, or parse bruno/.env values.
 *   - Scrub sensitive headers/tokens and delete temporary Bruno JSON report immediately after parsing.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const TC_START = "<!-- TC:START -->";
const TC_END = "<!-- TC:END -->";

let reportSeq = 0;

export function parseArgs(argv) {
  const args = argv.slice(2);
  const mode = args[0];
  const opts = {
    mode,
    dir: "",
    env: "",
    tc: [],
    provider: "",
    allowProd: false,
    loginPath: "",
  };

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === "--dir" && args[i + 1]) {
      opts.dir = args[++i];
    } else if (a === "--env" && args[i + 1]) {
      opts.env = args[++i];
    } else if (a === "--tc" && args[i + 1]) {
      opts.tc = args[++i]
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    } else if (a === "--provider" && args[i + 1]) {
      opts.provider = args[++i].trim().toLowerCase();
    } else if (a === "--allow-prod") {
      opts.allowProd = true;
    } else if (a === "--login-path" && args[i + 1]) {
      opts.loginPath = args[++i].trim();
    }
  }
  return opts;
}

export function slugifyFeatureEnvVar(slug) {
  return (
    String(slug || "APP")
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase() + "_BASE"
  );
}

export function slugifyPath(method, reqPath) {
  const cleanPath = String(reqPath || "")
    .split("?")[0]
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const m = String(method || "get").toLowerCase();
  return `${m}-${cleanPath || "root"}`;
}

export function extractFrontmatterFeature(mdText, dirPath) {
  const fmMatch = mdText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const featLine = fmMatch[1].match(/^feature:\s*(.+)$/m);
    if (featLine) {
      return featLine[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  const normalized = dirPath.split(path.sep).join("/");
  const docsMatch = normalized.match(/(?:^|\/)docs\/([^/]+)\//);
  if (docsMatch) return docsMatch[1];
  return "app";
}

export function extractSetupLoginConfig(mdText) {
  const fmMatch = mdText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const cfg = {
    loginPath: "/api/auth/sign-in/email",
    originVar: "{{TRUSTED_ORIGIN}}",
  };
  if (fmMatch) {
    const lp = fmMatch[1].match(/^setup_login_path:\s*(.+)$/m);
    if (lp) cfg.loginPath = lp[1].trim().replace(/^["']|["']$/g, "");
    const ov = fmMatch[1].match(/^setup_origin_var:\s*(.+)$/m);
    if (ov) cfg.originVar = ov[1].trim().replace(/^["']|["']$/g, "");
  }
  return cfg;
}

function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const inner = trimmed.slice(1, -1);
  const cells = [];
  let cur = "";
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "\\" && inner[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (inner[i] === "|") {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += inner[i];
    }
  }
  cells.push(cur.trim());
  return cells;
}

export function parseApiTestsMarkdown(mdText) {
  const startIdx = mdText.indexOf(TC_START);
  const endIdx = mdText.indexOf(TC_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(
      "Missing or invalid <!-- TC:START --> / <!-- TC:END --> markers in api-tests.md",
    );
  }

  const block = mdText.slice(startIdx + TC_START.length, endIdx);
  const lines = block.split(/\r?\n/);

  let headerIdx = -1;
  let headers = [];
  for (let i = 0; i < lines.length; i++) {
    const cells = splitMarkdownRow(lines[i]);
    if (cells && cells.length >= 5) {
      headerIdx = i;
      headers = cells;
      break;
    }
  }
  if (headerIdx === -1) {
    throw new Error("Could not find Markdown table header inside TC markers");
  }

  const colIndex = {};
  headers.forEach((h, idx) => {
    const key = h.toLowerCase().trim();
    colIndex[key] = idx;
  });

  const isOwnMode =
    Object.prototype.hasOwnProperty.call(colIndex, "auth") &&
    !Object.prototype.hasOwnProperty.call(colIndex, "provider");

  const rows = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) continue;
    if (cells.every((c) => /^[-:\s]+$/.test(c))) continue;

    const getCell = (names) => {
      for (const n of names) {
        if (colIndex[n] !== undefined && cells[colIndex[n]] !== undefined) {
          return cells[colIndex[n]];
        }
      }
      return "";
    };

    const tc = getCell(["tc"]);
    if (!/^TC-\d+/i.test(tc)) continue;

    rows.push({
      lineOffset: i,
      cells,
      tc: tc.toUpperCase(),
      auth: getCell(["auth"]).toLowerCase(),
      provider: getCell(["provider"]).toLowerCase(),
      method: getCell(["method"]).toUpperCase(),
      path: getCell(["path"]),
      headers: getCell(["headers"]),
      body: getCell(["body"]),
      http: getCell(["http"]),
      assert: getCell(["assert"]),
      ref: getCell(["ref"]),
      result: getCell(["kết quả", "ket qua", "result"]),
      runAt: getCell(["lần chạy", "lan chay", "run_at", "run at"]),
    });
  }

  return {
    isOwnMode,
    headers,
    colIndex,
    rows,
    startIdx,
    endIdx,
    lines,
    headerIdx,
  };
}

function isBlankDash(val) {
  const s = String(val || "").trim();
  return !s || s === "—" || s === "-";
}

function parseHeadersCell(raw) {
  if (isBlankDash(raw)) return [];
  return String(raw)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((pair) => {
      const colon = pair.indexOf(":");
      if (colon === -1) return null;
      return {
        key: pair.slice(0, colon).trim(),
        value: pair.slice(colon + 1).trim(),
      };
    })
    .filter(Boolean);
}

export function formatAssertLine(expr) {
  const trimmed = expr.trim();
  if (!trimmed) return null;

  // Support explicit Bruno operators if prefixed with res.
  if (trimmed.startsWith("res.")) {
    return trimmed;
  }

  // Operators: ^= (startsWith), *= (contains), != (neq), = (eq)
  const opMatch = trimmed.match(/^(\$?[a-zA-Z0-9_.\-[\]]+)\s*(\^=|\*=|!=|=)\s*(.+)$/);
  if (!opMatch) return null;

  const [, rawTarget, op, rawVal] = opMatch;
  const val = rawVal.trim();

  // Header assert shortcut: header.set-cookie*=session_token=
  if (rawTarget.toLowerCase().startsWith("header.")) {
    const hName = rawTarget.slice("header.".length).toLowerCase();
    const bruOp =
      op === "*="
        ? "contains"
        : op === "^="
          ? "startsWith"
          : op === "!="
            ? "neq"
            : "eq";
    return `res.headers['${hName}']: ${bruOp} ${val}`;
  }

  const target = rawTarget === "$body" ? "res.body" : `res.body.${rawTarget}`;

  if (val === "isDefined") return `${target}: isDefined`;
  if (val === "isNull") return `${target}: isNull`;
  if (val === "isString") return `${target}: isString`;
  if (val === "isBoolean") return `${target}: isBoolean`;
  if (val === "isNumber") return `${target}: isNumber`;
  if (val === "isJson") return `${target}: isJson`;

  if (op === "^=") return `${target}: startsWith ${val}`;
  if (op === "*=") return `${target}: contains ${val}`;
  if (op === "!=") return `${target}: neq ${val}`;

  if (val === "null") {
    return rawTarget === "$body" ? `res.body: isNull` : `${target}: isNull`;
  }

  return `${target}: eq ${val}`;
}

export function renderBruFile(row, seq, options) {
  const { isOwnMode, featureBaseVar } = options;
  const methodLower = row.method.toLowerCase();
  const hasBody =
    !isBlankDash(row.body) &&
    ["post", "put", "patch", "delete"].includes(methodLower);

  const baseVar = isOwnMode
    ? featureBaseVar
    : `${String(row.provider || "API").toUpperCase()}_BASE`;
  const keyVar = isOwnMode
    ? ""
    : `${String(row.provider || "API").toUpperCase()}_KEY`;

  const lines = [];
  lines.push("meta {");
  lines.push(`  name: ${row.tc} ${row.method} ${row.path}`);
  lines.push("  type: http");
  lines.push(`  seq: ${seq}`);
  lines.push("}");
  lines.push("");

  lines.push(`${methodLower} {`);
  lines.push(`  url: {{${baseVar}}}${row.path}`);
  if (hasBody) {
    lines.push("  body: json");
  }
  if (!isOwnMode) {
    lines.push("  auth: bearer");
  }
  lines.push("}");
  lines.push("");

  if (!isOwnMode) {
    lines.push("auth:bearer {");
    lines.push(`  token: {{process.env.${keyVar}}}`);
    lines.push("}");
    lines.push("");
  }

  const parsedHeaders = parseHeadersCell(row.headers);
  if (
    isOwnMode &&
    row.auth === "session" &&
    !parsedHeaders.some((h) => h.key.toLowerCase() === "cookie")
  ) {
    parsedHeaders.push({ key: "Cookie", value: "{{sessionCookie}}" });
  }
  const nonEmptyHeaders = parsedHeaders.filter((h) => h.value !== "");
  if (nonEmptyHeaders.length > 0) {
    lines.push("headers {");
    for (const h of nonEmptyHeaders) {
      lines.push(`  ${h.key}: ${h.value}`);
    }
    lines.push("}");
    lines.push("");
  }

  if (hasBody) {
    let formattedJson = row.body.trim();
    try {
      // Pretty-print if valid JSON without Bruno interpolation breaking JSON.parse
      const parsed = JSON.parse(formattedJson);
      formattedJson = JSON.stringify(parsed, null, 2);
    } catch {
      // Keep single-line JSON if it contains unquoted template expressions
    }
    lines.push("body:json {");
    for (const bLine of formattedJson.split("\n")) {
      lines.push(`  ${bLine}`);
    }
    lines.push("}");
    lines.push("");
  }

  // Ensure unique timestamp var per request when {{timestamp}} is used
  const rawCombined = `${row.path} ${row.headers} ${row.body}`;
  const needsRunId = rawCombined.includes("{{runId}}");
  const needsOversizeImage = rawCombined.includes("{{OVERSIZE_IMAGE_DATA_URL}}");
  const needsPadded50 = rawCombined.includes("{{NAME_50_PADDED}}");
  const needsCookieJarClear =
    isOwnMode &&
    row.auth === "public" &&
    !nonEmptyHeaders.some((h) => h.key.toLowerCase() === "cookie");

  if (needsRunId || needsOversizeImage || needsPadded50 || needsCookieJarClear) {
    lines.push("script:pre-request {");
    if (needsCookieJarClear) {
      lines.push("  try { bru.cookies.jar().clear(); } catch (e) {}");
    }
    if (needsRunId) {
      lines.push("  if (!bru.getVar('runId')) {");
      lines.push("    bru.setVar('runId', String(Date.now()));");
      lines.push("  }");
    }
    if (needsOversizeImage) {
      lines.push(
        "  bru.setVar('OVERSIZE_IMAGE_DATA_URL', 'data:image/webp;base64,' + 'A'.repeat(32000));",
      );
    }
    if (needsPadded50) {
      lines.push(
        "  bru.setVar('NAME_50_PADDED', '  ' + 'N'.repeat(50) + '  ');",
      );
    }
    lines.push("}");
    lines.push("");
  }

  lines.push("assert {");
  if (isOwnMode && row.auth === "session") {
    lines.push("  # auth: session (relies on Bruno cookie jar after _setup/login)");
  }
  lines.push(`  res.status: eq ${row.http.trim()}`);
  if (!isBlankDash(row.assert)) {
    const parts = String(row.assert)
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const p of parts) {
      const aLine = formatAssertLine(p);
      if (aLine) lines.push(`  ${aLine}`);
    }
  }
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

export function renderSetupLoginBru(featureBaseVar, setupCfg) {
  const loginPath = setupCfg.loginPath || "/api/auth/sign-in/email";
  const lines = [
    "meta {",
    "  name: SETUP Login Seed Session",
    "  type: http",
    "  seq: 0",
    "}",
    "",
    "post {",
    `  url: {{${featureBaseVar}}}${loginPath}`,
    "  body: json",
    "}",
    "",
    "headers {",
    `  Origin: ${setupCfg.originVar || "{{TRUSTED_ORIGIN}}"}`,
    "}",
    "",
    "body:json {",
    "  {",
    '    "email": "{{process.env.SEED_EMAIL}}",',
    '    "password": "{{process.env.SEED_PASSWORD}}"',
    "  }",
    "}",
    "",
    "script:pre-request {",
    "  if (!bru.getVar('runId')) {",
    "    bru.setVar('runId', String(Date.now()));",
    "  }",
    "}",
    "",
    "script:post-response {",
    "  const rawCookie = res.headers['set-cookie'];",
    "  const cookies = Array.isArray(rawCookie) ? rawCookie : (rawCookie ? [rawCookie] : []);",
    "  const pairs = cookies.map((c) => String(c).split(';')[0]).filter(Boolean);",
    "  if (pairs.length > 0) {",
    "    bru.setVar('sessionCookie', pairs.join('; '));",
    "  }",
    "}",
    "",
    "assert {",
    "  # session bootstrap for Auth=session test cases",
    "  res.status: eq 200",
    "}",
    "",
  ];
  return lines.join("\n");
}

function cleanGeneratedBruFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return;
  for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
    const full = path.join(folderPath, entry.name);
    if (entry.isFile() && entry.name.endsWith(".bru")) {
      fs.unlinkSync(full);
    }
  }
}

export function generateCollection(dirPath, overrideLoginPath = "") {
  const absDir = path.resolve(dirPath);
  const mdPath = path.join(absDir, "api-tests.md");
  if (!fs.existsSync(mdPath)) {
    throw new Error(`api-tests.md not found in ${absDir}`);
  }

  const mdText = fs.readFileSync(mdPath, "utf8");
  const feature = extractFrontmatterFeature(mdText, absDir);
  const featureBaseVar = slugifyFeatureEnvVar(feature);
  const setupCfg = extractSetupLoginConfig(mdText);
  if (overrideLoginPath) setupCfg.loginPath = overrideLoginPath;

  const parsed = parseApiTestsMarkdown(mdText);
  const brunoDir = path.join(absDir, "bruno");
  fs.mkdirSync(brunoDir, { recursive: true });

  const brunoJsonPath = path.join(brunoDir, "bruno.json");
  if (!fs.existsSync(brunoJsonPath)) {
    fs.writeFileSync(
      brunoJsonPath,
      JSON.stringify(
        {
          version: "1",
          name: `${feature}-api-tests`,
          type: "collection",
          ignore: ["node_modules", ".git"],
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
  }

  const generatedFiles = [];
  let skippedAutoNo = 0;

  if (parsed.isOwnMode) {
    const setupDir = path.join(brunoDir, "_setup");
    const ownPublicDir = path.join(brunoDir, "own-public");
    const ownSessionDir = path.join(brunoDir, "own-session");
    const legacyOwnDir = path.join(brunoDir, "own");

    cleanGeneratedBruFolder(setupDir);
    cleanGeneratedBruFolder(ownPublicDir);
    cleanGeneratedBruFolder(ownSessionDir);
    cleanGeneratedBruFolder(legacyOwnDir);
    if (fs.existsSync(legacyOwnDir) && fs.readdirSync(legacyOwnDir).length === 0) {
      fs.rmdirSync(legacyOwnDir);
    }

    const hasSessionRows = parsed.rows.some(
      (r) => !isBlankDash(r.http) && r.auth === "session",
    );

    if (hasSessionRows) {
      fs.mkdirSync(setupDir, { recursive: true });
      const loginBruPath = path.join(setupDir, "login.bru");
      fs.writeFileSync(
        loginBruPath,
        renderSetupLoginBru(featureBaseVar, setupCfg),
        "utf8",
      );
      generatedFiles.push(loginBruPath);
    }

    // Put public standalone cases in 01-public, session cases in 02-session (or keep seq order in own/)
    // Using bruno/own/ as specified in SKILL.md (`bruno/{provider|own}/{TC}-{slug}.bru`)
    // Wait: let's remove ownPublicDir/ownSessionDir and strictly emit into `bruno/own/` so paths match SKILL.md 100%!
    const ownDir = path.join(brunoDir, "own");
    fs.mkdirSync(ownDir, { recursive: true });

    let seq = 1;
    for (const row of parsed.rows) {
      if (isBlankDash(row.http)) {
        skippedAutoNo++;
        continue;
      }
      const fileName = `${row.tc}-${slugifyPath(row.method, row.path)}.bru`;
      const outPath = path.join(ownDir, fileName);
      const bruContent = renderBruFile(row, seq++, {
        isOwnMode: true,
        featureBaseVar,
      });
      fs.writeFileSync(outPath, bruContent, "utf8");
      generatedFiles.push(outPath);
    }
  } else {
    const providers = new Set(
      parsed.rows
        .filter((r) => !isBlankDash(r.http))
        .map((r) => r.provider || "default"),
    );
    for (const p of providers) {
      const pDir = path.join(brunoDir, p);
      cleanGeneratedBruFolder(pDir);
      fs.mkdirSync(pDir, { recursive: true });
    }

    let seq = 1;
    for (const row of parsed.rows) {
      if (isBlankDash(row.http)) {
        skippedAutoNo++;
        continue;
      }
      const p = row.provider || "default";
      const fileName = `${row.tc}-${slugifyPath(row.method, row.path)}.bru`;
      const outPath = path.join(brunoDir, p, fileName);
      const bruContent = renderBruFile(row, seq++, {
        isOwnMode: false,
        featureBaseVar,
      });
      fs.writeFileSync(outPath, bruContent, "utf8");
      generatedFiles.push(outPath);
    }
  }

  return {
    feature,
    isOwnMode: parsed.isOwnMode,
    generatedCount: generatedFiles.length,
    skippedAutoNo,
    generatedFiles,
  };
}

export function classifyBrunoReport(reportJson) {
  const iterations = Array.isArray(reportJson) ? reportJson : [reportJson];
  const rawResults = [];
  for (const iter of iterations) {
    if (iter && Array.isArray(iter.results)) {
      rawResults.push(...iter.results);
    }
  }

  const tcOutcomes = new Map();
  let totalExecutable = 0;
  let connRefusedCount = 0;

  for (const item of rawResults) {
    const reqName =
      item?.suitename ||
      item?.name ||
      item?.test?.filename ||
      item?.request?.name ||
      "";
    const baseName = path.basename(String(reqName), ".bru");
    const tcMatch =
      String(item?.name || "").match(/^(TC-\d+)/i) ||
      baseName.match(/^(TC-\d+)/i);

    const errStr = JSON.stringify({
      error: item?.error || null,
      resError: item?.response?.error || null,
    });
    const isConnErr =
      /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|fetch failed|connect ECONN/i.test(
        errStr,
      );

    if (!tcMatch) {
      // e.g. _setup/login.bru
      if (isConnErr) {
        // Track setup connection error if no TC ran
      }
      continue;
    }

    const tcId = tcMatch[1].toUpperCase();
    totalExecutable++;

    if (isConnErr) {
      connRefusedCount++;
      tcOutcomes.set(tcId, {
        tc: tcId,
        status: "PENDING",
        httpStatus: null,
      });
      continue;
    }

    const assertionResults = Array.isArray(item?.assertionResults)
      ? item.assertionResults
      : [];
    const testResults = Array.isArray(item?.testResults) ? item.testResults : [];

    const hasError = Boolean(item?.error);
    const assertFailed = assertionResults.some((a) => a.status !== "pass");
    const testFailed = testResults.some((t) => t.status !== "pass");

    const passed = !hasError && !assertFailed && !testFailed;
    tcOutcomes.set(tcId, {
      tc: tcId,
      status: passed ? "PASS" : "FAIL",
      httpStatus: item?.response?.status ?? null,
    });
  }

  const allPending = totalExecutable > 0 && connRefusedCount === totalExecutable;
  if (allPending) {
    for (const [k, v] of tcOutcomes.entries()) {
      tcOutcomes.set(k, { ...v, status: "PENDING" });
    }
  }

  return {
    allPending,
    totalExecutable,
    connRefusedCount,
    tcOutcomes,
  };
}

export function writeBackResults(mdText, tcOutcomes, envName, isoTime) {
  const parsed = parseApiTestsMarkdown(mdText);
  const resIdx =
    parsed.colIndex["kết quả"] ??
    parsed.colIndex["ket qua"] ??
    parsed.colIndex["result"];
  const runIdx =
    parsed.colIndex["lần chạy"] ??
    parsed.colIndex["lan chay"] ??
    parsed.colIndex["run_at"] ??
    parsed.colIndex["run at"];

  if (resIdx === undefined || runIdx === undefined) {
    throw new Error("Missing Kết quả or Lần chạy column in api-tests.md");
  }

  let pass = 0;
  let fail = 0;
  let pending = 0;

  const blockLines = [...parsed.lines];
  for (const row of parsed.rows) {
    const outcome = tcOutcomes.get(row.tc);
    if (!outcome) continue;

    let badge = "—";
    if (outcome.status === "PASS") {
      badge = "✅ PASS";
      pass++;
    } else if (outcome.status === "FAIL") {
      badge = "❌ FAIL";
      fail++;
    } else if (outcome.status === "PENDING") {
      badge = "⏳ PENDING";
      pending++;
    }

    const updatedCells = [...row.cells];
    updatedCells[resIdx] = badge;
    updatedCells[runIdx] = `${isoTime} (${envName})`;
    blockLines[row.lineOffset] = `| ${updatedCells.join(" | ")} |`;
  }

  const newTableBlock = blockLines.join("\n");
  let nextMd =
    mdText.slice(0, parsed.startIdx + TC_START.length) +
    newTableBlock +
    mdText.slice(parsed.endIdx);

  const summaryLine = `- **${isoTime}** · env=\`${envName}\` · tổng=${pass + fail + pending} (✅ ${pass} PASS · ❌ ${fail} FAIL · ⏳ ${pending} PENDING)`;
  const historyHeading = /^##\s+Lịch sử chạy\s*$/m;
  const hMatch = nextMd.match(historyHeading);
  if (hMatch && hMatch.index !== undefined) {
    const insertPos = hMatch.index + hMatch[0].length;
    nextMd =
      nextMd.slice(0, insertPos) +
      `\n\n${summaryLine}` +
      nextMd.slice(insertPos);
  }

  return { nextMd, pass, fail, pending };
}

function runSuite(opts) {
  const absDir = path.resolve(opts.dir);
  const genInfo = generateCollection(absDir, opts.loginPath);
  const envName = opts.env || (genInfo.isOwnMode ? "local" : "mock");

  if (envName === "prod" && !opts.allowProd) {
    console.error(
      "[bruno-runner] Refusing to run against --env prod without --allow-prod confirmation flag.",
    );
    process.exit(2);
  }

  const brunoDir = path.join(absDir, "bruno");
  const envFile = path.join(brunoDir, "environments", `${envName}.bru`);
  if (!fs.existsSync(envFile)) {
    console.error(
      `[bruno-runner] Environment file not found: ${path.relative(process.cwd(), envFile)}`,
    );
    process.exit(2);
  }

  reportSeq += 1;
  const reportPath = path.join(
    absDir,
    `.bruno-report-${process.pid}-${reportSeq}.json`,
  );

  // Determine target paths inside bruno/
  const targets = [];
  if (opts.tc.length > 0) {
    const mdText = fs.readFileSync(path.join(absDir, "api-tests.md"), "utf8");
    const parsed = parseApiTestsMarkdown(mdText);
    const selectedRows = parsed.rows.filter(
      (r) => opts.tc.includes(r.tc) && !isBlankDash(r.http),
    );
    const needsSetup =
      parsed.isOwnMode && selectedRows.some((r) => r.auth === "session");
    if (needsSetup && fs.existsSync(path.join(brunoDir, "_setup", "login.bru"))) {
      targets.push("_setup/login.bru");
    }
    for (const r of selectedRows) {
      const folder = parsed.isOwnMode ? "own" : r.provider || "default";
      const fileName = `${r.tc}-${slugifyPath(r.method, r.path)}.bru`;
      targets.push(`${folder}/${fileName}`);
    }
  } else if (opts.provider) {
    targets.push(opts.provider);
  } else if (genInfo.isOwnMode) {
    if (fs.existsSync(path.join(brunoDir, "_setup", "login.bru"))) {
      targets.push("_setup/login.bru");
    }
    if (fs.existsSync(path.join(brunoDir, "own"))) {
      targets.push("own");
    }
  }

  const cliArgs = ["--yes", "@usebruno/cli", "run"];
  if (targets.length > 0) {
    cliArgs.push(...targets);
  }
  cliArgs.push("--env", envName, "--output", reportPath, "--format", "json");

  let cliResult;
  try {
    cliResult = spawnSync("npx", cliArgs, {
      cwd: brunoDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
    console.error(`[bruno-runner] Failed to execute npx @usebruno/cli: ${err.message}`);
    process.exit(1);
  }

  if (!fs.existsSync(reportPath)) {
    const stderrSafe = String(cliResult.stderr || "")
      .replace(/Authorization:\s*[^\r\n]+/gi, "Authorization: [MASKED]")
      .replace(/Cookie:\s*[^\r\n]+/gi, "Cookie: [MASKED]");
    console.error(
      `[bruno-runner] Bruno CLI did not produce report JSON (exit=${cliResult.status}).\n${stderrSafe}`,
    );
    process.exit(cliResult.status || 1);
  }

  let reportData;
  try {
    reportData = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  } finally {
    // Always scrub & delete report immediately after reading
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
  }

  const classified = classifyBrunoReport(reportData);
  const isoTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const mdPath = path.join(absDir, "api-tests.md");
  const mdText = fs.readFileSync(mdPath, "utf8");
  const updated = writeBackResults(
    mdText,
    classified.tcOutcomes,
    envName,
    isoTime,
  );
  fs.writeFileSync(mdPath, updated.nextMd, "utf8");

  console.log(
    `[bruno-runner] Run completed (env=${envName}): PASS=${updated.pass}, FAIL=${updated.fail}, PENDING=${updated.pending}`,
  );

  if (classified.allPending) {
    process.exit(0);
  }
  process.exit(updated.fail > 0 ? updated.fail : 0);
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  const opts = parseArgs(process.argv);
  if (!opts.mode || !["gen", "run"].includes(opts.mode) || !opts.dir) {
    console.error(
      "Usage: node .agents/scripts/bruno-runner.mjs <gen|run> --dir <path> [--env <env>] [--tc TC-01,TC-02] [--provider <name>] [--allow-prod]",
    );
    process.exit(2);
  }

  if (opts.mode === "gen") {
    const res = generateCollection(opts.dir, opts.loginPath);
    console.log(
      `[bruno-runner] Generated ${res.generatedCount} .bru files (mode=${res.isOwnMode ? "own" : "3rd"}, skipped Auto=No: ${res.skippedAutoNo}) in ${path.join(opts.dir, "bruno")}`,
    );
  } else if (opts.mode === "run") {
    runSuite(opts);
  }
}
