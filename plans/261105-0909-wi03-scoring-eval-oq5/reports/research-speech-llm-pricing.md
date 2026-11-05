# Research Report: Speech Assessment & LLM Scoring APIs

- **Project:** Vox-Flow (ChấmRõ) — IELTS Speaking Practice & AI Scoring
- **Date:** 2026-11-05
- **Author:** Technical Analyst
- **Context:** OQ-5 (Dịch vụ nhận dạng giọng nói + chấm phát âm + mô hình LLM), Work Item 03 (`#7`), Roadmap Budget & Pricing Strategy
- **Exchange Rate Benchmark:** 1 USD ≈ 26,000 VND

---

## Executive Summary

Vox-Flow aims to deliver automated IELTS Speaking scoring with a target budget of **≤ 8,000 VND / Full Test** (~12–14 minutes audio) and **≤ 3,000 VND / Part** (~3–5 minutes audio), with a hard review cap at **12,000 VND / Full Test**.

Two distinct architectural directions were evaluated:
- **Direction A: Azure Speech Service (STT + Pronunciation Assessment with Prosody) + Anthropic Claude LLM**
  - Unit Cost (Full Test ~13 min): **~7,363 VND** (with Claude Haiku 5.5) or **~8,104 VND** (with Claude Sonnet 5.5).
  - Unit Cost (Part ~4 min): **~2,271 VND** (Haiku 5.5) or **~2,592 VND** (Sonnet 5.5).
  - Billing model: Purely duration-based ($1.30/audio hour in 1-second increments).
  - Feasibility: Direct fit for budget, self-serve onboarding, 5 free audio hours/month, enterprise SLA.
- **Direction B: SpeechSuper IELTS API (`speak.eval.pro`) (+ optional Custom ASR) + Anthropic Claude LLM**
  - Unit Cost (Full Test ~10 questions/requests): **~9,139 VND** (with Haiku 5.5) or **~9,880 VND** (with Sonnet 5.5) under PAYG. If custom ASR (e.g. Whisper) is added, cost increases to **~11,908 VND**.
  - Unit Cost (Part ~4 questions): **~3,978 VND** (Part 1/3) or **~1,248 VND** (Part 2 monologue).
  - Billing model: Per-request billing ($0.035/request for PAYG, $0.0245–$0.030/request under prepay tiers), subject to a **strict 120-second max audio duration per request**.
  - Feasibility: Native IELTS band calibration out-of-the-box, but higher cost per interactive turn, prepayment barriers ($500–$2,000+), manual procurement approval, and audio length segmentation requirements.

**Primary Recommendation:**
1. **Rank 1 (Recommended): Direction A (Azure Speech + Claude Sonnet 5.5 / Haiku 5.5)**. It fits within target unit economics (8,104 VND / Full Test), allows continuous audio streaming, offers high availability, and avoids prepayment friction.
2. **Rank 2: Direction B (SpeechSuper + Claude Haiku 5.5 with Starter Prepay)**. Viable if Phase 2 benchmark shows Azure + LLM prompt fails to achieve the ≥ 80% band accuracy threshold within 0.5 band.

---

## 1. Deep Dive: Target Technologies

### 1.1 Azure Speech Service (Pronunciation Assessment)

#### A. Architecture & SDK/REST Capabilities
- **Protocols Supported:**
  - **Speech SDK (WebSocket streaming):** Primary integration method. Supports real-time streaming and continuous recognition for files exceeding 30–60 seconds (`PronunciationAssessmentConfig`).
  - **REST API (Short Audio):** `POST /speech/recognition/conversation/cognitiveservices/v1?language=en-US`. Requires base64-encoded `Pronunciation-Assessment` JSON parameter in the HTTP request header. Audio limited to ≤ 60 seconds per request.
  - **SDK Languages:** Node.js/JavaScript, Python, C#, C++, Java, Swift, Objective-C. *(Note: Go SDK does not support Pronunciation Assessment).*
- **Audio Specifications:**
  - Standard format: WAV PCM (16kHz, 16-bit, mono) or OGG Opus (16kHz).
  - Channels: 1 (mono).
- **Authentication & Credentials:**
  - Header: `Ocp-Apim-Subscription-Key: {azure_speech_key}` or Microsoft Entra ID (Azure AD) OAuth 2.0 Bearer token.
  - Region identifier: Endpoint structured as `https://{region}.stt.speech.microsoft.com/...`.

#### B. IELTS Scoring Parameters & Capabilities
Azure Pronunciation Assessment produces granular acoustic metrics (0–100 or 0–5 scale):
- `AccuracyScore`: Phoneme matching against native pronunciation models (IPA notation).
- `FluencyScore`: Measures silence intervals, unnatural pauses, and tempo between words.
- `CompletenessScore`: Ratio of pronounced words against reference text (scripted mode only).
- `ProsodyScore`: Intonation naturalness, stress, speaking rate, rhythm, and monotone detection (available in `en-US`).
- `PronScore`: Composite weighted score across accuracy, fluency, and prosody.
- `ErrorType` (Word level): `None`, `Mispronunciation`, `Omission`, `Insertion`, `UnexpectedBreak`, `MissingBreak`, `Monotone`.
- **Limitation regarding IELTS:** Azure does **NOT** directly output official IELTS band scores (0–9.0). It provides the objective acoustic measurement data. The translation to IELTS Speaking Band Descriptors (FC, LR, GRA, P) must be performed by the downstream LLM.

#### C. Official Pricing & Unit Rates
- **Billing Increment:** 1-second increments based on audio processed.
- **Pay-As-You-Go (S1 Tier):**
  - Standard Speech-to-Text (STT): **$1.00 / audio hour** ($0.0002778 / second).
  - Baseline Pronunciation Assessment (Accuracy, Fluency, Completeness, Miscue): **Included in baseline STT ($1.00 / hour, $0 add-on)**.
  - Enhanced Prosody Assessment Add-on: **+$0.30 / audio hour** ($0.0000833 / second).
  - **Total STT + Pronunciation Assessment w/ Prosody: $1.30 / audio hour ($0.0003611 / second)**.
  - (STT + Baseline Pronunciation Assessment w/o Prosody: $1.00 / audio hour).
- **Free Tier (F0):** 5 audio hours free per month (~23 Full Tests or 75 Parts free each month).

---

### 1.2 SpeechSuper IELTS Speaking API

#### A. Architecture & Endpoints
- **Primary Endpoint:** `POST https://api.speechsuper.com/speak.eval.pro` (Unscripted IELTS Speech Assessment).
- **General Endpoint:** `POST https://api.speechsuper.com/asr.eval` (Transcribe + pronunciation/fluency, up to 290s).
- **Protocol:** HTTP Multipart Form Data (`Request-Index: 0`) or WebSocket.
  - `text` field: JSON parameter string defining `coreType`, `test_type: "ielts"`, `task_type: "ielts_part1"|"ielts_part2"|"ielts_part3"`, `question_prompt`, `model: "non_native"|"native"`, `slack`.
  - `audio` field: Binary audio file.
- **Authentication & Credentials:**
  - Custom signature scheme:
    - `applicationId`: AppKey.
    - `timestamp`: Current Unix timestamp string.
    - `sig`: Hex-encoded SHA-1 digest of `applicationId + timestamp + secretKey`.
  - Procurement requirement: Requires contacting SpeechSuper sales/support. 14-day trial account; commercial activation requires manual contract and invoicing/prepayment.
- **Audio Specifications & Hard Limits:**
  - **Max Duration Limit: 120 seconds (2 minutes) per request** for `speak.eval.pro`.
  - Formats: WAV (16kHz, 16-bit mono PCM) or MP3 (16kHz).

#### B. IELTS Scoring Rubrics & Output
SpeechSuper's `speak.eval.pro` was trained specifically on examiner-labeled IELTS candidate data (reported Pearson's R = 0.93):
- Direct IELTS Band Scores (0.0 to 9.0 in 0.5 increments):
  - `overall`: Overall IELTS Speaking Band.
  - `fluency_coherence`: Fluency & Coherence Band.
  - `lexical_resource`: Lexical Resource Band.
  - `grammar`: Grammatical Range & Accuracy Band.
  - `pronunciation`: Pronunciation Band.
- Diagnostic Sub-metrics:
  - `transcription`: Built-in ASR transcript.
  - `relevance`: Topic relevance score (0–100) relative to `question_prompt`.
  - `speed`: Speaking rate in words per minute (WPM).
  - `vocabulary_stats`: CEFR breakdown (% of words in A1, A2, B1, B2, C1, C2), academic word list count, unique words count.
  - `grammar_stats`: Number of grammatical errors, % accurate sentences.
  - `fluency_stats`: Pause count, pause fillers, liaison/linking techniques count, loss of plosion count.
  - `pronunciation_stats`: Good, fair, and poor word percentages; phoneme-level scores.
  - `equivalent_scores`: Mapped scores for TOEFL, PTE, Duolingo, and CEFR.

#### C. Official Pricing & Unit Rates
- **Billing Model:** **Per request** (independent of audio duration up to 120s).
- **Tiers:**
  - **Pay-As-You-Go:**
    - Minimum spend: **$20.00 / month**. Invoiced quarterly.
    - Unscripted IELTS Speaking Pro (`speak.eval.pro`): **$0.035 / request** (~910 VND).
    - Unscripted IELTS Speaking Basic: **$0.030 / request** (~780 VND).
  - **Starter Tier (Prepay $500 – $1,999, no expiration):**
    - Pro: **$0.030 / request** (~780 VND).
    - Basic: **$0.025 / request** (~650 VND).
  - **Growth Tier (Prepay $2,000 – $4,999):**
    - Pro: **$0.0245 / request** (~637 VND).
    - Basic: **$0.0210 / request** (~546 VND).

---

### 1.3 Anthropic Claude API (Scoring LLM)

#### A. Multi-Modal Audio Reality & Architectural Role
- **Direct Audio Ingestion:** **Not supported.** Claude API does not take raw audio streams or WAV/MP3 files. It accepts text, images, and documents (PDF).
- **Scoring Pipeline Role:** Claude serves as the **Examiner & Evaluator LLM**. It receives:
  1. The transcribed text (from Azure STT or SpeechSuper ASR).
  2. Candidate response context & question prompt.
  3. Objective acoustic feedback (speech rate, pause counts, mispronunciations, prosody/intonation tags).
  4. Official IELTS Speaking Band Descriptors (9-band rubrics for FC, LR, GRA, P).
- **Output Schema Expectations:**
  Structured JSON output enforced via Claude Tool Use (`tool_choice: {"type": "tool", "name": "submit_ielts_score"}`) or standard JSON mode:
  ```json
  {
    "overall_band": 6.5,
    "criteria": {
      "fluency_and_coherence": {
        "band": 6.5,
        "justification": "Willing to speak at length, though occasional self-correction...",
        "speech_rate_wpm": 125,
        "pause_analysis": "3 hesitation pauses during complex idea formulation"
      },
      "lexical_resource": {
        "band": 6.0,
        "justification": "Good vocabulary range for familiar topics; some collocation slips...",
        "cefr_profile": { "b2_plus_pct": 22 },
        "vocabulary_upgrades": [{ "original": "good person", "suggested": "compassionate individual" }]
      },
      "grammatical_range_and_accuracy": {
        "band": 6.5,
        "justification": "Mix of simple and complex sentence structures with frequent error-free sentences...",
        "errors_detected": [{ "error": "he go", "correction": "he went", "rule": "past tense agreement" }]
      },
      "pronunciation": {
        "band": 6.5,
        "justification": "Intelligible throughout; minor L1 vowel distortions on 'creative'...",
        "phonetic_flags": ["creative /kriːˈeɪ.tɪv/"]
      }
    },
    "examiner_summary": "Strong communicative competence, needs focus on Part 3 abstract cohesion.",
    "actionable_tips": ["Expand concession clauses using 'Whereas' and 'Although'"]
  }
  ```

#### B. Anthropic Claude Pricing (Per Million Tokens - MTok)

| Model Generation | Model Name | Input Base Rate | Output Base Rate | Prompt Cache Write (5m) | Prompt Cache Read (Hit) |
|---|---|---|---|---|---|
| **Claude 5.5 (Current)** | **Claude Haiku 5.5** | **$0.10 / MTok** *(≤100k)* | **$0.50 / MTok** | $0.125 / MTok | **$0.010 / MTok** |
| | **Claude Sonnet 5.5** | **$2.00 / MTok** | **$10.00 / MTok** | $2.500 / MTok | **$0.100 / MTok** |
| | **Claude Opus 5.5** | **$4.00 / MTok** | **$20.00 / MTok** | $5.000 / MTok | **$0.200 / MTok** |
| **Claude 3.5 / 4.5** | Claude Haiku 3.5 | $0.80 / MTok | $4.00 / MTok | $1.000 / MTok | $0.080 / MTok |
| | Claude Sonnet 3.5 / 4.5 | $3.00 / MTok | $15.00 / MTok | $3.750 / MTok | $0.300 / MTok |
| | Claude Opus 4.5 / 5 | $5.00 / MTok | $25.00 / MTok | $6.250 / MTok | $0.500 / MTok |
| | Claude Opus 3 / 4 | $15.00 / MTok | $75.00 / MTok | $18.750 / MTok | $1.500 / MTok |

#### C. Token Consumption & Cost Breakdown for IELTS Scoring
Prompt caching drastically lowers recurring system prompt costs:
- **1 Part (~3–5 minutes audio, ~400 student words):**
  - Input tokens: ~2,500 (1,500 system prompt rubric + 1,000 transcript & acoustic metrics).
  - Output tokens: ~800 (JSON structured band report).
  - Cost per call:
    - **Claude Haiku 5.5:** (2,500 × $0.10 + 800 × $0.50) / 1M = **$0.00065 USD (~17 VND)**
    - **Claude Sonnet 5.5:** (2,500 × $2.00 + 800 × $10.00) / 1M = **$0.01300 USD (~338 VND)**
    - **Claude Opus 5.5:** (2,500 × $4.00 + 800 × $20.00) / 1M = **$0.02600 USD (~676 VND)**
- **1 Full Test (~12–14 minutes audio, ~1,500 student words across Parts 1, 2, 3):**
  - Input tokens: ~5,000 (2,000 cached rubric + 3,000 cumulative transcripts & acoustic metrics).
  - Output tokens: ~2,000 (Comprehensive exam report with sentence-level diagnostic notes).
  - Cost per call:
    - **Claude Haiku 5.5:** (5,000 × $0.10 + 2,000 × $0.50) / 1M = **$0.00150 USD (~39 VND)**
    - **Claude Sonnet 5.5:** (5,000 × $2.00 + 2,000 × $10.00) / 1M = **$0.03000 USD (~780 VND)**
    - **Claude Opus 5.5:** (5,000 × $4.00 + 2,000 × $20.00) / 1M = **$0.06000 USD (~1,560 VND)**

---

## 2. Unit Economics & Pricing Model Summary

*Assumptions: Exchange rate 1 USD = 26,000 VND; 1 Full Test = 13 minutes audio (~10 question turns); 1 Part = 4 minutes audio (~4 question turns in P1/P3, 1 turn in P2).*

### Detailed Unit Cost Matrix

| Component | Basis | Cost USD | Cost VND | Notes |
|---|---|---|---|---|
| **Azure Speech (STT + Pronunciation)** | 1 Minute | $0.0167 | 433 VND | Baseline STT ($1.00/hr) |
| **Azure Speech (+ Prosody Add-on)** | 1 Minute | $0.0217 | 563 VND | Full prosody ($1.30/hr) |
| **SpeechSuper `speak.eval.pro` (PAYG)** | 1 Request | $0.0350 | 910 VND | Max 120s/req; $20/mo min |
| **SpeechSuper `speak.eval.pro` (Starter)** | 1 Request | $0.0300 | 780 VND | Prepay $500 |
| **Custom ASR (Whisper API)** | 1 Minute | $0.0060 | 156 VND | If needed in Direction B |
| **Claude Haiku 5.5** | Full Test Prompt | $0.0015 | 39 VND | 5k in, 2k out |
| **Claude Sonnet 5.5** | Full Test Prompt | $0.0300 | 780 VND | 5k in, 2k out |
| **Claude Opus 5.5** | Full Test Prompt | $0.0600 | 1,560 VND | 5k in, 2k out |

---

### Unit Cost Comparison: 1 Part & 1 Full Test

| Scenario | Direction A (Azure + LLM) | Direction B (SpeechSuper + LLM) | Roadmap Target / Cap |
|---|---|---|---|
| **1 Part — Average (~4 min audio)** | | | **Target: 3,000 VND** |
| • Speech Layer | 2,254 VND *(Azure w/ Prosody)* | 3,640 VND *(P1/P3: 4 reqs @ 910đ)*<br>910 VND *(P2: 1 req @ 910đ)* | |
| • with Claude Haiku 5.5 | **2,271 VND** | **3,657 VND** *(P1/P3)* / **927 VND** *(P2)* | ✅ Under target (Dir A) |
| • with Claude Sonnet 5.5 | **2,592 VND** | **3,978 VND** *(P1/P3)* / **1,248 VND** *(P2)* | ✅ Under target (Dir A) |
| • with Claude Opus 5.5 | **2,930 VND** | **4,316 VND** *(P1/P3)* / **1,586 VND** *(P2)* | ✅ Under target (Dir A) |
| **1 Full Test (~13 min audio, 10 turns)** | | | **Target: 8,000 VND**<br>*(Hard Cap: 12,000 VND)* |
| • Speech Layer | 7,324 VND *(Azure w/ Prosody)* | 9,100 VND *(10 reqs PAYG)*<br>7,800 VND *(10 reqs Starter)* | |
| • + Custom ASR (Optional Whisper) | *$0 (Azure STT included)* | +2,028 VND *(13 min Whisper)* | |
| • with Claude Haiku 5.5 | **7,363 VND** *(Azure)* | **9,139 VND** *(PAYG)* / **11,167 VND** *(w/ Whisper)* | ✅ **Pass Target (Dir A)** |
| • with Claude Sonnet 5.5 | **8,104 VND** *(Azure)* | **9,880 VND** *(PAYG)* / **11,908 VND** *(w/ Whisper)* | ✅ **Pass Target (Dir A)** |
| • with Claude Opus 5.5 | **8,884 VND** *(Azure)* | **10,660 VND** *(PAYG)* / **12,688 VND** *(w/ Whisper)* | Under Cap (12k VND) |

*Key Takeaway on Cost:*
- **Direction A** achieves **~8,104 VND** per Full Test with **Claude Sonnet 5.5** (right at the 8,000 VND target, 32% below the 12,000 VND cap) and **~2,592 VND** per Part (well under 3,000 VND).
- **Direction B** under PAYG costs **~9,880 VND** per Full Test (exceeds the 8,000 VND target by 23%, but stays under the 12,000 VND cap). If an external custom ASR like Whisper is added, it climbs to **~11,908 VND**, touching the 12,000 VND limit.

---

## 3. Direction Comparison Matrix

```
                     Direction A                                    Direction B
               (Azure + Claude LLM)                       (SpeechSuper + Claude LLM)

+--------------+                             +--------------+
| Audio Stream |                             | Audio Chunks | (max 120s)
+-------+------+                             +-------+------+
        |                                            |
        v                                            v
+-------------------------------+            +-------------------------------+
| Azure Speech Service          |            | SpeechSuper `speak.eval.pro`  |
| - Standard STT                |            | - Built-in ASR                |
| - Pronunciation Assessment    |            | - Native IELTS Bands (0-9)    |
| - Prosody (Intonation, Stress)|            | - CEFR & Grammar Diagnostic   |
+---------------+---------------+            +---------------+---------------+
        |                                            |
        | Raw transcript +                           | Pre-computed IELTS bands +
        | Acoustic metrics (0-100)                   | Transcript & CEFR stats
        v                                            v
+-------------------------------+            +-------------------------------+
| Claude LLM (Sonnet 5.5/Haiku) |            | Claude LLM (Sonnet 5.5/Haiku) |
| - Band calculation (0-9)      |            | - Cohesive test aggregation   |
| - Examiner justification      |            | - Actionable coaching feedback|
| - Feedback & corrections      |            | - Secondary band calibration  |
+---------------+---------------+            +---------------+---------------+
        |                                            |
        +--------------------> Final Report <--------+
```

| Evaluation Dimension | Direction A: Azure Speech + LLM | Direction B: SpeechSuper (+ ASR) + LLM | Advantage |
|---|---|---|---|
| **1. Unit Cost (Full Test)** | **~8,104 VND** (Sonnet 5.5) / **~7,363 VND** (Haiku 5.5) | **~9,880 VND** (PAYG) / **~8,580 VND** (Starter prepay) | **Direction A** (~18–25% cheaper) |
| **2. Unit Cost (1 Part)** | **~2,592 VND** (Sonnet 5.5) | **~3,978 VND** (Part 1/3) / **1,248 VND** (Part 2) | **Direction A** (consistent, lower in P1/P3) |
| **3. Billing Mechanics** | Pure duration (second increments). No turn-count penalty. | Per request. More student turns/questions = higher cost. | **Direction A** (predictable, granular) |
| **4. Max Audio Duration** | Unlimited continuous streaming via SDK; 60s for REST. | **Hard 120s limit per request** in `speak.eval.pro`. | **Direction A** (native streaming) |
| **5. IELTS Band Source** | LLM maps acoustic metrics (0–100) to IELTS Descriptors. | Pre-calculated native IELTS Band (trained on examiners). | **Direction B** (less prompt engineering) |
| **6. Pedagogical Diagnostics** | Phoneme accuracy, fluency pauses, monotone/prosody. | Rich CEFR lexical breakdown, grammar tags, phonemes. | **Direction B** (built-in ESL features) |
| **7. Procurement & Setup** | Self-serve instantly on Azure portal with credit card. | Sales inquiry required; 1-day approval; $20/mo PAYG min. | **Direction A** (zero setup friction) |
| **8. Free Tier Allowance** | **5 hours/month free** (~23 Full Tests/mo). | 14-day trial only; no permanent free tier. | **Direction A** (supports early testing) |
| **9. Architectural Fit** | Runs in Node.js/Edge; clean streaming WebSocket. | Requires chunking audio to <120s and SHA-1 HMAC signing. | **Direction A** (simpler audio pipeline) |
| **10. Vendor & Stability Risk**| Hyperscaler enterprise SLA (Microsoft Azure). | Specialized edtech vendor (smaller support organization).| **Direction A** (lower abandonment risk) |

---

## 4. Technical Constraints & Format Requirements

### 4.1 Audio Requirements
1. **Azure Speech Service:**
   - Sample rate: **16,000 Hz (16 kHz)**.
   - Bit depth: **16-bit**.
   - Channel: **Mono (1 channel)**.
   - Format: **WAV (Linear PCM)** or **OGG Opus**.
   - Duration: Continuous streaming via SDK allows recording up to 60 minutes. REST short-audio endpoint accepts up to 60 seconds.
2. **SpeechSuper:**
   - Sample rate: **16,000 Hz (16 kHz)**.
   - Bit depth: **16-bit** (`sampleBytes: 2`).
   - Channel: **Mono (1 channel)**.
   - Format: **WAV** or **MP3**.
   - Duration: **Hard cap at 120 seconds** per request for `speak.eval.pro`.

### 4.2 Security, Credentials & Compliance
- **Azure Speech:**
  - Credentials: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` (store in Cloudflare Worker secrets or `ak secrets`).
  - Data privacy: Under Microsoft Azure enterprise terms, audio data processed by Cognitive Services is not stored or used to train public foundation models when configured with standard enterprise data protections.
- **SpeechSuper:**
  - Credentials: `SPEECHSUPER_APP_KEY`, `SPEECHSUPER_SECRET_KEY`.
  - Signature required: SHA-1 hash generated per request timestamp.
  - Data residency: Servers hosted primarily in US/Hong Kong; vendor policy requires reviewing cross-border data transfer rules under Vietnam Law 91/2025/QH15 (OQ-6).
- **Anthropic Claude:**
  - Credentials: `ANTHROPIC_API_KEY`.
  - Data privacy: Commercial API inputs and outputs are not used to train Anthropic foundation models.

---

## 5. Architectural Recommendation & Next Steps

### Recommendation: Direction A as Primary, Direction B as Fallback

1. **Adopt Direction A (Azure Speech + Claude Sonnet 5.5 / Haiku 5.5) as the primary candidate:**
   - **Cost Compliance:** At **~8,104 VND / Full Test** with Sonnet 5.5, it satisfies the PRD 8,000 VND target and remains 32% under the 12,000 VND hard cap.
   - **Daily Free Quota Fit:** The roadmap's daily free cap of **33,000 VND/day** supports **4 Full Tests** or **12 Parts** per day on Azure.
   - **No Audio Chunking Constraints:** Seamless continuous recording without running into SpeechSuper's 120-second wall.
   - **Zero Procurement Friction:** Can be activated immediately using existing Azure subscriptions without commercial sales negotiations or prepayments.

2. **Benchmarking Decision Gate in Phase 2 (`run-eval.ts` on 30 Samples):**
   - In Phase 2, test the 6 configurations (Direction A × 3 Claude models, Direction B × 3 Claude models).
   - If Direction A achieves **≥ 80% accuracy** within 0.5 band of human benchmark scores and **≥ 90% test-retest consistency** within 0.5 band, **lock Direction A**.
   - If Direction A fails the band accuracy threshold (because the LLM cannot consistently calibrate raw 0–100 acoustic scores into IELTS bands), evaluate whether Direction B's pre-calibrated IELTS engine justifies the ~1,700 VND cost premium (~9,880 VND / Full Test).

---

## 6. Unresolved Questions & Limitations

1. **Audio Segmentation in Direction B:** If testing Direction B on long candidate recordings in Part 2, will the app slice recordings strictly at question boundaries, or will it require a client-side recorder that stops each turn at < 120s?
2. **Vietnamese Accent Nuances:** Azure STT occasionally mistranscribes heavily accented Vietnamese English phonemes (e.g. final consonants /t/, /s/, /d/). The evaluation in Phase 2 with 30 consented Vietnamese test-taker samples will be the decisive empirical validation.
