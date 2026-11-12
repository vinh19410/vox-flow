# mock-exam — Gaps & Open Questions

> Trạng thái: draft, CHƯA duyệt. Nguồn tra ở [`reverse-sources.md`](./reverse-sources.md). Negative-search ghi trong khối `<details>` cuối file.

## 1. Open Questions

* [ ] OQ-1: Mức ưu tiên (P0/P1/P2) của từng FR/NFR và mục tiêu nghiệp vụ của thi thử (vì sao có 4 chế độ, vì sao Full Test được "Khuyên dùng") là gì? — *(liên quan: Mục 3, 4, FR-mock-exam-001..053 · cần: PO/BA)*
* [ ] OQ-2: Câu hỏi nối tiếp bằng AI (đã có ở máy chủ, có kiểm thử) có định nối vào phòng thi không? Hiện phòng thi chỉ dùng hai câu nối tiếp cố định (khóa kết thúc "-f") nên không "bám sát câu trả lời", trong khi phụ đề màn chọn bài thi và dòng chip "dựa trên … trong câu trả lời của bạn" nói như thể có. Nếu có, nguồn transcript lấy ở đâu (trong phòng thi không có transcript)? — *(liên quan: Mục 3 FR-021, FR-049..051, Conflict C-1 · cần: PO)*
* [ ] OQ-3: Số từ trong phòng thi là ước lượng (2,6 từ/giây, chặn bởi số từ của câu trả lời mẫu demo) và dòng được nối lại có số từ cố định 20; ngưỡng cảnh báo 12/90/22 từ có ý nghĩa gì khi số từ không phải thật? Có định dùng số từ chép lời thật không? — *(liên quan: FR-029, BR-013 · cần: PO/dev)*
* [ ] OQ-4: Trạng thái "abandoned" của lượt thi: có tiến trình nào sẽ ghi (hủy khi thoát, quá hạn)? Hiện thoát phòng thi không hủy gì; lượt "đang làm" cũ chỉ được nối lại khi cùng chế độ. Lượt tồn đọng có bị dọn không? — *(liên quan: FR-014, FR-048, BR-018, E-008 · cần: PO/dev)*
* [ ] OQ-5: Khi học viên từ chối quyền micro hoặc thiết bị không có ghi âm, phòng thi không hiện thông báo (không đọc trạng thái lỗi của bộ ghi) và vẫn cho "trả lời"; cuối cùng nộp sẽ bị từ chối vì không có câu nào. Thông báo mong muốn là gì? — *(liên quan: E-037, FR-023 · cần: PO/UX)*
* [ ] OQ-6: Khi cổng pilot đóng (FORBIDDEN) hoặc bất kỳ lỗi khởi tạo nào, client chỉ chuyển sang trạng thái đồng bộ "failed" mà không báo lý do; ở bước nộp học viên được đưa sang màn chấm điểm "chỉ cục bộ". Có cần thông báo riêng cho học viên không thuộc danh sách pilot? — *(liên quan: E-001, FR-011, FR-042 · cần: PO/UX)*
* [ ] OQ-7: Thoát giữa chừng ("Các câu đã trả lời sẽ không được chấm") — câu chữ gợi ý bài bị bỏ, nhưng hệ thống không hủy lượt thi, không xóa audio đã lên và không xóa bản sao thiết bị. Chính sách lưu giữ/xóa audio của lượt bị bỏ là gì? — *(liên quan: FR-048 · cần: PO/pháp lý)*
* [ ] OQ-8: Chỉ số thành công của thi thử (tỷ lệ hoàn tất, tỷ lệ nộp thành công, tỷ lệ audio lên đủ) là gì? — *(liên quan: Mục 7 · cần: PO)*
* [ ] OQ-9: Lý do nghiệp vụ của các hằng số: 35 MiB tổng, 10 MiB mỗi file, ghi tối đa 40/120/60 giây, chuẩn bị 60 giây, 12/90/22 từ, giới hạn 18 và 20 câu, đồng bộ 15 giây, timeout tải 120 giây, trần 24 giờ cho phiên bản, độ trễ đẩy hàng đợi 10 giây. Code chỉ giải thích một số bằng comment kỹ thuật. — *(liên quan: BR-023 · cần: PO/dev)*
* [ ] OQ-10: Việc sinh follow-up lấy khóa dịch vụ "OpenAI nếu có, nếu không thì Anthropic", nhưng yêu cầu luôn gửi tới endpoint OpenAI với model cố định; nếu chỉ có khóa Anthropic thì lời gọi sẽ lỗi và rơi về câu canned. Ý đồ là gì? — *(liên quan: FR-049, BR-021 · cần: dev)*
* [ ] OQ-11: Đồng hồ chuẩn bị Part 2 khởi tạo một lần ở 60 và không được đặt lại giữa các lần vào bước chuẩn bị; bank hiện chỉ có 1 mục Part 2 nên chưa lộ. Nếu thêm mục Part 2 thứ hai thì chuẩn bị sẽ thế nào? — *(liên quan: FR-022 · cần: dev)*
* [ ] OQ-12: Khi nối lại lượt thi dở, phòng thi hiển thị tiến độ theo các câu đã có nhưng vẫn bắt đầu từ câu đầu tiên (chỉ số bước khởi tạo 0) và không có bản ghi nào để nghe lại/tải lên lại ngoài bản sao thiết bị. Hành vi mong muốn khi học viên quay lại giữa chừng là gì? — *(liên quan: FR-014 · cần: PO/UX)*
* [ ] OQ-13: Thư mục tuyến đường mang tên `_proto` và nhãn màn "S07/S10" cho thấy có thể đây là giao diện nguyên mẫu hay đã là sản phẩm? Phòng thi `/exam` có phải màn chính thức không? — *(liên quan: Mục 10, assumptions · cần: PO)*
* [ ] OQ-14: Cổng pilot chỉ kiểm khi tạo lượt thi; route tải audio lên không kiểm lại cổng. Học viên có lượt thi từ trước khi đóng cổng vẫn tải lên được. Có chủ ý không? — *(liên quan: FR-011, FR-032 · cần: PO/dev)*
* [ ] OQ-15: Chỉ số "hết giờ" của Part (nhãn thời lượng gợi ý) chỉ hiển thị, không ép buộc; có cần giới hạn cứng không? — *(liên quan: FR-028 · cần: PO)*
* [ ] OQ-16: Nghe lại audio có chỉ dành cho lượt thi đã nộp không? Route tải audio về chỉ kiểm quyền, không kiểm trạng thái lượt thi, nên lượt "đang làm" cũng nghe được. Tiêu đề use case đã bỏ chữ "đã nộp" vì code không đòi hỏi. — *(liên quan: FR-052, uc-nghe-lai-audio · cần: PO)*

## 2. Gaps (nguồn thiếu hẳn)

| Mục spec | Thiếu gì | Hệ quả nếu không bổ sung | Cần ai bổ sung |
|----------|----------|--------------------------|----------------|
| Mục 3 (mọi FR) | Priority P0/P1/P2 | Không sắp xếp được thứ tự triển khai/kiểm thử | PO |
| Mục 7 | Chỉ số/mốc đạt của thi thử | Không đo được thành công | PO |
| Mục 2 | Persona học viên mục tiêu (trình độ, mục tiêu band) | Không đánh giá được độ phù hợp của câu mẫu và ngưỡng số từ | PO |
| Mục 6 (E-001, E-014..E-031) | Wording hiển thị cho học viên của lỗi khởi tạo và lỗi tải lên (client chỉ ghi console) | Học viên không biết vì sao thất bại cho tới khi nộp | PO/UX |
| Mục 6 (E-037) | Wording/giao diện khi mic bị từ chối | Học viên có thể "trả lời" mà không có audio | PO/UX |
| FR-050 | Thiết kế luồng hỏi nối tiếp bằng AI trong phòng thi (khi nào, từ transcript nào) | Hai nửa (máy chủ có, client chưa nối) chưa thành tính năng | PO |
| FR-048 | Quy tắc xử lý lượt thi bị bỏ (trạng thái, dọn dẹp, xóa audio) | Lượt "đang làm" tồn đọng; audio lưu vô thời hạn | PO/dev |
| Mục 4 | Số liệu hiệu năng/độ tin cậy kỳ vọng (tỷ lệ tải thành công, thời gian) | NFR chỉ là hằng kỹ thuật | PO/dev |
| Mục 10 | Thiết kế (wireframe) gốc để so sánh | Chỉ có mã giao diện | UX |
| Test | Không có test cho: hành vi ghi âm/hẹn giờ trong phòng thi (tự dừng 40/120/60 giây, chuẩn bị 60 giây), nghe thử giọng, dòng điểm "queued" và việc đẩy hàng đợi khi nộp (không test nào nhắc tới), các nhánh 404/400/503 của route tải lên (lượt thi không tồn tại, lượt đã đóng, kho không sẵn sàng), nhánh "kho không sẵn sàng" của tải về | Các FR tương ứng chỉ có ✅ từ đọc code, không có test chốt | dev/QA |

## 3. Conflicts (nguồn mâu thuẫn)

| Điểm | Nguồn A nói | Nguồn B nói | Ghi chú (ngày/độ tin cậy) |
|------|-------------|-------------|---------------------------|
| C-1: Câu hỏi nối tiếp | Phụ đề màn chọn bài thi: "Giám khảo sẽ hỏi nối tiếp dựa trên câu trả lời của bạn." và chip "Hỏi nối tiếp · dựa trên “{trigger}” trong câu trả lời của bạn" (apps/web/src/features/select/select-screen.tsx:13, apps/web/src/features/exam/components/question-stage.tsx:41) | Nối tiếp là câu cố định trong ngân hàng, cụm trigger cũng cố định, không phụ thuộc lời học viên (packages/api/src/scoring/mock-exam-bank.ts:26-70, apps/web/src/features/exam/use-exam-session.ts:49-57) | Cả hai là code hiện hành; để PO quyết (OQ-2). Không tự chọn bên |
| C-2: Số lần thử khi nộp | Chú thích hằng "Extra upload tries per answer when flushing before submit (after the original upload)" (apps/web/src/features/exam/answer-uploads.ts:5-6) | Vòng lặp chạy `UPLOAD_RETRIES` lần **tổng cộng** (2 lần gửi mỗi bản ghi mỗi lần flush); test khẳng định số lần gọi = UPLOAD_RETRIES (apps/web/src/features/exam/answer-uploads.ts:316; apps/web/src/features/exam/__tests__/answer-uploads.test.ts:133-147) | Test là nguồn hạng nhất; spec ghi 2 lần/flush. Comment lệch nhẹ (🟡) |
| C-3: Tên chế độ | Client dùng "p1/p2/p3" (apps/web/src/features/exam/data.ts:8-9) | Máy chủ dùng "part1/part2/part3" (packages/api/src/scoring/mock-exam-bank.ts:73-78) | Không mâu thuẫn mà là ánh xạ; có test chốt (apps/web/src/features/exam/__tests__/mock-keys-parity.test.ts:10-15) |
| C-4: Mô tả lượt thi trong ý định D-10 | D-10: "Giữ nguyên bảng consent_event ở backend" (docs/product-decisions.md:14) | Không có code nào trong phạm vi feature đọc/ghi bảng đó; hàm consent luôn trả hằng (packages/api/src/exam/consent.ts:12-17) | Không phải mâu thuẫn; ghi để BA biết cờ vẫn còn trong hợp đồng dữ liệu |

## 4. Inferred assumptions (suy đoán cần verify)

* 🟡 Follow-up AI sẽ nối vào phòng thi sau (ý định, code không nói) — hậu thuẫn: có router, có test, có trạng thái "Giám khảo AI đang phân tích câu trả lời…" trong giao diện, có kiểu pha `examiner-thinking` nhưng không nơi nào gọi — *validate: hỏi PO/dev · nếu sai: bỏ FR-049..051 hoặc đưa vào nợ kỹ thuật*
* 🟡 Số từ trong phòng thi cố tình là ước lượng vì transcript chưa có (ý đồ suy đoán) tại thời điểm thi (xem "(Transcript không hiển thị trong phòng thi.)" và test "never renders sample-answer text or a word counter") — *validate: PO · nếu sai: cảnh báo ngắn phải dựa trên chép lời*
* 🔵 Câu trả lời mẫu (SAMPLE_ANSWERS) là dữ liệu demo, chỉ được dùng cho ước lượng số từ; bình luận trong code: "Demo answers for the exam room; the grading bank never carries sample speech." — *validate: dev · nếu sai: câu mẫu có thể lọt vào giao diện*
* 🟡 `_proto` trong đường dẫn không đồng nghĩa là giao diện tạm — *validate: PO · nếu sai: phạm vi spec có thể thuộc bản nguyên mẫu*
* 🟡 Cờ pilot sẽ được mở (LAUNCH_OPEN = true) khi ra mắt rộng — *validate: PO · nếu sai: FR-011 trở thành ràng buộc lâu dài*

## 5. Dead-code / fake-data / cờ tắt (R3)

| Mục | Nghi vấn | Bằng chứng | Nhãn |
|-----|----------|------------|------|
| Sinh câu hỏi nối tiếp bằng AI (router + module + câu canned) | Không có nơi gọi ở client | Định nghĩa: packages/api/src/routers/attempt.ts:144; chỉ có test gọi (packages/api/src/routers/attempt.test.ts:364-514); không có caller trong apps/web (xem negative-search N-1) | 🟡 |
| Trạng thái pha `examiner-thinking` và khối "Giám khảo AI đang phân tích câu trả lời…" | Không có đoạn nào đặt phòng thi vào pha này | apps/web/src/features/exam/types.ts:46, apps/web/src/features/exam/components/live-transcript.tsx:11-22; chỉ test live-transcript dùng (apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx:36) | 🟡 |
| Trạng thái lượt thi `abandoned` | Không có đoạn ghi | packages/db/src/schema/attempt.ts:13; chỉ đọc ở packages/api/src/routers/attempt.ts:233-235 (N-2) | 🟡 |
| Hàm chép lời "lenient" (trả câu mẫu cứng khi thiếu khóa, trả rỗng khi lỗi) | Không có caller ngoài test; test ghi chú "used by the exam flow" nhưng không thấy dùng | packages/api/src/exam/transcribe.ts:72-109; packages/api/src/scoring/openai-client.test.ts:15-18 (N-3) | 🟡 |
| Hàm xác nhận đồng ý (consent) trả hằng | Tham số bị bỏ qua; có ý nghĩa là "luôn đồng ý" | packages/api/src/exam/consent.ts:8-17 | ✅ (hành vi) / 🟡 (ý đồ) |
| Dữ liệu câu trả lời mẫu trong client | Dữ liệu demo cố định cho 6 mục | apps/web/src/features/exam/data.ts:18-49 | 🟡 |
| Số từ mô phỏng (2,6 từ/giây) | "simulated" theo comment | apps/web/src/features/exam/use-exam-session.ts:16-17, 184-185 | 🟡 |

<details>
<summary>Negative-search (pattern + scope đã grep)</summary>

* **N-1:** `grep -rn "getFollowUp\|generateFollowUp\|examiner-thinking\|getFallbackFollowUp" --include=*.ts --include=*.tsx apps packages` (loại node_modules) → chỉ trả: `apps/web/src/features/exam/types.ts`, `apps/web/src/features/exam/components/live-transcript.tsx`, `apps/web/src/features/exam/components/__tests__/live-transcript.test.tsx`, `packages/api/src/routers/attempt.ts`, `packages/api/src/routers/attempt.test.ts`, `packages/api/src/exam/follow-up.ts`, `packages/api/src/exam/fallback-data.ts`, `packages/api/src/exam/follow-up.test.ts`. Không có file nào trong `apps/web` gọi router ngoài kiểu và component giao diện → không có caller thực.
* **N-2:** `grep -rn "status: \"abandoned\"\|\"abandoned\"" apps packages --include=*.ts --include=*.tsx` (loại node_modules) → chỉ khai báo kiểu/enum (`packages/db/src/schema/attempt.ts`, `packages/api/src/scoring/types.ts`), đọc (`packages/api/src/routers/attempt.ts:234`), một comment (`apps/web/src/features/results/results-screen.tsx:199`) và test. Không có lệnh ghi. `grep -n "attempt\|in_progress" apps/server/src/scheduled.ts` → không có kết quả (cron không dọn lượt thi).
* **N-3:** `grep -rn "transcribeAudio(" --include=*.ts apps packages` → chỉ định nghĩa (`packages/api/src/exam/transcribe.ts:72`) và 1 lời gọi trong test (`packages/api/src/scoring/openai-client.test.ts:15`). `transcribeAudioStrict` được dùng bởi `packages/api/src/scoring/openai-client.ts:55`.
* **N-4:** `grep -rn "FEATURES\." apps/web/src/features/exam apps/web/src/features/select` → không có kết quả: phòng thi và màn chọn bài thi không bị cờ tính năng toàn cục (`apps/web/src/lib/feature-flags.ts`) chặn. Cờ chỉ xuất hiện ở billing/results (ngoài phạm vi).
* **N-5:** `grep -rn "recorder\.\(status\|isRecording\)\|useRecorder" apps/web/src` (loại __tests__) → chỉ `use-exam-session.ts:5,81` dùng `useRecorder` và không đọc `status`; `onboarding/components/mic-check.tsx` dùng trạng thái của hook khác (`useMicLevel`). Xác nhận phòng thi không xử lý mic bị từ chối.
* **N-6:** `grep -rn "LAUNCH_OPEN\|LAUNCH_ALLOWED" apps packages --include=*.ts --include=*.tsx` → chỉ `packages/infra/alchemy.run.ts`, `packages/api/src/context.ts`, `packages/api/src/routers/attempt.ts` và test; `apps/server/src/index.ts` không kiểm cổng (ứng với OQ-14).
* **N-7:** `grep -n "Attempt not found\|Cannot upload to finalized\|Storage unavailable" apps/server/src/index.test.ts` → không có kết quả cho "Attempt not found" và "Cannot upload to finalized"; "Storage unavailable" không có (chỉ các test 503 của kích thước). Dùng làm căn cứ ghi "không có test" ở E-023, E-025, E-030.
</details>
