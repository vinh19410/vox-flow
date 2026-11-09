import type { ResultData } from "./types";

export const RESULT: ResultData = {
  overall: 6.5,
  range: [6.0, 7.0],
  runs: [6.5, 6.5, 6.0],
  oneLiner:
    "Trả lời trôi chảy, có mở rộng ý; điểm nghẽn chính là lỗi hòa hợp chủ–vị và từ vựng còn phổ thông.",
  criteria: [
    {
      key: "FC",
      name: "Fluency & Coherence",
      vi: "Độ trôi chảy & mạch lạc",
      band: 6.5,
      range: [6.0, 6.5],
      runs: [6.5, 6.5, 6.0],
      summary: "Nói liền mạch, ít ngập ngừng; dùng từ nối đúng nhưng còn lặp “because”, “so”.",
      metrics: [
        { label: "Tốc độ nói", value: "128 từ/phút" },
        { label: "Ngập ngừng", value: "4 lần / 3 phút" },
        { label: "Từ nối khác nhau", value: "7" },
      ],
      evidence: [
        {
          quote: "It was about two years ago… In the end she passed with a high score",
          where: "Part 2",
          kind: "plus",
          note: "Kể chuyện theo trình tự thời gian rõ ràng, có mở – thân – kết.",
        },
        {
          quote: "whereas in the evening I’m usually exhausted after work",
          where: "Part 1 · Câu 3",
          kind: "plus",
          note: "Dùng “whereas” để đối lập ý tự nhiên.",
        },
        {
          quote: "it’s really convenient because… so I can eat pho",
          where: "Part 1 · Câu 1–2",
          kind: "minus",
          note: "Lặp “because/so” 9 lần trong bài — hạn chế mức 7.0.",
        },
      ],
      improve: [
        {
          from: "because it’s near my office",
          to: "given that it’s just a stone’s throw from my office",
          why: "Đa dạng hóa từ nối chỉ nguyên nhân.",
        },
      ],
    },
    {
      key: "LR",
      name: "Lexical Resource",
      vi: "Vốn từ vựng",
      band: 6.0,
      range: [6.0, 6.5],
      runs: [6.0, 6.5, 6.0],
      summary:
        "Đủ từ để diễn đạt mọi chủ đề, có vài collocation tốt nhưng phần lớn là từ phổ thông.",
      metrics: [
        { label: "Từ ít phổ biến", value: "6%" },
        { label: "Collocation đúng", value: "5" },
        { label: "Dùng sai từ", value: "2" },
      ],
      evidence: [
        {
          quote: "older generations tend to be more self-reliant",
          where: "Part 3 · Nối tiếp",
          kind: "plus",
          note: "“self-reliant” là từ ít phổ biến, dùng đúng ngữ cảnh.",
        },
        {
          quote: "it’s quite small but it’s really convenient",
          where: "Part 1 · Câu 1",
          kind: "minus",
          note: "Tính từ chung chung (“small”, “convenient”, “good”) lặp lại nhiều.",
        },
        {
          quote: "her maths score was not good",
          where: "Part 2",
          kind: "minus",
          note: "Có thể thay bằng “she was struggling with maths”.",
        },
      ],
      improve: [
        {
          from: "her maths score was not good",
          to: "she was really struggling with maths",
          why: "Collocation tự nhiên hơn, thể hiện vốn từ band 7.",
        },
        {
          from: "it’s quite small",
          to: "it’s on the cramped side",
          why: "Diễn đạt ít phổ biến, đúng sắc thái.",
        },
      ],
    },
    {
      key: "GRA",
      name: "Grammatical Range & Accuracy",
      vi: "Ngữ pháp",
      band: 6.0,
      range: [5.5, 6.0],
      runs: [6.0, 6.0, 5.5],
      summary: "Có câu phức nhưng lỗi hòa hợp chủ–vị lặp lại, đôi khi gây khó hiểu nhẹ.",
      metrics: [
        { label: "Câu không lỗi", value: "68%" },
        { label: "Câu phức", value: "41%" },
        { label: "Lỗi lặp lại", value: "Chủ–vị (3)" },
      ],
      evidence: [
        {
          quote: "people there is very friendly",
          where: "Part 1 · Câu 2",
          kind: "minus",
          note: "Lỗi hòa hợp: “people” số nhiều → “are”.",
        },
        {
          quote: "asking for help make them look weak",
          where: "Part 3 · Câu 1",
          kind: "minus",
          note: "Danh động từ làm chủ ngữ → “makes”.",
        },
        {
          quote: "The reason I helped her is because I remember…",
          where: "Part 2",
          kind: "plus",
          note: "Câu phức có mệnh đề quan hệ rút gọn.",
        },
      ],
      improve: [
        {
          from: "Many people, especially men, they think",
          to: "Many people, especially men, think",
          why: "Bỏ chủ ngữ lặp “they”.",
        },
      ],
    },
    {
      key: "P",
      name: "Pronunciation",
      vi: "Phát âm",
      band: 7.0,
      range: [6.5, 7.0],
      runs: [7.0, 7.0, 6.5],
      summary: "Dễ hiểu suốt bài, nhấn trọng âm câu tốt. Âm cuối /s/, /t/ đôi khi bị nuốt.",
      metrics: [
        { label: "Độ rõ (ước lượng)", value: "92%" },
        { label: "Âm cuối bị mất", value: "7 từ" },
        { label: "Ngữ điệu", value: "Tự nhiên" },
      ],
      evidence: [
        {
          quote: "Definitely the morning.",
          where: "Part 1 · Câu 3",
          kind: "plus",
          note: "Nhấn trọng âm câu đúng, tạo nhấn mạnh tự nhiên.",
        },
        {
          quote: "formulas · tests · weekends",
          where: "Part 2",
          kind: "minus",
          note: "Mất âm cuối /s/ – /ts/ ở 3 từ số nhiều.",
        },
      ],
      improve: [{ from: "/test/", to: "/tests/", why: "Bật rõ cụm phụ âm cuối /sts/." }],
    },
  ],
};
