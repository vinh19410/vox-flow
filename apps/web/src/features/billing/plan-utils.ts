import type { Plan } from "./data";

export function planUntil(p: Plan, examDate: string | null): string {
  const d = new Date();
  if (p.id === "exam" && examDate) return new Date(examDate).toLocaleDateString("vi-VN");
  if (p.id === "pack") return "Không hết hạn · 3 lượt";
  d.setDate(d.getDate() + (p.id === "week" ? 7 : p.id === "exam" ? 60 : 30));
  return d.toLocaleDateString("vi-VN");
}
