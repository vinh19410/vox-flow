import { MOCK_EXAM_PROMPTS } from "@vox-flow/api/scoring/mock-exam-bank";

import type { ExamItem, ExamModeOption, ExaminerVoice, Mode, Part, PartInfo } from "./types";

export const MODES: ExamModeOption[] = [
  { id: "full", title: "Full Test", sub: "Đủ 3 part như thi thật", time: "11–14 phút", parts: [1, 2, 3] },
  { id: "p1", title: "Part 1", sub: "Giới thiệu & chủ đề quen thuộc", time: "4–5 phút", parts: [1] },
  { id: "p2", title: "Part 2", sub: "Cue card · 1 phút chuẩn bị", time: "3–4 phút", parts: [2] },
  { id: "p3", title: "Part 3", sub: "Thảo luận sâu, trừu tượng", time: "4–5 phút", parts: [3] },
];

export const VOICES: ExaminerVoice[] = [
  { id: "uk-f", name: "Emma", accent: "Anh · Nữ", tone: "Trung tính, rõ ràng" },
  { id: "us-m", name: "James", accent: "Mỹ · Nam", tone: "Thân thiện, nói nhanh" },
  { id: "au-f", name: "Olivia", accent: "Úc · Nữ", tone: "Ngữ điệu lên xuống" },
];

/** Demo answers for the exam room; the grading bank never carries sample speech. */
const SAMPLE_ANSWERS: Record<string, { answer: string; followUpAnswer?: string }> = {
  "p1-1": {
    answer:
      "I live in an apartment in District 3, it's on the eighth floor. It's quite small but it's really convenient because it's near my office. The only thing is it's quite noisy at night.",
    followUpAnswer:
      "Honestly I just use earplugs, and sometimes I play some rain sounds on my phone so I can fall asleep easier.",
  },
  "p1-2": {
    answer:
      "I think the food. There are so many street food stalls, so I can eat pho or banh mi any time. Also people there is very friendly.",
  },
  "p1-3": {
    answer:
      "Definitely the morning. My mind is much clearer after I wake up, whereas in the evening I'm usually exhausted after work.",
  },
  "p2-1": {
    answer:
      "I'd like to talk about the time I helped my younger cousin prepare for her university entrance exam. It was about two years ago. She was really stressed because her maths score was not good, so I decided to tutor her every weekend for around three months. We usually studied at a coffee shop near her house. I explained the formulas in a simple way and gave her many practice tests. The reason I helped her is because I remember how stressful that exam was for me. In the end she passed with a high score and I felt really proud, maybe even more proud than when I passed my own exam.",
  },
  "p3-1": {
    answer:
      "I think the main reason is pride. Many people, especially men, they think asking for help make them look weak. Another reason is they don't want to bother other people.",
    followUpAnswer:
      "Yes, I believe so. Older generations tend to be more self-reliant, while young people are more open to talking about their problems, partly thanks to social media.",
  },
  "p3-2": {
    answer:
      "Absolutely. Volunteering teaches children empathy and responsibility, which are things you cannot really learn from textbooks. However, it should be voluntary, otherwise it becomes just another obligation.",
  },
};

/** Question text, cue cards and follow-ups come from the canonical server bank; demo answers stay client-side. */
export const ITEMS: ExamItem[] = MOCK_EXAM_PROMPTS.map((prompt) => ({
  id: prompt.id,
  part: prompt.part,
  text: prompt.text,
  answer: SAMPLE_ANSWERS[prompt.id]?.answer,
  cue: prompt.cue,
  followUp: prompt.followUp
    ? { ...prompt.followUp, answer: SAMPLE_ANSWERS[prompt.id]?.followUpAnswer ?? "" }
    : undefined,
}));

// Recommended minimum speaking length per part (feature D): Part 1 short answers stay valid.
export const MIN_WORDS: Record<Part, number> = { 1: 12, 2: 90, 3: 22 };

export const PART_INFO: Record<Part, PartInfo> = {
  1: {
    title: "Part 1 · Giới thiệu & phỏng vấn",
    desc: "Câu hỏi ngắn về bản thân và chủ đề quen thuộc. Giám khảo có thể hỏi nối tiếp theo câu trả lời của bạn.",
    time: "4–5 phút",
  },
  2: {
    title: "Part 2 · Cue card",
    desc: "Bạn có 1 phút chuẩn bị (có thể ghi chú) và nói tối đa 2 phút về chủ đề trên thẻ.",
    time: "3–4 phút",
  },
  3: {
    title: "Part 3 · Thảo luận",
    desc: "Câu hỏi trừu tượng liên quan đến chủ đề Part 2. Hãy đưa lý do và ví dụ.",
    time: "4–5 phút",
  },
};

export const modeLabel = (m: Mode): string => MODES.find((x) => x.id === m)?.title ?? m;
