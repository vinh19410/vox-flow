import { z } from "zod";
import { getFallbackFollowUp } from "./fallback-data";

export const FollowUpResultSchema = z.object({
  // Bounded: the text is seeded by the client-controlled transcript, so a
  // runaway generation falls back to a canned question instead of reaching
  // the client.
  questionText: z.string().min(5).max(300),
  // Same untrusted-generation class as questionText: bounded at the schema so
  // a runaway generation falls back instead of reaching the client.
  triggerPhrase: z.string().min(1).max(200),
});

export type FollowUpResult = z.infer<typeof FollowUpResultSchema>;

export type GenerateFollowUpOptions = {
  candidateTranscript?: string;
  part?: number;
  questionText?: string;
  apiKey?: string;
  timeoutMs?: number;
};

export async function generateFollowUp(
  options: GenerateFollowUpOptions,
): Promise<FollowUpResult> {
  const { candidateTranscript = "", part = 1, apiKey, timeoutMs = 4000 } = options;

  if (!candidateTranscript.trim() || !apiKey) {
    const fallback = getFallbackFollowUp(part);
    return {
      questionText: fallback.text,
      triggerPhrase: fallback.trigger,
    };
  }

  // Prevent delimiter breakouts and prompt injection
  const sanitized = candidateTranscript.replace(/<\/?candidate_transcript>/gi, "").trim();

  const prompt = `You are an expert IELTS Speaking examiner.
A candidate just answered a Part ${part} question.
Here is the candidate's spoken response:
<candidate_transcript>
${sanitized}
</candidate_transcript>

Generate ONE natural, concise follow-up question (under 25 words) that directly follows up on a specific idea or phrase the candidate mentioned.
Respond ONLY with a JSON object in this exact format:
{
  "triggerPhrase": "the exact phrase or idea from candidate response you are following up on",
  "questionText": "the follow-up question"
}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      throw new Error(`LLM API returned ${res.status}`);
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty LLM response");
    }

    const parsed = JSON.parse(content);
    return FollowUpResultSchema.parse(parsed);
  } catch {
    const fallback = getFallbackFollowUp(part);
    return {
      questionText: fallback.text,
      triggerPhrase: fallback.trigger,
    };
  }
}

export const LinkedQuestionResultSchema = z.object({
  questionText: z.string().min(5).max(300),
  triggerPhrase: z.string().max(160),
});

export type LinkedQuestionResult = z.infer<typeof LinkedQuestionResultSchema>;

export type GenerateLinkedQuestionOptions = {
  previousQuestionText: string;
  candidateTranscript?: string;
  nextQuestionText: string;
  previousPart?: number;
  part?: number;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type GeneratedLinkedQuestion = {
  questionText: string;
  triggerPhrase: string;
  linked: boolean;
};

const LINKED_DELIMITER_RE = /<\/?\s*(?:previous_question|candidate_transcript|next_question)\b[^>]*>/gi;

function stripLinkedDelimiterTags(text: string): string {
  return text.replace(LINKED_DELIMITER_RE, "").trim();
}

/**
 * Bridges the next scheduled IELTS Speaking question onto a specific detail from
 * the candidate's previous spoken response using `gpt-4o-mini`, falling back
 * cleanly to the unlinked `nextQuestionText` on any error or missing input.
 */
export async function generateLinkedQuestion(
  options: GenerateLinkedQuestionOptions,
): Promise<GeneratedLinkedQuestion> {
  const {
    previousQuestionText,
    candidateTranscript = "",
    nextQuestionText,
    previousPart,
    part,
    apiKey,
    timeoutMs = 4000,
    fetchImpl,
  } = options;

  const fallback = (): GeneratedLinkedQuestion => ({
    questionText: nextQuestionText,
    triggerPhrase: "",
    linked: false,
  });

  if (!candidateTranscript.trim() || !apiKey) {
    return fallback();
  }

  const sanitizedPrevious = stripLinkedDelimiterTags(previousQuestionText);
  const sanitizedTranscript = stripLinkedDelimiterTags(candidateTranscript);
  const sanitizedNext = stripLinkedDelimiterTags(nextQuestionText);

  if (!sanitizedTranscript) {
    return fallback();
  }

  const isPart2To3 = previousPart === 2 && part === 3;
  const partContext =
    previousPart !== undefined && part !== undefined
      ? `Transitioning from Part ${previousPart} to Part ${part}.`
      : part !== undefined
        ? `Current section: Part ${part}.`
        : "";
  const part2To3Guidance = isPart2To3
    ? "Since this transitions from the Part 2 long turn to Part 3 discussion, bridge smoothly from the candidate's Part 2 talk into the Part 3 question."
    : "";

  const prompt = `You are an expert IELTS Speaking examiner.
${partContext}
Here is the previous question asked:
<previous_question>
${sanitizedPrevious}
</previous_question>

Here is the candidate's spoken response:
<candidate_transcript>
${sanitizedTranscript}
</candidate_transcript>

Here is the next scheduled question:
<next_question>
${sanitizedNext}
</next_question>

Keep the core intent and topic of <next_question> while rewriting or bridging it into ONE natural, concise spoken examiner question (under 35 words) that connects to or references a specific detail from <candidate_transcript>.
${part2To3Guidance}
Respond ONLY with a JSON object in this exact format:
{
  "triggerPhrase": "<short exact idea/phrase from candidate_transcript, <= 12 words>",
  "questionText": "<the bridged question>"
}`;

  try {
    const fetchFn = fetchImpl ?? fetch;
    const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      return fallback();
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallback();
    }

    const parsed = LinkedQuestionResultSchema.parse(JSON.parse(content));
    const questionText = stripLinkedDelimiterTags(parsed.questionText);
    const triggerPhrase = stripLinkedDelimiterTags(parsed.triggerPhrase);

    if (questionText.trim().length < 5) {
      return fallback();
    }

    return {
      questionText,
      triggerPhrase,
      linked: true,
    };
  } catch {
    return fallback();
  }
}
