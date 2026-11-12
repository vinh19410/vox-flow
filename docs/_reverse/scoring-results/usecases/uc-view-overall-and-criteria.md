---
type: reverse-usecase
feature: scoring-results
slug: view-overall-and-criteria
status: draft
updated: 2026-11-11
---

# UC: Xem band tổng và chi tiết từng tiêu chí (reverse, CHƯA duyệt)

**a. Mục tiêu.** Học viên biết mình đạt band nào, vì sao (4 tiêu chí FC, LR, GRA, P), với bằng chứng trích từ chính câu mình nói và gợi ý nâng band. 🟡 [S24: apps/web/src/features/results/components/criterion-detail.tsx:52-98]

**b. Actor và tiền điều kiện.**

| Mục | Nội dung | Nguồn | Nhãn |
|-----|----------|-------|------|
| Primary actor | Học viên (chủ bài thi) | S1: packages/api/src/routers/scoring.ts:22-31 | ✅ |
| Tiền điều kiện | Bài có bản ghi chấm `done` (đủ band tổng, JSON tiêu chí, thời điểm chấm); trang mở bằng mã bài của chính học viên | S1: packages/api/src/routers/scoring.ts:184-192 | ✅ |

**c. Trigger.** Từ màn chấm tự chuyển sang, hoặc học viên mở bài từ lịch sử/dashboard. ✅ [S20: apps/web/src/features/scoring/scoring-screen.tsx:46-49; S26: apps/web/src/routes/_proto/app/history.$attemptId.tsx:11]

**d. Luồng chính.**

| Bước | Hành động | FR | Nguồn | Nhãn |
|------|-----------|----|-------|------|
| 1 | Trang hiện "Đang tải kết quả…" trong lúc hỏi trạng thái và lấy kết quả song song | FR-scoring-results-041 | S23: apps/web/src/features/results/use-scored-result.ts:42-45; S22: apps/web/src/features/results/results-screen.tsx:111-119 | ✅ |
| 2 | Nhãn đầu trang: "Kết quả · Luyện đề Forecast · {ngày}" (bài có chủ đề) hoặc "Kết quả · Thi thử Full Test/Part 1/Part 2/Part 3 · {ngày}" (bài không chủ đề; chế độ lạ → "Thi thử") | FR-scoring-results-047 | S22: apps/web/src/features/results/results-screen.tsx:27-41, apps/web/src/features/results/results-screen.tsx:297-303 | ✅ |
| 3 | Tiêu đề "Bạn đạt band X.X"; thẻ band tổng kèm "Mục tiêu {target}" và nhận xét một dòng | FR-scoring-results-044 | S22: apps/web/src/features/results/results-screen.tsx:316; S24: apps/web/src/features/results/components/band-hero.tsx:28-66 | ✅ |
| 4 | Lưới 4 tiêu chí (FC "Độ trôi chảy & mạch lạc", LR "Vốn từ vựng", GRA "Ngữ pháp", P "Phát âm"), mỗi ô một band, mặc định chọn GRA | FR-scoring-results-044 | S23: apps/web/src/features/results/scored-result.ts:5-12; S22: apps/web/src/features/results/results-screen.tsx:63 | ✅ |
| 5 | Tab "Bằng chứng theo tiêu chí": tóm tắt, "Bằng chứng từ câu bạn nói" (cộng/trừ, trích dẫn, ghi chú, vị trí "Part n · Câu m"), "Cách nâng lên band tiếp theo" | FR-scoring-results-045 | S24: apps/web/src/features/results/components/criterion-detail.tsx:52-98 | ✅ |
| 6 | Học viên bấm tiêu chí khác để xem chi tiết; chọn tiêu chí luôn đưa về tab bằng chứng | FR-scoring-results-045 | S22: apps/web/src/features/results/results-screen.tsx:305-309 | ✅ |

**e. Luồng thay thế và ngoại lệ.**

| Tình huống | Hệ thống làm gì | Error | Nguồn | Nhãn |
|------------|-----------------|-------|-------|------|
| Bài không tồn tại | "Không tìm thấy bài thi" — không có Tải lại | E-scoring-results-001, E-scoring-results-043 | S22: apps/web/src/features/results/results-screen.tsx:121-140 | ✅ |
| Bài của người khác | "Bạn không có quyền xem bài thi này" — không có Tải lại | E-scoring-results-002, E-scoring-results-043 | S25: apps/web/src/features/results/__tests__/scored-results.test.tsx:225-239 | ✅ |
| Lỗi mạng khi tải | "Không tải được kết quả" kèm "Tải lại" | E-scoring-results-042 | S22: apps/web/src/features/results/results-screen.tsx:142-159 | ✅ |
| `done` nhưng kết quả rỗng | Đọc lại 1 lần; vẫn rỗng → "Bài thi đã chấm xong nhưng chưa đọc được kết quả. Bài thi của bạn vẫn được lưu, hãy thử tải lại." | E-scoring-results-041 | S23: apps/web/src/features/results/use-scored-result.ts:49-56; S25: apps/web/src/features/results/__tests__/scored-results.test.tsx:241-263 | ✅ |
| Dữ liệu tiêu chí hỏng | Máy chủ trả lỗi "Score data is unavailable"; trang hiện lỗi tải | E-scoring-results-007 | S1: packages/api/src/routers/scoring.ts:200-204 | ✅ |
| Tiêu chí không có trích dẫn | "Chưa có trích dẫn cho tiêu chí này." | — | S24: apps/web/src/features/results/components/criterion-detail.tsx:55 | ✅ |
| Cờ `FEATURES.scoring` tắt | Không ảnh hưởng: kết quả thật vẫn hiển thị đầy đủ | — | S25: apps/web/src/features/results/__tests__/scored-results.test.tsx:91-139 | ✅ |
| Bài chưa có điểm | Xem UC chấm lại, UC yêu cầu chấm, UC kiểm tra tiến trình | — | S22: apps/web/src/features/results/results-screen.tsx:162-220 | ✅ |

**f. Hậu điều kiện.** Không đổi dữ liệu. Học viên có thể chọn "Thi lại" hoặc "Luyện ngay": cả hai đều chỉ chuyển tới màn chọn đề, không có logic chọn câu yếu nhất (OQ-16). ✅ [S22: apps/web/src/features/results/results-screen.tsx:371, apps/web/src/features/results/results-screen.tsx:414-425]

**g. Quy tắc liên quan.** BR-scoring-results-001..004 (cách ra band), BR-scoring-results-016 (bằng chứng phải nguyên văn), BR-scoring-results-021, BR-scoring-results-024 (một band duy nhất, không khoảng tin cậy). Kết quả thật không bị che (Beta). Nội dung đại diện của tiêu chí lấy từ lần chấm gần trung vị nhất (OQ-17). ✅

**h. Nguồn và câu hỏi mở.** Nguồn S1, S22, S23, S24, S25. OQ-3 (cờ), OQ-5 (thành phần prototype), OQ-14 (bài ít câu), OQ-16, OQ-17. 🟡
