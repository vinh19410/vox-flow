export const vnd = (n: number): string => `${n.toLocaleString("vi-VN")}đ`;

export const fmtBand = (n: number): string => n.toFixed(1);

export const mmss = (s: number): string =>
  `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.floor(Math.max(s, 0) % 60)).padStart(2, "0")}`;

export const daysUntil = (iso: string | null): number | null =>
  iso
    ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
    : null;
