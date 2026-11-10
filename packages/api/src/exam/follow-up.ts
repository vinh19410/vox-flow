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
