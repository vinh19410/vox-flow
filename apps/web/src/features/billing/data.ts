export interface Plan {
  id: string;
  name: string;
  price: number;
  unit: string;
  perks: string[];
  best?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "pack",
    name: "Theo lượt",
    price: 49000,
    unit: "3 lượt chi tiết",
    perks: ["Chi tiết 4 tiêu chí + bằng chứng", "Không hết hạn", "Phù hợp thử nghiệm"],
  },
  {
    id: "week",
    name: "7 ngày",
    price: 99000,
    unit: "/ tuần",
    perks: ["Không giới hạn lượt chi tiết", "Xem lại từng câu, đánh dấu lỗi", "Báo lỗi chấm ưu tiên"],
  },
  {
    id: "exam",
    name: "Đến ngày thi",
    price: 349000,
    unit: "trọn gói",
    perks: ["Mọi quyền lợi gói tuần", "Dùng đến hết ngày thi", "Hết hạn tự dừng, không tự gia hạn"],
    best: true,
  },
  {
    id: "month",
    name: "30 ngày",
    price: 249000,
    unit: "/ tháng",
    perks: ["Không giới hạn lượt chi tiết", "Xem lại từng câu, đánh dấu lỗi", "Hủy bất cứ lúc nào"],
  },
];
