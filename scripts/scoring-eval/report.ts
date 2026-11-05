import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

export interface Sample {
  sample_id: string;
  mode: "full" | "part";
  consent_ref: string;
  human_band: number;
}

export interface EvaluationAttempt {
  sample_id: string;
  config: string;
  run: number; // 1, 2, 3
  status: "ok" | "schema_error" | "api_error";
  overall_band?: number;
  criteria?: {
    fluency_and_coherence?: number;
    lexical_resource?: number;
    grammatical_range_and_accuracy?: number;
    pronunciation?: number;
  };
  mode: "full" | "part";
  audio_seconds: number;
  input_tokens: number;
  output_tokens: number;
  cost_vnd: number;
  prompt_sha: string;
  model_id: string;
  temperature?: number;
  run_at: string;
}

export const EvaluationAttemptSchema = z.object({
  sample_id: z.string().min(1),
  config: z.string().min(1),
  run: z.number().int().min(1).max(3),
  status: z.enum(["ok", "schema_error", "api_error"]),
  overall_band: z.number().min(0).max(9).optional(),
  criteria: z
    .object({
      fluency_and_coherence: z.number().optional(),
      lexical_resource: z.number().optional(),
      grammatical_range_and_accuracy: z.number().optional(),
      pronunciation: z.number().optional(),
    })
    .optional(),
  mode: z.enum(["full", "part"]),
  audio_seconds: z.number().nonnegative(),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  cost_vnd: z.number().int().nonnegative(),
  prompt_sha: z.string().min(1),
  model_id: z.string().min(1),
  temperature: z.number().optional(),
  run_at: z.string().min(1),
});

export interface SampleEvaluation {
  sample_id: string;
  human_band: number;
  run_bands: (number | null)[];
  median_band: number | null;
  accuracy_ok: boolean;
  variance: number | null;
  consistency_ok: boolean;
  has_error: boolean;
}

export interface ConfigMetrics {
  config: string;
  direction: "A" | "B";
  model: string;
  total_samples: number;
  accuracy_pass_count: number;
  accuracy_rate: number;
  accuracy_pass: boolean; // threshold >= 80% (>= 24/30)
  consistency_pass_count: number;
  consistency_rate: number;
  consistency_pass: boolean; // threshold >= 90% (>= 27/30)
  mean_full_cost_vnd: number | null; // target <= 8,000 VND; hard cap <= 12,000 VND
  cost_cap_pass: boolean;
  mean_part_cost_vnd: number | null; // target <= 3,000 VND (informational)
  all_gates_pass: boolean;
}

export interface DecisionResult {
  branch: "pass" | "accuracy_stability_fail" | "cost_cap_fail";
  selectedConfig: ConfigMetrics | null;
  decisionText: string;
  reasonText?: string;
  statusLine: "Đạt ngưỡng: có" | "Đạt ngưỡng: không";
}

/**
 * Calculate median of an array of numbers.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Evaluate metrics for a single sample across its 3 evaluation attempts.
 */
export function evaluateSample(sample: Sample, runs: EvaluationAttempt[]): SampleEvaluation {
  const hasError = runs.some((r) => r.status !== "ok" || typeof r.overall_band !== "number");
  const validBands = runs
    .filter((r) => r.status === "ok" && typeof r.overall_band === "number")
    .map((r) => r.overall_band as number);

  // If any error occurred or fewer than 3 runs exist, mark failed for both criteria
  if (hasError || validBands.length < 3) {
    return {
      sample_id: sample.sample_id,
      human_band: sample.human_band,
      run_bands: runs.map((r) => (r.status === "ok" ? r.overall_band ?? null : null)),
      median_band: validBands.length > 0 ? calculateMedian(validBands) : null,
      accuracy_ok: false,
      variance: null,
      consistency_ok: false,
      has_error: true,
    };
  }

  const median = calculateMedian(validBands);
  const accuracy_ok = Math.abs(median - sample.human_band) <= 0.5;

  const minBand = Math.min(...validBands);
  const maxBand = Math.max(...validBands);
  const variance = Math.round((maxBand - minBand) * 10) / 10;
  const consistency_ok = variance <= 0.5;

  return {
    sample_id: sample.sample_id,
    human_band: sample.human_band,
    run_bands: validBands,
    median_band: median,
    accuracy_ok,
    variance,
    consistency_ok,
    has_error: false,
  };
}

/**
 * Calculate aggregate metrics for a specific configuration.
 */
export function evaluateConfig(
  configName: string,
  samples: Sample[],
  attempts: EvaluationAttempt[]
): ConfigMetrics {
  const configAttempts = attempts.filter((a) => a.config === configName);

  let accuracy_pass_count = 0;
  let consistency_pass_count = 0;

  for (const sample of samples) {
    const sampleRuns = configAttempts
      .filter((a) => a.sample_id === sample.sample_id)
      .sort((a, b) => a.run - b.run);

    const evalResult = evaluateSample(sample, sampleRuns);
    if (evalResult.accuracy_ok) accuracy_pass_count++;
    if (evalResult.consistency_ok) consistency_pass_count++;
  }

  const total = samples.length > 0 ? samples.length : 1;
  const accuracy_rate = Math.round((accuracy_pass_count / total) * 1000) / 10;
  const consistency_rate = Math.round((consistency_pass_count / total) * 1000) / 10;

  // Exact boundary comparison (pass_count * 10 >= total * 8 / 9)
  const accuracy_pass = accuracy_pass_count * 10 >= total * 8;
  const consistency_pass = consistency_pass_count * 10 >= total * 9;

  // Cost calculations: ONLY average successful (status === "ok") attempts
  const fullOkRuns = configAttempts.filter((a) => a.mode === "full" && a.status === "ok");
  const partOkRuns = configAttempts.filter((a) => a.mode === "part" && a.status === "ok");

  // If no successful full test runs exist, cost cannot be validated (fails cost cap)
  const mean_full_cost_vnd =
    fullOkRuns.length > 0
      ? Math.round(fullOkRuns.reduce((sum, r) => sum + r.cost_vnd, 0) / fullOkRuns.length)
      : null;

  const cost_cap_pass = mean_full_cost_vnd !== null && mean_full_cost_vnd <= 12000;

  const mean_part_cost_vnd =
    partOkRuns.length > 0
      ? Math.round(partOkRuns.reduce((sum, r) => sum + r.cost_vnd, 0) / partOkRuns.length)
      : null;

  const all_gates_pass = accuracy_pass && consistency_pass && cost_cap_pass;

  const direction: "A" | "B" = configName.startsWith("azure") ? "A" : "B";
  const model = configName.replace(/^(azure|speechsuper)-/, "");

  return {
    config: configName,
    direction,
    model,
    total_samples: samples.length,
    accuracy_pass_count,
    accuracy_rate,
    accuracy_pass,
    consistency_pass_count,
    consistency_rate,
    consistency_pass,
    mean_full_cost_vnd,
    cost_cap_pass,
    mean_part_cost_vnd,
    all_gates_pass,
  };
}

/**
 * Determine final decision outcome across all 6 evaluated configurations.
 */
export function decideOutcome(metricsList: ConfigMetrics[]): DecisionResult {
  const passingConfigs = metricsList.filter((m) => m.all_gates_pass);

  if (passingConfigs.length > 0) {
    const sorted = [...passingConfigs].sort((a, b) => {
      const costA = a.mean_full_cost_vnd ?? Infinity;
      const costB = b.mean_full_cost_vnd ?? Infinity;
      if (costA !== costB) {
        return costA - costB;
      }
      return b.accuracy_rate - a.accuracy_rate;
    });

    const chosen = sorted[0]!;
    return {
      branch: "pass",
      selectedConfig: chosen,
      decisionText: `Quyết định: ${chosen.config}`,
      statusLine: "Đạt ngưỡng: có",
    };
  }

  // Check if any config passed accuracy + consistency but failed cost
  const qualityPassingConfigs = metricsList.filter(
    (m) => m.accuracy_pass && m.consistency_pass && !m.cost_cap_pass
  );

  if (qualityPassingConfigs.length > 0) {
    return {
      branch: "cost_cap_fail",
      selectedConfig: null,
      decisionText: "Quyết định: không chọn — chuyển người sở hữu sản phẩm",
      reasonText: "Chuyển người sở hữu: chi phí vượt trần 12.000đ",
      statusLine: "Đạt ngưỡng: không",
    };
  }

  // Otherwise failure is accuracy or stability
  return {
    branch: "accuracy_stability_fail",
    selectedConfig: null,
    decisionText: "Quyết định: không chọn — chuyển người sở hữu sản phẩm",
    reasonText: "Chuyển người sở hữu: độ chính xác hoặc độ ổn định dưới ngưỡng",
    statusLine: "Đạt ngưỡng: không",
  };
}

/**
 * Parse CSV manifest strictly.
 * Throws immediately on invalid mode, missing consent_ref, or invalid human_band.
 * Returns empty array if only header line is present.
 */
export function parseSamplesCsv(csvContent: string): Sample[] {
  const lines = csvContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  const samples: Sample[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(",").map((s) => s.trim());
    if (parts.length < 4) {
      throw new Error(`CSV row ${i + 1} has fewer than 4 columns: "${lines[i]}"`);
    }

    const [sample_id, mode, consent_ref, human_band_str] = parts;
    if (!sample_id || sample_id.length === 0) {
      throw new Error(`CSV row ${i + 1}: sample_id cannot be empty`);
    }

    if (mode !== "full" && mode !== "part") {
      throw new Error(`CSV row ${i + 1}: invalid mode "${mode}". Expected "full" or "part".`);
    }

    if (!consent_ref || consent_ref.length === 0) {
      throw new Error(`CSV row ${i + 1}: consent_ref cannot be empty (consent is mandatory)`);
    }

    const human_band = parseFloat(human_band_str!);
    if (isNaN(human_band) || human_band < 0.0 || human_band > 9.0 || !Number.isInteger(human_band * 2)) {
      throw new Error(
        `CSV row ${i + 1}: invalid human_band "${human_band_str}". Must be 0.0 to 9.0 in 0.5 increments.`
      );
    }

    samples.push({
      sample_id,
      mode,
      consent_ref,
      human_band,
    });
  }

  return samples;
}

/**
 * Format markdown report content for docs/oq-5-scoring-eval.md
 */
export function generateMarkdownReport(
  decision: DecisionResult,
  metricsList: ConfigMetrics[],
  transferDate?: string
): string {
  const now = new Date().toISOString().split("T")[0];
  const dateLine = transferDate
    ? `Ngày chuyển dữ liệu ra nước ngoài đầu tiên: ${transferDate}\n`
    : `Ngày chuyển dữ liệu ra nước ngoài đầu tiên: Chưa thực hiện (chờ bài mẫu)\n`;

  let md = `# Báo Cáo Đánh Giá Dịch Vụ Giọng Nói & AI (OQ-5)\n\n`;
  md += `**Ngày thực hiện:** ${now}\n`;
  md += dateLine;
  md += `${decision.statusLine}\n`;
  md += `${decision.decisionText}\n`;
  if (decision.reasonText) {
    md += `${decision.reasonText}\n`;
  }
  md += `\n---\n\n`;

  md += `## 1. Bảng Tổng Hợp 6 Cấu Hình\n\n`;
  md += `| Cấu hình | Hướng | Mô hình | Độ chính xác (≥80%) | Độ ổn định (≥90%) | Chi phí Full Test (≤12k) | Chi phí Part | Đạt cổng |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  for (const m of metricsList) {
    const accStr = `${m.accuracy_rate}% (${m.accuracy_pass_count}/${m.total_samples})`;
    const consStr = `${m.consistency_rate}% (${m.consistency_pass_count}/${m.total_samples})`;
    const fullCostStr =
      m.mean_full_cost_vnd !== null
        ? `${m.mean_full_cost_vnd.toLocaleString("vi-VN")}đ`
        : "N/A (không có dữ liệu)";
    const partCostStr =
      m.mean_part_cost_vnd !== null
        ? `${m.mean_part_cost_vnd.toLocaleString("vi-VN")}đ`
        : "N/A";
    const statusIcon = m.all_gates_pass ? "✅ Đạt" : "❌ Không đạt";

    md += `| \`${m.config}\` | ${m.direction} | ${m.model} | ${accStr} | ${consStr} | ${fullCostStr} | ${partCostStr} | ${statusIcon} |\n`;
  }

  md += `\n---\n\n`;
  md += `## 2. Kết Luận & Khuyến Nghị\n\n`;
  if (decision.branch === "pass" && decision.selectedConfig) {
    md += `Tổ hợp **\`${decision.selectedConfig.config}\`** đã vượt qua toàn bộ các tiêu chí nghiệm thu về độ chính xác, độ ổn định và chi phí trần.\n`;
    md += `- **Chi phí ước tính:** ${decision.selectedConfig.mean_full_cost_vnd?.toLocaleString("vi-VN")}đ / Full Test; ${decision.selectedConfig.mean_part_cost_vnd?.toLocaleString("vi-VN")}đ / Part.\n`;
    md += `- **Cập nhật trần miễn phí:** Điều chỉnh trần tạm tính hàng ngày theo chi phí thật.\n`;
  } else {
    md += `Không có cấu hình nào đáp ứng đầy đủ đồng thời cả 3 tiêu chí của OQ-5.\n`;
    md += `- **Lý do:** ${decision.reasonText}\n`;
    md += `- **Hành động tiếp theo:** Chuyển người sở hữu sản phẩm xem xét điều chỉnh phạm vi chấm, nới lỏng ngân sách, hoặc thử nghiệm thêm nhà cung cấp khác.\n`;
  }

  return md;
}

// CLI Execution Handler
if (process.argv[1] && (process.argv[1].endsWith("/report.ts") || process.argv[1].endsWith("report.ts"))) {
  const isCheckMode = process.argv.includes("--check");
  const resultsDir = path.resolve("scripts/scoring-eval/results");
  const samplesPath = path.resolve("scripts/scoring-eval/samples.csv");

  if (!fs.existsSync(samplesPath)) {
    console.error(`Samples CSV missing at ${samplesPath}`);
    process.exit(1);
  }

  const samples = parseSamplesCsv(fs.readFileSync(samplesPath, "utf-8"));

  if (isCheckMode) {
    if (samples.length !== 30) {
      console.error(`--check failed: expected exactly 30 samples in samples.csv, found ${samples.length}`);
      process.exit(1);
    }

    if (!fs.existsSync(resultsDir)) {
      console.error(`Results directory does not exist: ${resultsDir}`);
      process.exit(1);
    }

    const sampleIdSet = new Set(samples.map((s) => s.sample_id));
    const jsonlFiles = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".jsonl"));
    const attemptKeys = new Set<string>();
    const promptShas = new Set<string>();

    for (const file of jsonlFiles) {
      const content = fs.readFileSync(path.join(resultsDir, file), "utf-8");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      for (let i = 0; i < lines.length; i++) {
        try {
          const parsedRaw: unknown = JSON.parse(lines[i]!);
          const record = EvaluationAttemptSchema.parse(parsedRaw);

          if (!sampleIdSet.has(record.sample_id)) {
            console.error(`Unknown sample_id in results: "${record.sample_id}"`);
            process.exit(1);
          }

          const key = `${record.sample_id}::${record.config}::${record.run}`;
          if (attemptKeys.has(key)) {
            console.error(`Duplicate attempt key detected in ${file}:${i + 1}: ${key}`);
            process.exit(1);
          }
          attemptKeys.add(key);
          promptShas.add(record.prompt_sha);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Schema validation error in ${file} line ${i + 1}: ${message}`);
          process.exit(1);
        }
      }
    }

    if (promptShas.size > 1) {
      console.error(`Multiple prompt SHAs detected across attempts: ${[...promptShas].join(", ")}`);
      process.exit(1);
    }

    if (attemptKeys.size === 540) {
      console.log("540 unique attempts verified");
      process.exit(0);
    } else {
      console.log(`Found ${attemptKeys.size} unique attempts (expected 540)`);
      process.exit(1);
    }
  } else {
    // Report generation mode
    if (!fs.existsSync(resultsDir)) {
      console.error(`Results directory does not exist: ${resultsDir}`);
      process.exit(1);
    }

    const jsonlFiles = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".jsonl"));
    const attempts: EvaluationAttempt[] = [];
    const firstTransferFile = path.join(resultsDir, "first-transfer.txt");
    let earliestDate: string | undefined = fs.existsSync(firstTransferFile)
      ? fs.readFileSync(firstTransferFile, "utf-8").trim()
      : undefined;

    for (const file of jsonlFiles) {
      const content = fs.readFileSync(path.join(resultsDir, file), "utf-8");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      for (const line of lines) {
        try {
          const parsedRaw: unknown = JSON.parse(line);
          const record = EvaluationAttemptSchema.parse(parsedRaw);
          attempts.push(record);

          const datePart = record.run_at.split("T")[0];
          if (!earliestDate || (datePart && datePart < earliestDate)) {
            earliestDate = datePart;
          }
        } catch {
          // Skip invalid lines in report mode
        }
      }
    }

    const configs = [
      "azure-haiku",
      "azure-sonnet",
      "azure-opus",
      "speechsuper-haiku",
      "speechsuper-sonnet",
      "speechsuper-opus",
    ];

    const metricsList = configs.map((c) => evaluateConfig(c, samples, attempts));
    const decision = decideOutcome(metricsList);
    const md = generateMarkdownReport(decision, metricsList, earliestDate);

    const reportPath = path.resolve("docs/oq-5-scoring-eval.md");
    fs.writeFileSync(reportPath, md, "utf-8");
    console.log(`✅ Đã xuất báo cáo tại: ${reportPath}`);
    console.log(`${decision.statusLine}`);
    console.log(`${decision.decisionText}`);

    // If passed, update roadmap
    if (decision.branch === "pass") {
      const roadmapPath = path.resolve("docs/roadmap-chamro.md");
      if (fs.existsSync(roadmapPath)) {
        let roadmapContent = fs.readFileSync(roadmapPath, "utf-8");
        roadmapContent = roadmapContent.replace("- [ ] OQ-5:", "- [x] OQ-5:");
        fs.writeFileSync(roadmapPath, roadmapContent, "utf-8");
        console.log(`✅ Đã cập nhật - [x] OQ-5 trong ${roadmapPath}`);
      }
    }
  }
}
