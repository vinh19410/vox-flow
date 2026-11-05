export type FallbackFollowUp = {
  trigger: string;
  text: string;
};

export type FallbackExamItem = {
  id: string;
  part: number;
  text: string;
  cue?: string[];
  followUp?: FallbackFollowUp;
};

export const FALLBACK_QUESTIONS: Record<number, FallbackFollowUp[]> = {
  1: [
    { trigger: "living area", text: "You mentioned the area where you live. Do you think you will continue living there for a long time?" },
    { trigger: "daily routine", text: "How does your daily routine affect your free time during the week?" },
    { trigger: "hometown", text: "Has your hometown changed much since you were a child?" },
    { trigger: "studies / work", text: "What do you find most interesting about what you are currently doing?" },
  ],
  2: [
    { trigger: "experience", text: "Do you think other people in your family share similar experiences?" },
    { trigger: "reflection", text: "How has that particular experience influenced your choices today?" },
  ],
  3: [
    { trigger: "broader impact", text: "Looking at society as a whole, do you believe this trend will continue in the next decade?" },
    { trigger: "comparison", text: "How do younger generations view this issue differently compared to older generations?" },
    { trigger: "future perspective", text: "What measures could governments or communities take to address this situation?" },
  ],
};

export function getFallbackFollowUp(part = 1): FallbackFollowUp {
  const defaultPool = FALLBACK_QUESTIONS[1] as FallbackFollowUp[];
  const pool = FALLBACK_QUESTIONS[part] ?? defaultPool;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return choice ?? { trigger: "general", text: "Could you tell me a little more about that?" };
}
