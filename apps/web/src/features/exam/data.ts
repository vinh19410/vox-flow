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

export const ITEMS: ExamItem[] = [
  {
    id: "p1-1",
    part: 1,
    text: "Let's talk about where you live. Do you live in a house or an apartment?",
    answer:
      "I live in an apartment in District 3, it's on the eighth floor. It's quite small but it's really convenient because it's near my office. The only thing is it's quite noisy at night.",
    followUp: {
      text: "You mentioned it gets quite noisy. What do you usually do to deal with the noise?",
      trigger: "quite noisy at night",
      answer:
        "Honestly I just use earplugs, and sometimes I play some rain sounds on my phone so I can fall asleep easier.",
    },
  },
  {
    id: "p1-2",
    part: 1,
    text: "What do you like most about your neighbourhood?",
    answer:
      "I think the food. There are so many street food stalls, so I can eat pho or banh mi any time. Also people there is very friendly.",
  },
  {
    id: "p1-3",
    part: 1,
    text: "Do you prefer studying in the morning or in the evening?",
    answer:
      "Definitely the morning. My mind is much clearer after I wake up, whereas in the evening I'm usually exhausted after work.",
  },
  {
    id: "p2-1",
    part: 2,
    text: "Describe a time when you helped someone.",
    cue: {
      title: "Describe a time when you helped someone.",
      points: ["who you helped", "how you helped them", "why you helped them"],
      ending: "and explain how you felt about helping this person.",
    },
    answer:
      "I'd like to talk about the time I helped my younger cousin prepare for her university entrance exam. It was about two years ago. She was really stressed because her maths score was not good, so I decided to tutor her every weekend for around three months. We usually studied at a coffee shop near her house. I explained the formulas in a simple way and gave her many practice tests. The reason I helped her is because I remember how stressful that exam was for me. In the end she passed with a high score and I felt really proud, maybe even more proud than when I passed my own exam.",
  },
  {
    id: "p3-1",
    part: 3,
    text: "Why do you think some people prefer not to ask others for help?",
    answer:
      "I think the main reason is pride. Many people, especially men, they think asking for help make them look weak. Another reason is they don't want to bother other people.",
    followUp: {
      text: "You said pride is a big factor. Do you think this differs between generations?",
      trigger: "the main reason is pride",
      answer:
        "Yes, I believe so. Older generations tend to be more self-reliant, while young people are more open to talking about their problems, partly thanks to social media.",
    },
  },
  {
    id: "p3-2",
    part: 3,
    text: "Should schools encourage children to do volunteer work?",
    answer:
      "Absolutely. Volunteering teaches children empathy and responsibility, which are things you cannot really learn from textbooks. However, it should be voluntary, otherwise it becomes just another obligation.",
  },
];

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
