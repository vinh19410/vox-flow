import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";

import {
  parseSamplesCsv,
  type EvaluationAttempt,
} from "./report.ts";

// Zod Schemas for Vendor Responses (Strictly zero `any`)
const AzureNBestSchema = z.object({
  Display: z.string().optional(),
  PronunciationAssessment: z
    .object({
      AccuracyScore: z.number().optional(),
      FluencyScore: z.number().optional(),
      ProsodyScore: z.number().optional(),
      PronScore: z.number().optional(),
    })
    .optional(),
});

const AzureSpeechResponseSchema = z.object({
  RecognitionStatus: z.string(),
  DisplayText: z.string().optional(),
  NBest: z.array(AzureNBestSchema).optional(),
});

const WhisperResponseSchema = z.object({
  text: z.string(),
});

const SpeechSuperResponseSchema = z.object({
  result: z.object({
    pronunciation: z.number().optional(),
    fluency: z.number().optional(),
    overall: z.number().optional(),
    pause_count: z.number().optional(),
    speed: z.number().optional(),
  }),
});

const AnthropicContentBlockSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

const AnthropicResponseSchema = z.object({
  content: z.array(AnthropicContentBlockSchema),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
});

// Zod Schema for Structured Evaluation Output from LLM
export const BandSchema = z
  .number()
  .min(0.0)
  .max(9.0)
  .refine((val) => Number.isInteger(val * 2), {
    message: "Band score must be a multiple of 0.5 between 0.0 and 9.0",
  });

export const EvaluationOutputSchema = z.object({
  overall_band: BandSchema,
  criteria: z.object({
    fluency_and_coherence: BandSchema,
    lexical_resource: BandSchema,
    grammatical_range_and_accuracy: BandSchema,
    pronunciation: BandSchema,
  }),
  examiner_feedback: z.string().optional(),
  key_errors: z.array(z.string()).optional(),
});

export type EvaluationOutput = z.infer<typeof EvaluationOutputSchema>;

export const SpeechResultSchema = z.object({
  transcript: z.string(),
  accuracy_score: z.number(),
  fluency_score: z.number(),
  prosody_score: z.number(),
  pron_score: z.number(),
  audio_seconds: z.number(),
  cost_vnd: z.number(),
});

export type SpeechResult = z.infer<typeof SpeechResultSchema>;

// Token pricing benchmark from plans/.../reports/research-speech-llm-pricing.md
// Pricing in USD per Million Tokens (FX benchmark: 26,000 VND / USD)
// NOTE: Verify against active Anthropic pricing sheet before executing full trial.
export const MODEL_PRICING: Record<string, { inPerM: number; outPerM: number }> = {
  haiku: { inPerM: 0.1, outPerM: 0.5 }, // Claude Haiku 5.5
  sonnet: { inPerM: 2.0, outPerM: 10.0 }, // Claude Sonnet 5.5
  opus: { inPerM: 4.0, outPerM: 20.0 }, // Claude Opus 5.5
};

export const CONFIGS = [
  "azure-haiku",
  "azure-sonnet",
  "azure-opus",
  "speechsuper-haiku",
  "speechsuper-sonnet",
  "speechsuper-opus",
] as const;

export type ConfigName = (typeof CONFIGS)[number];

/**
 * Resolve Anthropic model identifier from environment.
 * Throws immediately if alias is invalid or environment variable is missing (NO silent fallbacks).
 */
export function resolveAnthropicModel(alias: string): string {
  if (alias === "haiku") {
    const model = process.env.ANTHROPIC_HAIKU_MODEL;
    if (!model) throw new Error("Missing required ANTHROPIC_HAIKU_MODEL in .env");
    return model;
  }
  if (alias === "sonnet") {
    const model = process.env.ANTHROPIC_SONNET_MODEL;
    if (!model) throw new Error("Missing required ANTHROPIC_SONNET_MODEL in .env");
    return model;
  }
  if (alias === "opus") {
    const model = process.env.ANTHROPIC_OPUS_MODEL;
    if (!model) throw new Error("Missing required ANTHROPIC_OPUS_MODEL in .env");
    return model;
  }
  throw new Error(`Unknown model alias: "${alias}". Expected one of: haiku, sonnet, opus.`);
}

export function getAudioPath(sample_id: string): string {
  return path.resolve(`scripts/scoring-eval/audio/${sample_id}.wav`);
}

/**
 * Record the first-transfer date to results/first-transfer.txt write-once.
 * Tracks the legal 60-day filing clock under Luật 91/2025/QH15.
 */
export function recordFirstTransfer(): void {
  const transferFilePath = path.resolve("scripts/scoring-eval/results/first-transfer.txt");
  if (!fs.existsSync(transferFilePath)) {
    fs.mkdirSync(path.dirname(transferFilePath), { recursive: true });
    const today = new Date().toISOString().split("T")[0]!;
    fs.writeFileSync(transferFilePath, today, "utf-8");
  }
}

/**
 * Build a standard 44-byte WAV header for 16kHz, 16-bit, Mono PCM.
 */
export function createWavHeader(pcmDataLength: number): Buffer {
  const header = Buffer.alloc(44);
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8; // 32,000
  const blockAlign = (numChannels * bitsPerSample) / 8; // 2

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmDataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmDataLength, 40);

  return header;
}

/**
 * Parse WAV file, validate format (16kHz 16-bit mono), and extract raw PCM buffer.
 */
export function parseWavPcm(buffer: Buffer): { pcmBuffer: Buffer; durationSec: number } {
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Invalid WAV file: missing RIFF/WAVE header");
  }

  let offset = 12;
  let pcmOffset = 44;
  let pcmLength = buffer.length - 44;
  let sampleRate = 16000;
  let channels = 1;
  let bitsPerSample = 16;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "fmt ") {
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      bitsPerSample = buffer.readUInt16LE(offset + 22);
    } else if (chunkId === "data") {
      pcmOffset = offset + 8;
      pcmLength = Math.min(chunkSize, buffer.length - pcmOffset);
      break;
    }
    offset += 8 + chunkSize;
  }

  if (sampleRate !== 16000 || channels !== 1 || bitsPerSample !== 16) {
    throw new Error(
      `Unsupported audio format: ${sampleRate}Hz, ${channels}ch, ${bitsPerSample}-bit. Expected 16000Hz, 1ch, 16-bit PCM WAV.`
    );
  }

  const pcmBuffer = buffer.subarray(pcmOffset, pcmOffset + pcmLength);
  const durationSec = Math.max(1, Math.round(pcmBuffer.length / 32000));
  return { pcmBuffer, durationSec };
}

/**
 * Direction A: Azure Speech Pronunciation Assessment.
 * Chunks audio into <= 25s segments with proper WAV headers to stay within REST limits.
 * Averages scores weighted by chunk duration.
 */
export async function runAzureSpeech(audioPath: string): Promise<SpeechResult> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    throw new Error("Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION");
  }

  const fileBytes = fs.readFileSync(audioPath);
  const { pcmBuffer, durationSec } = parseWavPcm(fileBytes);

  const pronHeader = Buffer.from(
    JSON.stringify({
      ReferenceText: "",
      GradingSystem: "HundredMark",
      Granularity: "FullText",
      Dimension: "Comprehensive",
      EnableProsodyAssessment: "True",
    })
  ).toString("base64");

  const endpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

  // 25s per chunk = 800,000 bytes PCM (safely below 30s Azure REST PA limit)
  const CHUNK_PCM_SIZE = 25 * 32000;
  const pcmChunks: Buffer[] = [];
  for (let offset = 0; offset < pcmBuffer.length; offset += CHUNK_PCM_SIZE) {
    pcmChunks.push(pcmBuffer.subarray(offset, Math.min(offset + CHUNK_PCM_SIZE, pcmBuffer.length)));
  }

  const transcripts: string[] = [];
  let weightedAcc = 0;
  let weightedFluency = 0;
  let weightedProsody = 0;
  let weightedPron = 0;
  let totalMeasuredSec = 0;

  for (const pcmChunk of pcmChunks) {
    const chunkSec = Math.max(1, pcmChunk.length / 32000);
    const chunkHeader = createWavHeader(pcmChunk.length);
    const chunkWav = Buffer.concat([chunkHeader, pcmChunk]);
    recordFirstTransfer();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Pronunciation-Assessment": pronHeader,
        Accept: "application/json",
      },
      body: chunkWav,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure Speech API failed: ${response.status} ${errorText}`);
    }

    const rawData: unknown = await response.json();
    const data = AzureSpeechResponseSchema.parse(rawData);

    if (data.RecognitionStatus !== "Success" && data.RecognitionStatus !== "NoMatch") {
      throw new Error(`Azure speech recognition status failed: ${data.RecognitionStatus}`);
    }

    const nBest = data.NBest?.[0];
    const pron = nBest?.PronunciationAssessment;

    const text = data.DisplayText || nBest?.Display || "";
    if (text) transcripts.push(text);

    if (pron) {
      weightedAcc += (pron.AccuracyScore ?? 0) * chunkSec;
      weightedFluency += (pron.FluencyScore ?? 0) * chunkSec;
      weightedProsody += (pron.ProsodyScore ?? 0) * chunkSec;
      weightedPron += (pron.PronScore ?? 0) * chunkSec;
      totalMeasuredSec += chunkSec;
    }
  }

  const denom = totalMeasuredSec > 0 ? totalMeasuredSec : 1;
  const cost_vnd = Math.round(durationSec * 9.39); // $1.30 / hour w/ Prosody ~ 9.39 VND/sec
  const transcript = transcripts.join(" ").trim();

  if (!transcript) {
    throw new Error("Azure returned empty transcript; cannot cache or evaluate empty audio.");
  }

  return {
    transcript,
    accuracy_score: Math.round(weightedAcc / denom),
    fluency_score: Math.round(weightedFluency / denom),
    prosody_score: Math.round(weightedProsody / denom),
    pron_score: Math.round(weightedPron / denom),
    audio_seconds: durationSec,
    cost_vnd,
  };
}

/**
 * Direction B: Standalone Whisper ASR + SpeechSuper IELTS Assessment.
 * Chunks audio into <= 120s segments to strictly respect SpeechSuper limits.
 */
export async function runSpeechSuper(audioPath: string): Promise<SpeechResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const appKey = process.env.SPEECHSUPER_APP_KEY;
  const secretKey = process.env.SPEECHSUPER_SECRET_KEY;

  if (!openaiKey) throw new Error("Missing OPENAI_API_KEY for Whisper ASR");
  if (!appKey || !secretKey) throw new Error("Missing SPEECHSUPER credentials");

  const fileBytes = fs.readFileSync(audioPath);
  const { pcmBuffer, durationSec } = parseWavPcm(fileBytes);

  // 1. Whisper ASR (chunk in 10-minute segments if > 10m to stay under 25MB)
  const ASR_CHUNK_PCM = 600 * 32000;
  const asrChunks: Buffer[] = [];
  for (let offset = 0; offset < pcmBuffer.length; offset += ASR_CHUNK_PCM) {
    asrChunks.push(pcmBuffer.subarray(offset, Math.min(offset + ASR_CHUNK_PCM, pcmBuffer.length)));
  }

  const whisperTranscripts: string[] = [];
  for (const asrChunk of asrChunks) {
    const chunkWav = Buffer.concat([createWavHeader(asrChunk.length), asrChunk]);
    const formData = new FormData();
    formData.append("file", new Blob([chunkWav], { type: "audio/wav" }), "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    recordFirstTransfer();
    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      throw new Error(`OpenAI Whisper failed: ${whisperRes.status} ${await whisperRes.text()}`);
    }
    const rawWhisper: unknown = await whisperRes.json();
    const whisperData = WhisperResponseSchema.parse(rawWhisper);
    if (whisperData.text) whisperTranscripts.push(whisperData.text);
  }

  const transcript = whisperTranscripts.join(" ").trim();
  if (!transcript) {
    throw new Error("Whisper returned empty transcript; cannot evaluate.");
  }

  // 2. SpeechSuper speak.eval.pro (chunks <= 110s to respect 120s limit)
  const SS_CHUNK_PCM = 110 * 32000;
  const ssChunks: Buffer[] = [];
  for (let offset = 0; offset < pcmBuffer.length; offset += SS_CHUNK_PCM) {
    ssChunks.push(pcmBuffer.subarray(offset, Math.min(offset + SS_CHUNK_PCM, pcmBuffer.length)));
  }

  let totalPron = 0;
  let totalFluency = 0;
  let totalSec = 0;

  for (const ssChunk of ssChunks) {
    const chunkSec = Math.max(1, ssChunk.length / 32000);
    const chunkWav = Buffer.concat([createWavHeader(ssChunk.length), ssChunk]);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHash("sha1")
      .update(`${appKey}${timestamp}${secretKey}`)
      .digest("hex");

    const speechSuperForm = new FormData();
    speechSuperForm.append("applicationId", appKey);
    speechSuperForm.append("timestamp", timestamp);
    speechSuperForm.append("sig", signature);
    speechSuperForm.append("audio", new Blob([chunkWav], { type: "audio/wav" }), "audio.wav");
    speechSuperForm.append(
      "text",
      JSON.stringify({
        coreType: "speak.eval.pro",
        test_type: "ielts",
      })
    );

    recordFirstTransfer();
    const ssRes = await fetch("https://api.speechsuper.com/speak.eval.pro", {
      method: "POST",
      body: speechSuperForm,
    });

    if (!ssRes.ok) {
      throw new Error(`SpeechSuper failed: ${ssRes.status} ${await ssRes.text()}`);
    }
    const rawSS: unknown = await ssRes.json();
    const ssData = SpeechSuperResponseSchema.parse(rawSS);
    const result = ssData.result;

    totalPron += (result.pronunciation ?? 0) * chunkSec;
    totalFluency += (result.fluency ?? 0) * chunkSec;
    totalSec += chunkSec;
  }

  const denom = totalSec > 0 ? totalSec : 1;
  const whisperCost = Math.round(durationSec * 2.6); // $0.006/min ~ 2.6 VND/sec
  const speechSuperCost = ssChunks.length * 910; // PAYG $0.035 / request ~ 910 VND per 120s chunk
  const cost_vnd = whisperCost + speechSuperCost;

  return {
    transcript,
    accuracy_score: Math.round(totalPron / denom),
    fluency_score: Math.round(totalFluency / denom),
    prosody_score: 0,
    pron_score: Math.round(totalPron / denom),
    audio_seconds: durationSec,
    cost_vnd,
  };
}

/**
 * Get or load cached speech recognition result.
 */
export async function getOrComputeSpeech(
  sample_id: string,
  direction: "A" | "B",
  audioPath: string
): Promise<SpeechResult> {
  const cacheDir = path.resolve("scripts/scoring-eval/transcripts");
  fs.mkdirSync(cacheDir, { recursive: true });
  const cacheFile = path.join(cacheDir, `${sample_id}.${direction}.json`);

  if (fs.existsSync(cacheFile)) {
    const rawCache: unknown = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    return SpeechResultSchema.parse(rawCache);
  }

  const result =
    direction === "A" ? await runAzureSpeech(audioPath) : await runSpeechSuper(audioPath);

  fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), "utf-8");
  return result;
}

/**
 * Load system prompt template and hash from scripts/scoring-eval/prompt.md
 */
export function loadPrompt(): { systemPrompt: string; promptSha: string } {
  const promptPath = path.resolve("scripts/scoring-eval/prompt.md");
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Missing prompt.md at ${promptPath}`);
  }

  const promptContent = fs.readFileSync(promptPath, "utf-8");
  const promptSha = crypto.createHash("sha256").update(promptContent).digest("hex").slice(0, 12);

  const match = promptContent.match(/## System Prompt\s+```text\n([\s\S]*?)\n```/);
  if (!match || !match[1]) {
    throw new Error(`Failed to extract System Prompt block from ${promptPath}`);
  }
  const systemPrompt = match[1].trim();

  return { systemPrompt, promptSha };
}

/**
 * Call Anthropic API to score candidate transcript.
 * Supports bounded retry with backoff for 429/529/network errors.
 */
export async function scoreWithAnthropic(
  modelAlias: string,
  transcript: string,
  speechResult: SpeechResult,
  systemPrompt: string
): Promise<{
  output?: EvaluationOutput;
  input_tokens: number;
  output_tokens: number;
  cost_vnd: number;
  status: "ok" | "schema_error" | "api_error";
  model_id: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const model_id = resolveAnthropicModel(modelAlias);

  const sanitizedTranscript = transcript.replaceAll("</candidate_transcript>", "[tag_stripped]");
  const userPrompt = `Please evaluate the following candidate response.
<candidate_transcript>
${sanitizedTranscript}
</candidate_transcript>

<acoustic_metrics>
- Accuracy Score: ${speechResult.accuracy_score} / 100
- Fluency Score: ${speechResult.fluency_score} / 100
- Prosody Score: ${speechResult.prosody_score} / 100
- Pronunciation Score: ${speechResult.pron_score} / 100
</acoustic_metrics>`;

  const pricing = MODEL_PRICING[modelAlias];
  if (!pricing) {
    throw new Error(`No pricing configured for model alias "${modelAlias}"`);
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model_id,
          max_tokens: 4096,
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || "1.0"),
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          console.warn(`Anthropic transient error ${response.status}. Retrying (${attempt}/${maxRetries})...`);
          await sleep(1000 * attempt);
          continue;
        }

        console.error(`Anthropic API error: ${response.status} ${await response.text()}`);
        return {
          input_tokens: 0,
          output_tokens: 0,
          cost_vnd: 0,
          status: "api_error",
          model_id,
        };
      }

      const rawData: unknown = await response.json();
      const data = AnthropicResponseSchema.parse(rawData);

      const textContent = data.content.find((c) => c.type === "text")?.text || "{}";
      const input_tokens = data.usage.input_tokens;
      const output_tokens = data.usage.output_tokens;

      const cost_usd =
        (input_tokens / 1_000_000) * pricing.inPerM + (output_tokens / 1_000_000) * pricing.outPerM;
      const cost_vnd = Math.round(cost_usd * 26000);

      try {
        const jsonStr = textContent.replace(/```json\n?|\n?```/g, "").trim();
        const parsed: unknown = JSON.parse(jsonStr);
        const output = EvaluationOutputSchema.parse(parsed);

        return {
          output,
          input_tokens,
          output_tokens,
          cost_vnd,
          status: "ok",
          model_id,
        };
      } catch (schemaErr) {
        console.error("Schema validation failed on LLM output:", schemaErr);
        // Schema errors must NOT be retried (honesty about model format instability)
        return {
          input_tokens,
          output_tokens,
          cost_vnd,
          status: "schema_error",
          model_id,
        };
      }
    } catch (err: unknown) {
      if (attempt < maxRetries) {
        console.warn(`Network error calling Anthropic. Retrying (${attempt}/${maxRetries})...`);
        await sleep(1000 * attempt);
        continue;
      }
      console.error("Network error calling Anthropic:", err);
      return {
        input_tokens: 0,
        output_tokens: 0,
        cost_vnd: 0,
        status: "api_error",
        model_id,
      };
    }
  }

  return {
    input_tokens: 0,
    output_tokens: 0,
    cost_vnd: 0,
    status: "api_error",
    model_id,
  };
}

/**
 * Main evaluation orchestrator.
 */
export async function run() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  let limit: number | undefined = undefined;
  if (limitIdx !== -1) {
    const val = parseInt(args[limitIdx + 1]!, 10);
    if (isNaN(val) || val <= 0) {
      console.error(`Invalid --limit argument: "${args[limitIdx + 1]}". Must be a positive integer.`);
      process.exit(1);
    }
    limit = val;
  }

  const configIdx = args.indexOf("--config");
  let specificConfig: ConfigName | undefined = undefined;
  if (configIdx !== -1) {
    const conf = args[configIdx + 1] as ConfigName;
    if (!CONFIGS.includes(conf)) {
      console.error(`Invalid --config argument: "${args[configIdx + 1]}". Expected one of: ${CONFIGS.join(", ")}`);
      process.exit(1);
    }
    specificConfig = conf;
  }

  const isSmoke = limit !== undefined || args.includes("--smoke");

  console.log("=== Khung Đánh Giá Dịch Vụ Giọng Nói & AI (OQ-5) ===");

  const { systemPrompt, promptSha } = loadPrompt();
  console.log(`Prompt loaded (SHA: ${promptSha})`);

  const samplesPath = path.resolve("scripts/scoring-eval/samples.csv");
  if (!fs.existsSync(samplesPath)) {
    console.error(`❌ Missing samples.csv at ${samplesPath}`);
    process.exit(1);
  }

  const samplesContent = fs.readFileSync(samplesPath, "utf-8");
  const allSamples = parseSamplesCsv(samplesContent);

  if (allSamples.length === 0) {
    console.log("⚠️  `samples.csv` hiện chỉ có tiêu đề và chưa có dữ liệu 30 bài mẫu.");
    console.log("⏸️  Tiến trình tạm dừng vì đang chờ bài mẫu có văn bản đồng ý từ người sở hữu sản phẩm (Task 1.0).");
    process.exit(0);
  }

  // Check audio files
  const missingAudios: string[] = [];
  for (const s of allSamples) {
    if (!fs.existsSync(getAudioPath(s.sample_id))) {
      missingAudios.push(s.sample_id);
    }
  }

  if (missingAudios.length > 0) {
    console.error(`❌ Thiếu ${missingAudios.length} tệp âm thanh trong scripts/scoring-eval/audio/:`);
    console.error(missingAudios.slice(0, 5).join(", ") + (missingAudios.length > 5 ? "..." : ""));
    console.log("⏸️  Tạm dừng vì thiếu âm thanh bài mẫu thực tế.");
    process.exit(1);
  }

  // Check required environment variables
  const requiredKeys = [
    "AZURE_SPEECH_KEY",
    "AZURE_SPEECH_REGION",
    "OPENAI_API_KEY",
    "SPEECHSUPER_APP_KEY",
    "SPEECHSUPER_SECRET_KEY",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_OPUS_MODEL",
    "ANTHROPIC_SONNET_MODEL",
    "ANTHROPIC_HAIKU_MODEL",
  ];
  const missingKeys = requiredKeys.filter((k) => !process.env[k]);

  if (missingKeys.length > 0) {
    console.error("❌ Chưa cấu hình các biến môi trường cần thiết:");
    for (const k of missingKeys) {
      console.error(`   - ${k}`);
    }
    console.error("⏸️  Vui lòng cấu hình file .env cục bộ qua Varlock để tiến hành chạy đánh giá.");
    process.exit(1);
  }

  const selectedConfigs = specificConfig
    ? [specificConfig]
    : [...CONFIGS];

  const targetSamples = limit ? allSamples.slice(0, limit) : allSamples;
  const outDir = path.resolve(
    isSmoke ? "scripts/scoring-eval/results/smoke" : "scripts/scoring-eval/results"
  );
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\nBắt đầu đánh giá ${targetSamples.length} bài mẫu trên ${selectedConfigs.length} cấu hình...`);
  console.log(`Kết quả lưu tại: ${outDir}\n`);

  for (const config of selectedConfigs) {
    const direction: "A" | "B" = config.startsWith("azure") ? "A" : "B";
    const modelAlias = config.replace(/^(azure|speechsuper)-/, "");
    const outFile = path.join(outDir, `${config}.jsonl`);

    // Load existing completed keys to support resuming without double-spending
    const existingKeys = new Set<string>();
    if (fs.existsSync(outFile)) {
      const existingLines = fs.readFileSync(outFile, "utf-8").split("\n").filter((l) => l.trim().length > 0);
      for (const line of existingLines) {
        try {
          const parsedRaw: unknown = JSON.parse(line);
          const record = parsedRaw as { sample_id?: string; run?: number };
          if (record.sample_id && typeof record.run === "number") {
            existingKeys.add(`${record.sample_id}::${record.run}`);
          }
        } catch {
          // ignore malformed line
        }
      }
    }

    const appendStream = fs.createWriteStream(outFile, { flags: "a" });

    for (const sample of targetSamples) {
      const audioPath = getAudioPath(sample.sample_id);
      console.log(`[${config}] Xử lý âm thanh mẫu: ${sample.sample_id}`);

      let speech: SpeechResult | null = null;
      try {
        speech = await getOrComputeSpeech(sample.sample_id, direction, audioPath);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Lỗi xử lý âm thanh (${sample.sample_id}):`, message);

        // Record all 3 attempts as api_error to preserve the 540 count
        for (let run = 1; run <= 3; run++) {
          if (!existingKeys.has(`${sample.sample_id}::${run}`)) {
            const attempt: EvaluationAttempt = {
              sample_id: sample.sample_id,
              config,
              run,
              status: "api_error",
              mode: sample.mode,
              audio_seconds: 0,
              input_tokens: 0,
              output_tokens: 0,
              cost_vnd: 0,
              prompt_sha: promptSha,
              model_id: resolveAnthropicModel(modelAlias),
              temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || "1.0"),
              run_at: new Date().toISOString(),
            };
            appendStream.write(JSON.stringify(attempt) + "\n");
          }
        }
        continue;
      }

      // Run LLM 3 times independently for stability evaluation
      for (let run = 1; run <= 3; run++) {
        if (existingKeys.has(`${sample.sample_id}::${run}`)) {
          console.log(`  [Run ${run}] Đã tồn tại kết quả ok, bỏ qua.`);
          continue;
        }

        const scoreRes = await scoreWithAnthropic(modelAlias, speech.transcript, speech, systemPrompt);
        const attempt: EvaluationAttempt = {
          sample_id: sample.sample_id,
          config,
          run,
          status: scoreRes.status,
          overall_band: scoreRes.output?.overall_band,
          criteria: scoreRes.output?.criteria,
          mode: sample.mode,
          audio_seconds: speech.audio_seconds,
          input_tokens: scoreRes.input_tokens,
          output_tokens: scoreRes.output_tokens,
          cost_vnd: speech.cost_vnd + scoreRes.cost_vnd,
          prompt_sha: promptSha,
          model_id: scoreRes.model_id,
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || "1.0"),
          run_at: new Date().toISOString(),
        };

        appendStream.write(JSON.stringify(attempt) + "\n");
      }
    }

    appendStream.end();
  }

  console.log("\n✅ Hoàn thành lượt đánh giá!");
}

if (process.argv[1] && (process.argv[1].endsWith("/run-eval.ts") || process.argv[1].endsWith("run-eval.ts"))) {
  run().catch((err: unknown) => {
    console.error("Fatal evaluation error:", err);
    process.exit(1);
  });
}
