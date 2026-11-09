export interface PresetAvatar {
  id: string;
  name: string;
  description: string;
  url: string;
}

function svgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: "owl-scholar",
    name: "Cú thông thái",
    description: "Học thuật & tập trung cao độ",
    url: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#EEF2FF" stroke="#6366F1" stroke-width="3"/>
        <path d="M28 26 L38 38 L30 42 Z" fill="#6366F1"/>
        <path d="M72 26 L62 38 L70 42 Z" fill="#6366F1"/>
        <ellipse cx="50" cy="56" rx="34" ry="30" fill="#818CF8"/>
        <ellipse cx="50" cy="62" rx="24" ry="20" fill="#EEF2FF"/>
        <circle cx="38" cy="48" r="13" fill="#FFFFFF" stroke="#312E81" stroke-width="2.5"/>
        <circle cx="62" cy="48" r="13" fill="#FFFFFF" stroke="#312E81" stroke-width="2.5"/>
        <line x1="51" y1="48" x2="49" y2="48" stroke="#312E81" stroke-width="3"/>
        <circle cx="40" cy="48" r="5" fill="#312E81"/>
        <circle cx="60" cy="48" r="5" fill="#312E81"/>
        <polygon points="50,53 46,60 54,60" fill="#F59E0B"/>
      </svg>
    `),
  },
  {
    id: "fox-sharp",
    name: "Cáo sắc sảo",
    description: "Phản xạ nhanh & nhạy bén",
    url: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#FFF7ED" stroke="#F97316" stroke-width="3"/>
        <polygon points="22,18 36,44 18,38" fill="#EA580C"/>
        <polygon points="78,18 64,44 82,38" fill="#EA580C"/>
        <polygon points="26,24 35,42 22,38" fill="#FFEDD5"/>
        <polygon points="74,24 65,42 78,38" fill="#FFEDD5"/>
        <ellipse cx="50" cy="56" rx="32" ry="26" fill="#F97316"/>
        <path d="M22 56 Q35 78 50 82 Q65 78 78 56 Z" fill="#FFFFFF"/>
        <ellipse cx="38" cy="50" rx="3.5" ry="4.5" fill="#1C1917"/>
        <ellipse cx="62" cy="50" rx="3.5" ry="4.5" fill="#1C1917"/>
        <circle cx="50" cy="66" r="4" fill="#1C1917"/>
      </svg>
    `),
  },
  {
    id: "cat-cool",
    name: "Mèo bình tĩnh",
    description: "Tự tin & phát âm chuẩn",
    url: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F0FDF4" stroke="#10B981" stroke-width="3"/>
        <polygon points="25,22 40,40 22,36" fill="#059669"/>
        <polygon points="75,22 60,40 78,36" fill="#059669"/>
        <polygon points="28,26 38,38 25,35" fill="#D1FAE5"/>
        <polygon points="72,26 62,38 75,35" fill="#D1FAE5"/>
        <circle cx="50" cy="55" r="30" fill="#34D399"/>
        <ellipse cx="37" cy="52" rx="4" ry="5" fill="#064E3B"/>
        <ellipse cx="63" cy="52" rx="4" ry="5" fill="#064E3B"/>
        <polygon points="50,60 47,63 53,63" fill="#F43F5E"/>
        <path d="M44 65 Q50 69 56 65" stroke="#064E3B" stroke-width="2" fill="none" stroke-linecap="round"/>
        <line x1="20" y1="58" x2="30" y2="60" stroke="#064E3B" stroke-width="1.8"/>
        <line x1="80" y1="58" x2="70" y2="60" stroke="#064E3B" stroke-width="1.8"/>
      </svg>
    `),
  },
  {
    id: "bear-resilient",
    name: "Gấu kiên trì",
    description: "Vững vàng mục tiêu 8.0+",
    url: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#FEF3C7" stroke="#D97706" stroke-width="3"/>
        <circle cx="26" cy="30" r="12" fill="#B45309"/>
        <circle cx="74" cy="30" r="12" fill="#B45309"/>
        <circle cx="26" cy="30" r="7" fill="#FDE68A"/>
        <circle cx="74" cy="30" r="7" fill="#FDE68A"/>
        <circle cx="50" cy="56" r="32" fill="#D97706"/>
        <ellipse cx="50" cy="65" rx="16" ry="12" fill="#FEF3C7"/>
        <ellipse cx="50" cy="60" rx="6" ry="4" fill="#78350F"/>
        <ellipse cx="38" cy="48" rx="3.5" ry="4" fill="#78350F"/>
        <ellipse cx="62" cy="48" rx="3.5" ry="4" fill="#78350F"/>
        <path d="M46 68 Q50 71 54 68" stroke="#78350F" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: "panda-fluent",
    name: "Gấu trúc lưu loát",
    description: "Phát âm tự nhiên, vốn từ phong phú",
    url: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F8FAFC" stroke="#334155" stroke-width="3"/>
        <circle cx="24" cy="28" r="13" fill="#0F172A"/>
        <circle cx="76" cy="28" r="13" fill="#0F172A"/>
        <circle cx="50" cy="56" r="32" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
        <ellipse cx="36" cy="48" rx="7.5" ry="9" fill="#0F172A" transform="rotate(-15 36 48)"/>
        <ellipse cx="64" cy="48" rx="7.5" ry="9" fill="#0F172A" transform="rotate(15 64 48)"/>
        <circle cx="36" cy="47" r="2.5" fill="#FFFFFF"/>
        <circle cx="64" cy="47" r="2.5" fill="#FFFFFF"/>
        <ellipse cx="50" cy="62" rx="4.5" ry="3" fill="#0F172A"/>
        <path d="M45 66 Q50 70 55 66" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: "dolphin-agile",
    name: "Cá heo linh hoạt",
    description: "Ngữ pháp mượt mà, biến hóa linh hoạt",
    url: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F0F9FF" stroke="#0284C7" stroke-width="3"/>
        <path d="M20 54 Q35 24 68 28 Q84 32 86 46 Q80 44 70 48 Q55 52 38 68 Z" fill="#0284C7"/>
        <path d="M30 60 Q45 42 70 48 Q55 68 36 72 Z" fill="#BAE6FD"/>
        <circle cx="68" cy="38" r="3" fill="#082F49"/>
        <circle cx="69" cy="37" r="1" fill="#FFFFFF"/>
        <path d="M74 44 Q79 46 82 43" stroke="#082F49" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M48 24 Q52 14 62 20 Q56 24 54 26 Z" fill="#0284C7"/>
      </svg>
    `),
  },
];
