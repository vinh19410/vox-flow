import { p23 } from "./builders";
import type { ForecastTopic } from "./types";

export const FORECAST_P23: ForecastTopic[] = [
  p23(
    "f-helped",
    "A time you helped someone",
    "Sự kiện",
    367,
    "Hôm qua",
    {
      title: "Describe a time when you helped someone.",
      points: ["who you helped", "how you helped them", "why you helped them"],
      ending: "and explain how you felt about helping this person.",
      answer:
        "I'd like to talk about the time I helped my younger cousin prepare for her university entrance exam. It was about two years ago. She was really stressed because she was struggling with maths, so I decided to tutor her every weekend for around three months. We usually studied at a coffee shop near her house. I explained the formulas in a simple way and gave her many practice tests. The reason I helped her is that I remember how stressful that exam was for me. In the end she passed with a high score and I felt really proud.",
    },
    [
      [
        "Why do some people prefer not to ask others for help?",
        "I think the main reason is pride. Many people believe that asking for help makes them look weak. Another reason is that they do not want to bother other people.",
      ],
      [
        "Should schools encourage children to do volunteer work?",
        "Absolutely. Volunteering teaches children empathy and responsibility, which they cannot really learn from textbooks. However, it should be voluntary, otherwise it becomes just another obligation.",
      ],
    ],
    "hot",
    {
      at: 0,
      text: "You mentioned pride. Do you think this differs between generations?",
      trigger: "the main reason is pride",
      answer:
        "Yes, I believe older generations tend to be more self-reliant, while young people are more open to talking about their problems.",
    },
  ),
  p23(
    "f-app",
    "A useful app you use",
    "Công nghệ",
    241,
    "2 ngày trước",
    {
      title: "Describe an app that you find useful.",
      points: ["what the app is", "how you found out about it", "what you use it for"],
      ending: "and explain why you think it is useful.",
      answer:
        "The app I want to talk about is a language learning app called Duolingo. I found out about it from a colleague about a year ago, when I mentioned that I wanted to learn Japanese before a business trip. I use it every morning on the bus, usually for about fifteen minutes. It gives me short lessons with vocabulary, listening and speaking exercises, and it reminds me if I forget to practise. I think it is useful because it turns studying into a habit. Before using it, I always gave up after a few weeks, but now I have kept going for nearly a year.",
    },
    [
      [
        "Do you think people spend too much time on their phones?",
        "Yes, I do. Many people check their phones hundreds of times a day, often without any real purpose, which affects their concentration and their sleep.",
      ],
      [
        "How has technology changed the way people learn?",
        "It has made learning much more flexible. People can study anywhere, at any time, and they can find free resources, although it is easier to get distracted.",
      ],
    ],
    "new",
  ),
  p23(
    "f-place",
    "A quiet place you like",
    "Địa điểm",
    189,
    "4 ngày trước",
    {
      title: "Describe a quiet place you like to spend time in.",
      points: ["where it is", "how you found it", "what you do there"],
      ending: "and explain why you like spending time there.",
      answer:
        "I'd like to describe a small library near my apartment. It is on the second floor of an old building, so most people walk past without noticing it. I found it by accident one afternoon when I was looking for somewhere to escape the heat. Since then, I have gone there almost every Sunday. I usually read novels or prepare for my English exam, and sometimes I just sit by the window and watch the street. I like it because it is completely silent and nobody disturbs me there. It is the only place where I can really focus without checking my phone.",
    },
    [
      [
        "Why is it hard to find quiet places in cities?",
        "Mainly because cities are crowded and there is constant traffic and construction. Public spaces are usually designed for activity rather than relaxation.",
      ],
      [
        "Do young and old people need quiet places for different reasons?",
        "I think so. Older people often want quiet to rest, whereas young people usually need it to study or to escape from social pressure.",
      ],
    ],
  ),
  p23(
    "f-goal",
    "A goal you want to achieve",
    "Bản thân",
    132,
    "1 tuần trước",
    {
      title: "Describe a goal you would like to achieve in the future.",
      points: ["what the goal is", "when you set it", "what you need to do to achieve it"],
      ending: "and explain why this goal is important to you.",
      answer:
        "One goal I really want to achieve is studying for a master's degree in Australia. I set this goal about two years ago after attending a seminar about studying abroad. To achieve it, I first need to get at least a band seven in IELTS, which is why I am practising every day. I also need to save money, so I have started putting aside part of my salary every month. This goal is important to me because I want to work in international marketing, and I believe studying abroad will give me both the knowledge and the confidence I need.",
    },
    [
      [
        "Is it important for young people to have goals?",
        "Yes, because goals give them direction. Without a clear goal, it is easy to waste time on things that do not really matter in the long run.",
      ],
      [
        "Why do some people give up on their goals?",
        "Often because their goals are too big and they do not see progress quickly. Breaking a goal into smaller steps can help people stay motivated.",
      ],
    ],
  ),
];
