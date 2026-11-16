export interface Plan {
  id: "pack" | "week" | "exam" | "month";
  name: string;
  price: number;
  unit: string;
  points: number;
  perks: string[];
  best?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "pack",
    name: "Theo lượt",
    price: 49000,
    unit: "3 lượt chi tiết",
    points: 0,
    perks: ["Mở chi tiết 4 tiêu chí + bằng chứng cho 3 bài", "Không hết hạn", "Dùng theo mức 3 điểm miễn phí/ngày"],
  },
  {
    id: "week",
    name: "7 ngày",
    price: 99000,
    unit: "/ tuần",
    points: 48,
    perks: ["48 điểm thi trong 7 ngày (không trần ngày)", "Mở chi tiết 4 tiêu chí trong thời hạn gói", "Báo lỗi chấm ưu tiên"],
  },
  {
    id: "exam",
    name: "Đến ngày thi",
    price: 349000,
    unit: "trọn gói",
    points: 180,
    perks: ["180 điểm thi đến hết ngày thi (tối đa 60 ngày)", "Mở chi tiết 4 tiêu chí trong thời hạn gói", "Hết hạn tự dừng, không tự gia hạn"],
    best: true,
  },
  {
    id: "month",
    name: "30 ngày",
    price: 249000,
    unit: "/ tháng",
    points: 120,
    perks: ["120 điểm thi trong 30 ngày (không trần ngày)", "Mở chi tiết 4 tiêu chí trong thời hạn gói", "Cộng dồn điểm & ngày khi mua thêm"],
  },
];
