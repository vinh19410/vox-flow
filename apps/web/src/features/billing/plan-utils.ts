import type { Plan } from "./data";

const DAY_MS = 24 * 60 * 60 * 1000;

export function planUntil(p: Pick<Plan, "id">, examDate: string | null): string {
  const now = Date.now();
  if (p.id === "pack") return "Không hết hạn · 3 lượt";
  if (p.id === "exam" && examDate) {
    const examEndMs = Date.parse(`${examDate}T23:59:59.999+07:00`);
    const capMs = now + 60 * DAY_MS;
    const targetMs = Number.isNaN(examEndMs) ? capMs : Math.min(examEndMs, capMs);
    return formatExpiryFull(targetMs);
  }
  const d = new Date(now);
  d.setDate(d.getDate() + (p.id === "week" ? 7 : p.id === "exam" ? 60 : 30));
  return d.toLocaleDateString("vi-VN");
}

export function formatExamDateVn(examDate: string): string {
  const ms = Date.parse(`${examDate}T23:59:59.999+07:00`);
  return Number.isNaN(ms) ? examDate : formatExpiryFull(ms);
}

export function formatExpiryShort(ms: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(ms));
}

export function formatExpiryFull(ms: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ms));
}
