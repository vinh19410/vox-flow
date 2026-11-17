export const vnd = (n: number): string => `${n.toLocaleString("vi-VN")}đ`;

export const fmtBand = (n: number): string => n.toFixed(1);

export function formatDateTime(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
