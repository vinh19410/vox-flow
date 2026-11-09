import type { MarkStyle, MarkType, ReviewItem } from "@/features/results/types";

export const MARK: Record<MarkType, MarkStyle> = {
  grammar: { label: "Ngữ pháp", cls: "bg-bad-soft text-bad decoration-bad", dot: "bg-bad" },
  vocab: { label: "Từ vựng", cls: "bg-info-soft text-info decoration-info", dot: "bg-info" },
  pron: { label: "Phát âm", cls: "bg-warn-soft text-warn decoration-warn", dot: "bg-warn" },
};

export const REVIEW: ReviewItem[] = [
  {
    id: "r1",
    label: "Part 1 · Câu 1",
    q: "Do you live in a house or an apartment?",
    dur: 14,
    segs: [
      "I live in an apartment in District 3, it’s on the eighth floor. It’s ",
      {
        t: "quite small",
        type: "vocab",
        fix: "on the cramped side",
        note: "Từ phổ thông, lặp lại nhiều lần.",
      },
      " but it’s really convenient because it’s near my office. The only thing is it’s quite noisy at night.",
    ],
  },
  {
    id: "r2",
    label: "Part 1 · Nối tiếp",
    q: "What do you usually do to deal with the noise?",
    dur: 8,
    followUp: true,
    trigger: "quite noisy at night",
    segs: [
      "Honestly I just use earplugs, and sometimes I play some rain sounds on my phone so I can fall asleep ",
      {
        t: "easier",
        type: "grammar",
        fix: "more easily",
        note: "Cần trạng từ bổ nghĩa cho động từ “fall asleep”.",
      },
      ".",
    ],
  },
  {
    id: "r3",
    label: "Part 1 · Câu 2",
    q: "What do you like most about your neighbourhood?",
    dur: 10,
    segs: [
      "I think the food. There are so many street food stalls, so I can eat pho or banh mi any time. Also ",
      {
        t: "people there is",
        type: "grammar",
        fix: "people there are",
        note: "“people” là danh từ số nhiều.",
      },
      " very friendly.",
    ],
  },
  {
    id: "r4",
    label: "Part 2",
    q: "Describe a time when you helped someone.",
    dur: 96,
    segs: [
      "I’d like to talk about the time I helped my younger cousin prepare for her university entrance exam. She was really stressed because ",
      {
        t: "her maths score was not good",
        type: "vocab",
        fix: "she was struggling with maths",
        note: "Collocation tự nhiên hơn.",
      },
      ", so I decided to tutor her every weekend for around three months. I explained the formulas in a simple way and gave her many practice ",
      {
        t: "tests",
        type: "pron",
        fix: "/tests/",
        note: "Âm cuối /sts/ bị nuốt thành /tes/.",
      },
      ". In the end she passed with a high score and I felt really proud.",
    ],
  },
  {
    id: "r5",
    label: "Part 3 · Câu 1",
    q: "Why do some people prefer not to ask others for help?",
    dur: 13,
    segs: [
      "I think the main reason is pride. Many people, especially men, ",
      {
        t: "they think",
        type: "grammar",
        fix: "think",
        note: "Chủ ngữ bị lặp.",
      },
      " asking for help ",
      {
        t: "make",
        type: "grammar",
        fix: "makes",
        note: "Danh động từ làm chủ ngữ đi với động từ số ít.",
      },
      " them look weak.",
    ],
  },
];
