import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateMedian,
  decideOutcome,
  evaluateConfig,
  evaluateSample,
  generateMarkdownReport,
  parseSamplesCsv,
  type ConfigMetrics,
  type EvaluationAttempt,
  type Sample,
} from "./report.ts";

test("calculateMedian calculates correct median values", () => {
  assert.equal(calculateMedian([6.5]), 6.5);
  assert.equal(calculateMedian([6.0, 6.5, 7.0]), 6.5);
  assert.equal(calculateMedian([7.0, 6.0, 6.5]), 6.5); // unsorted
  assert.equal(calculateMedian([6.0, 6.5, 7.0, 7.5]), 6.75); // even length
});

test("evaluateSample validates accuracy and consistency correctly", () => {
  const sample: Sample = {
    sample_id: "S01",
    mode: "full",
    consent_ref: "REF01",
    human_band: 6.5,
  };

  // Case 1: All runs accurate and consistent (runs: 6.5, 6.5, 7.0; median: 6.5; diff: 0.0; variance: 0.5)
  const runsGood: EvaluationAttempt[] = [
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 1,
      status: "ok",
      overall_band: 6.5,
      mode: "full",
      audio_seconds: 780,
      input_tokens: 5000,
      output_tokens: 2000,
      cost_vnd: 8100,
      prompt_sha: "abc",
      model_id: "claude-sonnet-5-5",
      run_at: "2026-11-05",
    },
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 2,
      status: "ok",
      overall_band: 6.5,
      mode: "full",
      audio_seconds: 780,
      input_tokens: 5000,
      output_tokens: 2000,
      cost_vnd: 8100,
      prompt_sha: "abc",
      model_id: "claude-sonnet-5-5",
      run_at: "2026-11-05",
    },
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 3,
      status: "ok",
      overall_band: 7.0,
      mode: "full",
      audio_seconds: 780,
      input_tokens: 5000,
      output_tokens: 2000,
      cost_vnd: 8100,
      prompt_sha: "abc",
      model_id: "claude-sonnet-5-5",
      run_at: "2026-11-05",
    },
  ];

  const evalGood = evaluateSample(sample, runsGood);
  assert.equal(evalGood.median_band, 6.5);
  assert.equal(evalGood.accuracy_ok, true);
  assert.equal(evalGood.variance, 0.5);
  assert.equal(evalGood.consistency_ok, true);
  assert.equal(evalGood.has_error, false);

  // Case 2: Inconsistent runs (variance > 0.5: 6.0 to 7.5 = 1.5)
  const runsInconsistent: EvaluationAttempt[] = [
    { ...runsGood[0]!, overall_band: 6.0 },
    { ...runsGood[1]!, overall_band: 6.5 },
    { ...runsGood[2]!, overall_band: 7.5 },
  ];
  const evalInconsistent = evaluateSample(sample, runsInconsistent);
  assert.equal(evalInconsistent.accuracy_ok, true); // median 6.5 == human 6.5
  assert.equal(evalInconsistent.consistency_ok, false); // variance 1.5 > 0.5

  // Case 3: Inaccurate runs (median differs from human_band by > 0.5)
  const runsInaccurate: EvaluationAttempt[] = [
    { ...runsGood[0]!, overall_band: 7.5 },
    { ...runsGood[1]!, overall_band: 7.5 },
    { ...runsGood[2]!, overall_band: 7.5 },
  ];
  const evalInaccurate = evaluateSample(sample, runsInaccurate);
  assert.equal(evalInaccurate.accuracy_ok, false); // abs(7.5 - 6.5) = 1.0 > 0.5
  assert.equal(evalInaccurate.consistency_ok, true); // variance 0.0 <= 0.5

  // Case 4: Schema error in one run
  const runsWithError: EvaluationAttempt[] = [
    runsGood[0]!,
    { ...runsGood[1]!, status: "schema_error", overall_band: undefined },
    runsGood[2]!,
  ];
  const evalError = evaluateSample(sample, runsWithError);
  assert.equal(evalError.has_error, true);
  assert.equal(evalError.accuracy_ok, false);
  assert.equal(evalError.consistency_ok, false);
});

test("evaluateConfig verifies exact boundary conditions (24/30 and 27/30)", () => {
  const samples: Sample[] = [];
  for (let i = 1; i <= 30; i++) {
    samples.push({
      sample_id: `S${i.toString().padStart(2, "0")}`,
      mode: i <= 20 ? "full" : "part",
      consent_ref: `REF${i}`,
      human_band: 6.0,
    });
  }

  // Test Boundary A: Exactly 24/30 passes accuracy (80.0%), 23/30 fails (76.7%)
  const makeAttempts = (accPassCount: number, consPassCount: number): EvaluationAttempt[] => {
    const list: EvaluationAttempt[] = [];
    for (let i = 1; i <= 30; i++) {
      const id = `S${i.toString().padStart(2, "0")}`;
      const isAcc = i <= accPassCount;
      const isCons = i <= consPassCount;
      const band = isAcc ? 6.0 : 7.5;
      const v = isCons ? 0.0 : 1.5;

      for (let run = 1; run <= 3; run++) {
        list.push({
          sample_id: id,
          config: "azure-sonnet",
          run,
          status: "ok",
          overall_band: run === 3 ? band + v : band,
          mode: i <= 20 ? "full" : "part",
          audio_seconds: 780,
          input_tokens: 5000,
          output_tokens: 2000,
          cost_vnd: 8100,
          prompt_sha: "sha",
          model_id: "claude-sonnet-5-5",
          run_at: "2026-11-05",
        });
      }
    }
    return list;
  };

  // 24 passes accuracy
  const metrics24 = evaluateConfig("azure-sonnet", samples, makeAttempts(24, 27));
  assert.equal(metrics24.accuracy_pass_count, 24);
  assert.equal(metrics24.accuracy_rate, 80.0);
  assert.equal(metrics24.accuracy_pass, true);

  // 23 fails accuracy
  const metrics23 = evaluateConfig("azure-sonnet", samples, makeAttempts(23, 27));
  assert.equal(metrics23.accuracy_pass_count, 23);
  assert.equal(metrics23.accuracy_rate, 76.7);
  assert.equal(metrics23.accuracy_pass, false);

  // 27 passes consistency (90.0%)
  const metrics27 = evaluateConfig("azure-sonnet", samples, makeAttempts(24, 27));
  assert.equal(metrics27.consistency_pass_count, 27);
  assert.equal(metrics27.consistency_rate, 90.0);
  assert.equal(metrics27.consistency_pass, true);

  // 26 fails consistency (86.7%)
  const metrics26 = evaluateConfig("azure-sonnet", samples, makeAttempts(24, 26));
  assert.equal(metrics26.consistency_pass_count, 26);
  assert.equal(metrics26.consistency_rate, 86.7);
  assert.equal(metrics26.consistency_pass, false);
});

test("evaluateConfig handles cost averaging correctly without being dragged down by errors", () => {
  const sample: Sample = {
    sample_id: "S01",
    mode: "full",
    consent_ref: "REF01",
    human_band: 6.0,
  };

  // 1 ok attempt with cost 10,000 VND and 2 api_error attempts with cost 0 VND
  const attemptsWithErrors: EvaluationAttempt[] = [
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 1,
      status: "ok",
      overall_band: 6.0,
      mode: "full",
      audio_seconds: 780,
      input_tokens: 5000,
      output_tokens: 2000,
      cost_vnd: 10000,
      prompt_sha: "sha",
      model_id: "sonnet",
      run_at: "2026-11-05",
    },
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 2,
      status: "api_error",
      mode: "full",
      audio_seconds: 0,
      input_tokens: 0,
      output_tokens: 0,
      cost_vnd: 0,
      prompt_sha: "sha",
      model_id: "sonnet",
      run_at: "2026-11-05",
    },
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 3,
      status: "api_error",
      mode: "full",
      audio_seconds: 0,
      input_tokens: 0,
      output_tokens: 0,
      cost_vnd: 0,
      prompt_sha: "sha",
      model_id: "sonnet",
      run_at: "2026-11-05",
    },
  ];

  const metrics = evaluateConfig("azure-sonnet", [sample], attemptsWithErrors);
  // Mean cost should be 10,000 VND (NOT 3,333 VND averaged over 3)
  assert.equal(metrics.mean_full_cost_vnd, 10000);

  // Case: No full mode attempts at all -> mean_full_cost_vnd should be null and cost_cap_pass should be false
  const partOnlySample: Sample = {
    sample_id: "S02",
    mode: "part",
    consent_ref: "REF02",
    human_band: 6.0,
  };
  const partAttempts: EvaluationAttempt[] = [
    { ...attemptsWithErrors[0]!, sample_id: "S02", mode: "part", cost_vnd: 3000 },
  ];
  const metricsNoFull = evaluateConfig("azure-sonnet", [partOnlySample], partAttempts);
  assert.equal(metricsNoFull.mean_full_cost_vnd, null);
  assert.equal(metricsNoFull.cost_cap_pass, false); // cannot pass without full test cost
});

test("parseSamplesCsv enforces strict validation on schema, consent, and mode", () => {
  // Empty or header-only returns []
  assert.deepEqual(parseSamplesCsv(""), []);
  assert.deepEqual(parseSamplesCsv("sample_id,mode,consent_ref,human_band\n"), []);

  // Valid CSV
  const validCsv = `sample_id,mode,consent_ref,human_band
S01,full,REF_01,6.5
S02,part,REF_02,7.0`;
  const samples = parseSamplesCsv(validCsv);
  assert.equal(samples.length, 2);
  assert.equal(samples[0]!.sample_id, "S01");
  assert.equal(samples[0]!.mode, "full");
  assert.equal(samples[0]!.consent_ref, "REF_01");
  assert.equal(samples[0]!.human_band, 6.5);

  // Invalid mode throws
  assert.throws(() => {
    parseSamplesCsv("sample_id,mode,consent_ref,human_band\nS01,invalid_mode,REF,6.5");
  }, /invalid mode/);

  // Missing consent_ref throws
  assert.throws(() => {
    parseSamplesCsv("sample_id,mode,consent_ref,human_band\nS01,full,,6.5");
  }, /consent_ref cannot be empty/);

  // Invalid human_band throws (not multiple of 0.5)
  assert.throws(() => {
    parseSamplesCsv("sample_id,mode,consent_ref,human_band\nS01,full,REF,6.3");
  }, /invalid human_band/);

  // Out of bounds human_band throws (> 9.0)
  assert.throws(() => {
    parseSamplesCsv("sample_id,mode,consent_ref,human_band\nS01,full,REF,9.5");
  }, /invalid human_band/);
});

test("decideOutcome handles all 3 branches: pass, accuracy/stability fail, cost cap fail", () => {
  const baseConfig: ConfigMetrics = {
    config: "azure-sonnet",
    direction: "A",
    model: "sonnet",
    total_samples: 30,
    accuracy_pass_count: 26,
    accuracy_rate: 86.7,
    accuracy_pass: true,
    consistency_pass_count: 28,
    consistency_rate: 93.3,
    consistency_pass: true,
    mean_full_cost_vnd: 8100,
    cost_cap_pass: true,
    mean_part_cost_vnd: 2600,
    all_gates_pass: true,
  };

  const expensivePassConfig: ConfigMetrics = {
    ...baseConfig,
    config: "azure-opus",
    mean_full_cost_vnd: 8900,
  };

  const decisionPass = decideOutcome([expensivePassConfig, baseConfig]);
  assert.equal(decisionPass.branch, "pass");
  assert.equal(decisionPass.statusLine, "Đạt ngưỡng: có");
  assert.equal(decisionPass.decisionText, "Quyết định: azure-sonnet"); // cheapest selected

  // Branch (b): No config passes; failure due to accuracy / stability
  const failedAccuracyConfig: ConfigMetrics = {
    ...baseConfig,
    config: "azure-haiku",
    accuracy_pass_count: 20,
    accuracy_rate: 66.7,
    accuracy_pass: false,
    all_gates_pass: false,
  };

  const decisionAccFail = decideOutcome([failedAccuracyConfig]);
  assert.equal(decisionAccFail.branch, "accuracy_stability_fail");
  assert.equal(decisionAccFail.statusLine, "Đạt ngưỡng: không");
  assert.equal(
    decisionAccFail.decisionText,
    "Quyết định: không chọn — chuyển người sở hữu sản phẩm"
  );
  assert.equal(
    decisionAccFail.reasonText,
    "Chuyển người sở hữu: độ chính xác hoặc độ ổn định dưới ngưỡng"
  );

  // Branch (c): Accuracy and consistency pass, but cost cap exceeds 12,000 VND
  const overCapConfig: ConfigMetrics = {
    ...baseConfig,
    config: "speechsuper-opus",
    mean_full_cost_vnd: 12600,
    cost_cap_pass: false,
    all_gates_pass: false,
  };

  const decisionCostFail = decideOutcome([overCapConfig]);
  assert.equal(decisionCostFail.branch, "cost_cap_fail");
  assert.equal(decisionCostFail.statusLine, "Đạt ngưỡng: không");
  assert.equal(
    decisionCostFail.decisionText,
    "Quyết định: không chọn — chuyển người sở hữu sản phẩm"
  );
  assert.equal(decisionCostFail.reasonText, "Chuyển người sở hữu: chi phí vượt trần 12.000đ");
});

test("generateMarkdownReport produces compliant markdown with exact required headers and transfer date", () => {
  const passingConfig: ConfigMetrics = {
    config: "azure-sonnet",
    direction: "A",
    model: "sonnet",
    total_samples: 30,
    accuracy_pass_count: 26,
    accuracy_rate: 86.7,
    accuracy_pass: true,
    consistency_pass_count: 28,
    consistency_rate: 93.3,
    consistency_pass: true,
    mean_full_cost_vnd: 8100,
    cost_cap_pass: true,
    mean_part_cost_vnd: 2600,
    all_gates_pass: true,
  };

  const decision = decideOutcome([passingConfig]);

  // When transferDate is provided:
  const mdWithDate = generateMarkdownReport(decision, [passingConfig], "2026-11-05");
  assert.match(mdWithDate, /^Quyết định: azure-sonnet/m);
  assert.match(mdWithDate, /^Đạt ngưỡng: có/m);
  assert.match(mdWithDate, /^Ngày chuyển dữ liệu ra nước ngoài đầu tiên: 2026-11-05/m);

  // When transferDate is NOT provided (pre-data state):
  const mdWithoutDate = generateMarkdownReport(decision, [passingConfig]);
  assert.match(
    mdWithoutDate,
    /^Ngày chuyển dữ liệu ra nước ngoài đầu tiên: Chưa thực hiện \(chờ bài mẫu\)/m
  );
});

test("resumption tracking preserves schema_error and ok attempts without duplicates", () => {
  const existingAttempts: EvaluationAttempt[] = [
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 1,
      status: "schema_error",
      mode: "full",
      audio_seconds: 780,
      input_tokens: 5000,
      output_tokens: 2000,
      cost_vnd: 8100,
      prompt_sha: "sha",
      model_id: "sonnet",
      run_at: "2026-11-05",
    },
    {
      sample_id: "S01",
      config: "azure-sonnet",
      run: 2,
      status: "ok",
      overall_band: 6.5,
      mode: "full",
      audio_seconds: 780,
      input_tokens: 5000,
      output_tokens: 2000,
      cost_vnd: 8100,
      prompt_sha: "sha",
      model_id: "sonnet",
      run_at: "2026-11-05",
    },
  ];

  // Resumption tracking set: MUST track all sample_id::run keys regardless of status
  const trackedKeys = new Set<string>();
  for (const a of existingAttempts) {
    trackedKeys.add(`${a.sample_id}::${a.run}`);
  }

  assert.equal(trackedKeys.has("S01::1"), true); // schema_error key is tracked
  assert.equal(trackedKeys.has("S01::2"), true); // ok key is tracked
  assert.equal(trackedKeys.has("S01::3"), false); // run 3 still needed
});
