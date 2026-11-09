export interface ScoringStep {
  t: string;
  d: string;
}

export const SCORING_STEPS: ScoringStep[] = [
  { t: "Chuyển giọng nói thành văn bản", d: "6 câu trả lời · 412 từ" },
  { t: "Đo phát âm & tốc độ nói", d: "128 từ/phút · 4 lần ngập ngừng" },
  { t: "Chấm lần 1", d: "" },
  { t: "Chấm lần 2", d: "" },
  { t: "Chấm lần 3", d: "" },
  { t: "Lấy trung vị & tính khoảng tin cậy", d: "" },
];
