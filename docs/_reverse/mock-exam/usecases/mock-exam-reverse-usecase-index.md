---
type: reverse-usecase-index
feature: mock-exam
status: draft
updated: 2026-11-11
links:
  - docs/_reverse/mock-exam/mock-exam-reverse-spec.md
---

# mock-exam — Use Case Index (reverse)

## Use cases

| Slug | Title | Primary Actor | Related FR | Screens | Errors | OQ | Nguồn | Nhãn |
|------|-------|---------------|-----------|---------|--------|-----|-------|------|
| [uc-chon-che-do-va-giong](./uc-chon-che-do-va-giong.md) | Chọn chế độ thi và giọng giám khảo | Học viên | FR-mock-exam-001..009 | Chọn bài thi, Thiết lập bài thi | — | OQ-1, OQ-13 | [S23: apps/web/src/features/select/components/mode-grid.tsx:15-23] | ✅ |
| [uc-bat-dau-thi-thu](./uc-bat-dau-thi-thu.md) | Bắt đầu hoặc nối lại một lượt thi thử | Học viên (pilot) | FR-mock-exam-010..016 | Phòng thi | E-mock-exam-001, 004 | OQ-6, OQ-12, OQ-14 | [S1: packages/api/src/routers/attempt.ts:21-142] | ✅ |
| [uc-tra-loi-cau-hoi-thi](./uc-tra-loi-cau-hoi-thi.md) | Trả lời các câu hỏi trong phòng thi | Học viên | FR-mock-exam-017..029, FR-mock-exam-030..031 | Phòng thi | E-mock-exam-037, 038 | OQ-2, OQ-3, OQ-5, OQ-11 | [S17: apps/web/src/features/exam/use-exam-session.ts:191-372] | ✅ |
| [uc-nop-bai-thi-thu](./uc-nop-bai-thi-thu.md) | Kiểm tra và nộp bài thi thử | Học viên | FR-mock-exam-039..047 | Hộp thoại Kiểm tra trước khi nộp | E-mock-exam-005..011, 033..036 | OQ-3, OQ-4 | [S20: apps/web/src/features/exam/exam-screen.tsx:60-176] | ✅ |
| [uc-thoat-phong-thi](./uc-thoat-phong-thi.md) | Thoát phòng thi giữa chừng | Học viên | FR-mock-exam-047..048 | Hộp thoại Thoát phòng thi | — | OQ-4, OQ-7 | [S20: apps/web/src/features/exam/exam-screen.tsx:178-184] | ✅ |
| [uc-nghe-lai-audio](./uc-nghe-lai-audio.md) | Nghe lại audio của một câu trả lời | Học viên, Quản trị viên | FR-mock-exam-052..053 | Màn nghe lại (ngoài phạm vi) | E-mock-exam-032 | OQ-1 | [S13: apps/server/src/index.ts:301-394] | ✅ |

## Ma trận UC ↔ FR ↔ Screen ↔ Error ↔ OQ

| FR | UC | Screen | Error | OQ |
|----|----|--------|-------|-----|
| FR-001..009 | uc-chon-che-do-va-giong | Chọn bài thi, Thiết lập | — | OQ-1, OQ-13 |
| FR-010..016 | uc-bat-dau-thi-thu | Phòng thi | E-001, E-002, E-003, E-004 | OQ-6, OQ-12, OQ-14 |
| FR-017..029 | uc-tra-loi-cau-hoi-thi | Phòng thi | E-037 | OQ-2, OQ-3, OQ-5, OQ-11, OQ-15 |
| FR-030..039 | uc-tra-loi-cau-hoi-thi, uc-nop-bai-thi-thu | Phòng thi, Hộp thoại kiểm tra | E-014..031, E-038, E-033 | OQ-9, OQ-14 |
| FR-040..046 | uc-nop-bai-thi-thu | Hộp thoại kiểm tra | E-005..011, E-033..036 | OQ-3, OQ-4 |
| FR-047..048 | uc-thoat-phong-thi, uc-nop-bai-thi-thu | Hộp thoại thoát | — | OQ-4, OQ-7 |
| FR-049..051 | (chưa có UC: không có hành động người dùng) | — | E-012, E-013 | OQ-2, OQ-10 |
| FR-052..053 | uc-nghe-lai-audio | Màn nghe lại | E-032 | OQ-1 |

## Actors

| Actor | Loại | Nguồn |
|-------|------|-------|
| Học viên | người | [S25: apps/web/src/routes/_proto/exam.tsx:5-7] |
| Học viên pilot | người | [S1: packages/api/src/routers/attempt.ts:44-57] |
| Quản trị viên | người | [S32: packages/api/src/auth-utils.ts:28-33] |
| Giám khảo ảo (giọng đọc trình duyệt) | hệ thống | [S24: apps/web/src/lib/speech.ts:17-43] |
| Kho audio | ngoài | [S13: apps/server/src/index.ts:226-228] |

## Ghi chú

* Use case **tái lập chưa duyệt** từ nguồn — mỗi mệnh đề mang nhãn ✅/🔵/🟡. Chạy `/usecase mock-exam` (downstream mode) sau khi có SRS chính thức để điền traceability đầy đủ.
* Nguồn chỉ đủ cho use case nào thì viết use case đó. Chức năng sinh câu hỏi nối tiếp bằng AI (FR-049..051) không có hành động người dùng nào gọi nó nên **không** viết use case; ghi Gap ở `reverse-gaps.md` (OQ-2).
* Các UC có sơ đồ luồng tương ứng ở `../srs/mock-exam-reverse-flows.md` (Flow 1 ↔ chọn chế độ; Flow 2 ↔ bắt đầu; Flow 3/4 ↔ trả lời; Flow 5 ↔ nộp; Flow 6 ↔ thoát; Flow 8 ↔ nghe lại).
