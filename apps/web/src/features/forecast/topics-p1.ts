import { p1 } from "./builders";
import type { ForecastTopic } from "./types";

export const FORECAST_P1: ForecastTopic[] = [
  p1(
    "f-hometown",
    "Hometown",
    "Bản thân",
    412,
    "2 ngày trước",
    [
      [
        "Where is your hometown?",
        "My hometown is Hue, a city in central Vietnam. It used to be the capital, so it has a lot of old palaces and temples.",
      ],
      [
        "What do you like most about it?",
        "I love how peaceful it is. Life there moves slowly, and the food is quite spicy, which I really enjoy.",
      ],
      [
        "Has your hometown changed much in recent years?",
        "Yes, quite a lot. There are more hotels and cafes now because of tourism, but the old town still looks the same.",
      ],
    ],
    "hot",
    {
      at: 1,
      text: "You said the food is spicy. Which local dish would you recommend to a visitor?",
      trigger: "the food is quite spicy",
      answer:
        "Definitely bun bo Hue. It is a beef noodle soup with lemongrass and chilli, and it is much richer than pho.",
    },
  ),
  p1("f-weather", "Weather", "Đời sống", 286, "4 ngày trước", [
    [
      "What kind of weather do you like?",
      "I prefer cool and dry weather, like in autumn, because I can go out without sweating all the time.",
    ],
    [
      "Does the weather affect your mood?",
      "Definitely. When it rains for days I feel a bit lazy, whereas sunny mornings make me much more productive.",
    ],
    [
      "Do you check the weather forecast often?",
      "Almost every morning, mainly to decide whether I need a raincoat when I ride my motorbike to work.",
    ],
  ]),
  p1(
    "f-ai",
    "Artificial intelligence",
    "Công nghệ",
    198,
    "Hôm qua",
    [
      [
        "Do you use AI tools in your daily life?",
        "Yes, I use chatbots to summarise long articles and to check my English writing before I send emails.",
      ],
      [
        "Do you think AI will change your job?",
        "I think so. Some repetitive tasks like making reports will probably be done by AI, so I need to learn new skills.",
      ],
      [
        "Would you trust AI to make important decisions?",
        "Not completely. It can give good suggestions, but I would still want a human to make the final decision.",
      ],
    ],
    "new",
    {
      at: 0,
      text: "You mentioned checking your writing. How accurate do you find it?",
      trigger: "check my English writing",
      answer:
        "Mostly accurate for grammar, but sometimes it changes my meaning, so I always read the result again carefully.",
    },
  ),
  p1(
    "f-reading",
    "Reading",
    "Sở thích",
    233,
    "3 ngày trước",
    [
      [
        "Do you like reading?",
        "Yes, I do, especially novels. Reading helps me relax after a long day looking at a computer screen.",
      ],
      [
        "Do you prefer paper books or e-books?",
        "Paper books, definitely. I like the feeling of turning pages, although e-books are more convenient when travelling.",
      ],
      [
        "What did you read when you were a child?",
        "Mostly comics, like Doraemon. My parents did not really like it, but it made me love reading.",
      ],
    ],
    "hot",
  ),
  p1("f-shoes", "Shoes", "Mua sắm", 154, "1 tuần trước", [
    [
      "Do you like buying shoes?",
      "Not really. I only buy a new pair when my old ones are worn out, usually once or twice a year.",
    ],
    [
      "What kind of shoes do you usually wear?",
      "Mostly sneakers, because they are comfortable and I walk a lot, but I wear leather shoes for meetings.",
    ],
    [
      "Have you ever bought shoes online?",
      "Yes, a few times. It is cheaper, but the size is sometimes wrong, so I prefer trying them on in a store.",
    ],
  ]),
  p1(
    "f-sleep",
    "Sleep",
    "Sức khỏe",
    121,
    "5 ngày trước",
    [
      [
        "How many hours do you usually sleep?",
        "Around six or seven hours on weekdays, which is honestly not enough, but I try to catch up at weekends.",
      ],
      [
        "Do you take naps during the day?",
        "Yes, a short nap after lunch is very common in Vietnam. Twenty minutes is enough to keep me awake all afternoon.",
      ],
      [
        "What do you do if you cannot sleep?",
        "I usually listen to a podcast or some calm music instead of looking at my phone, because the light keeps me awake.",
      ],
    ],
    "new",
  ),
  p1("f-friends", "Friends", "Con người", 175, "6 ngày trước", [
    [
      "Do you prefer having a few close friends or many friends?",
      "A few close friends. I would rather have people I can really trust than a lot of people I hardly know.",
    ],
    [
      "How often do you meet your friends?",
      "About once a week. We usually go for coffee on Saturday morning and talk about our work and our plans.",
    ],
    [
      "Is it easy to make friends as an adult?",
      "Not really. Everyone is busy with work and family, so it takes more time to build a real friendship.",
    ],
  ]),
];
