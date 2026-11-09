export interface PresetAvatar {
  id: string;
  name: string;
  description: string;
  /** Đường dẫn tĩnh tới file SVG trong `apps/web/public/avatars/` (được server-side hook cho phép qua prefix `/avatars/`). */
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: "owl-scholar",
    name: "Cú thông thái",
    description: "Học thuật & tập trung cao độ",
    url: "/avatars/owl-scholar.svg",
  },
  {
    id: "fox-sharp",
    name: "Cáo sắc sảo",
    description: "Phản xạ nhanh & nhạy bén",
    url: "/avatars/fox-sharp.svg",
  },
  {
    id: "cat-cool",
    name: "Mèo bình tĩnh",
    description: "Tự tin & phát âm chuẩn",
    url: "/avatars/cat-cool.svg",
  },
  {
    id: "bear-resilient",
    name: "Gấu kiên trì",
    description: "Vững vàng mục tiêu 8.0+",
    url: "/avatars/bear-resilient.svg",
  },
  {
    id: "panda-fluent",
    name: "Gấu trúc lưu loát",
    description: "Phát âm tự nhiên, vốn từ phong phú",
    url: "/avatars/panda-fluent.svg",
  },
  {
    id: "dolphin-agile",
    name: "Cá heo linh hoạt",
    description: "Ngữ pháp mượt mà, biến hóa linh hoạt",
    url: "/avatars/dolphin-agile.svg",
  },
];
